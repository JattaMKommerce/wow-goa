import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, Filter, Phone, MessageSquare, ExternalLink, 
  CheckCircle2, Clock, AlertCircle, RefreshCw, Car, Hotel, 
  Sparkles, Gift, Tag, Edit3, Save, Copy, Check, ArrowUpRight, Flame
} from 'lucide-react';
import { fetchStorefrontLeads, updateStorefrontLead } from '../../services/api';

export default function AdminStorefrontLeadsTab() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNBOOKED' | 'CONVERTED'
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'vehicle' | 'hotel'
  
  // Note editing state
  const [editingId, setEditingId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNoteId, setSavingNoteId] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(null);

  const loadLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStorefrontLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch visitor leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleCopyPhone = (phone) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleSaveNote = async (id) => {
    setSavingNoteId(id);
    try {
      const res = await updateStorefrontLead(id, noteText);
      if (res && res.success) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, notes: noteText } : l));
        setEditingId(null);
      }
    } catch (e) {
      alert('Failed to save note.');
    } finally {
      setSavingNoteId(null);
    }
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    const unbooked = leads.filter(l => l.status === 'unbooked').length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';
    return { total, unbooked, converted, conversionRate };
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = 
        !searchTerm.trim() ||
        (l.name && l.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.phone && l.phone.includes(searchTerm)) ||
        (l.vendor_title && l.vendor_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.converted_booking_id && String(l.converted_booking_id).toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'ALL' || 
        (statusFilter === 'UNBOOKED' && l.status === 'unbooked') ||
        (statusFilter === 'CONVERTED' && l.status === 'converted');

      const matchesType = 
        typeFilter === 'ALL' || 
        (l.vendor_type && l.vendor_type.toLowerCase() === typeFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [leads, searchTerm, statusFilter, typeFilter]);

  return (
    <div className="admin-storefront-leads-wrapper p-3 p-md-4">
      {/* ─── Header & Title ─── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-black text-dark mb-0 font-heading">
              Storefront Visitor Leads &amp; Inquiries
            </h4>
            <span className="badge bg-warning text-dark border px-2.5 py-1 text-xs fw-bold">
              Admin &amp; Super Admin Only
            </span>
          </div>
          <p className="text-secondary small mb-0 mt-0.5">
            Real-time contact details of tourists who visited vendor websites and claimed ₹500 discount vouchers before or after booking.
          </p>
        </div>

        <button 
          type="button" 
          className="btn btn-outline-dark btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-xs"
          onClick={loadLeads}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh Leads'}</span>
        </button>
      </div>

      {/* ─── Metric Cards ─── */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs h-100">
            <div className="text-secondary fw-bold text-xs text-uppercase mb-1">Total Inquiries Captured</div>
            <div className="fs-3 fw-black text-dark">{metrics.total}</div>
            <div className="text-muted text-xxs mt-1">Tourists with Name &amp; Phone</div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="p-3 rounded-4 border shadow-xs h-100" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
            <div className="text-amber-800 fw-bold text-xs text-uppercase mb-1 d-flex align-items-center gap-1">
              <Flame size={14} className="text-danger" />
              <span>Unbooked Leads (Follow Up)</span>
            </div>
            <div className="fs-3 fw-black text-amber-900">{metrics.unbooked}</div>
            <div className="text-amber-700 text-xxs mt-1 fw-medium">Hot leads for Sales Team to call</div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="p-3 rounded-4 border shadow-xs h-100" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <div className="text-emerald-800 fw-bold text-xs text-uppercase mb-1 d-flex align-items-center gap-1">
              <CheckCircle2 size={14} className="text-success" />
              <span>Converted into Bookings</span>
            </div>
            <div className="fs-3 fw-black text-emerald-900">{metrics.converted}</div>
            <div className="text-emerald-700 text-xxs mt-1 fw-medium">Confirmed orders placed</div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs h-100">
            <div className="text-secondary fw-bold text-xs text-uppercase mb-1">Conversion Rate</div>
            <div className="fs-3 fw-black text-primary">{metrics.conversionRate}%</div>
            <div className="text-muted text-xxs mt-1">Visitors converting to paying customers</div>
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="p-3 bg-white rounded-4 border shadow-xs mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 py-2 text-sm" 
                placeholder="Search by customer name, phone number, vendor shop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4">
            <div className="d-flex gap-1.5 flex-wrap">
              <button 
                type="button" 
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs ${statusFilter === 'ALL' ? 'btn-dark text-white' : 'btn-light text-secondary border'}`}
                onClick={() => setStatusFilter('ALL')}
              >
                All ({metrics.total})
              </button>
              <button 
                type="button" 
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs ${statusFilter === 'UNBOOKED' ? 'btn-warning text-dark' : 'btn-light text-secondary border'}`}
                onClick={() => setStatusFilter('UNBOOKED')}
              >
                🔥 Unbooked ({metrics.unbooked})
              </button>
              <button 
                type="button" 
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs ${statusFilter === 'CONVERTED' ? 'btn-success text-white' : 'btn-light text-secondary border'}`}
                onClick={() => setStatusFilter('CONVERTED')}
              >
                ✓ Booked ({metrics.converted})
              </button>
            </div>
          </div>

          <div className="col-md-3 text-md-end">
            <div className="d-inline-flex gap-1">
              <button 
                type="button" 
                className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-semibold ${typeFilter === 'ALL' ? 'btn-secondary text-white' : 'btn-outline-secondary'}`}
                onClick={() => setTypeFilter('ALL')}
              >
                All Fleet
              </button>
              <button 
                type="button" 
                className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-semibold ${typeFilter === 'vehicle' ? 'btn-secondary text-white' : 'btn-outline-secondary'}`}
                onClick={() => setTypeFilter('vehicle')}
              >
                🚗 Vehicles
              </button>
              <button 
                type="button" 
                className={`btn btn-sm rounded-pill px-2.5 py-1 text-xs fw-semibold ${typeFilter === 'hotel' ? 'btn-secondary text-white' : 'btn-outline-secondary'}`}
                onClick={() => setTypeFilter('hotel')}
              >
                🏨 Hotels
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Leads Table / Cards ─── */}
      {loading ? (
        <div className="text-center py-5 bg-white rounded-4 border">
          <div className="spinner-border text-warning mb-2" role="status" />
          <div className="fw-bold text-dark">Loading Storefront Inquiries...</div>
        </div>
      ) : filteredLeads.length > 0 ? (
        <div className="bg-white rounded-4 border shadow-xs overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-xs text-uppercase text-secondary fw-bold">
                <tr>
                  <th className="py-3 px-3">Customer Contact</th>
                  <th className="py-3 px-3">Vendor Dynamic Site</th>
                  <th className="py-3 px-3">Claimed Offer</th>
                  <th className="py-3 px-3">Conversion Status</th>
                  <th className="py-3 px-3">Follow-up Notes</th>
                  <th className="py-3 px-3 text-end">Direct Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredLeads.map(lead => {
                  const cleanPhone = String(lead.phone || '').replace(/\D/g, '');
                  const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                  const waMessage = encodeURIComponent(`Hi ${lead.name || 'Valued Guest'}! We noticed you claimed a ₹500 discount voucher on ${lead.vendor_title || 'WOW GOA'}. Need any assistance with vehicle availability or booking?`);
                  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;
                  const isConverted = lead.status === 'converted';

                  return (
                    <tr key={lead.id} className={!isConverted ? 'table-warning-subtle' : ''}>
                      {/* Customer Details */}
                      <td className="py-3 px-3">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-dark text-white fw-bold d-flex align-items-center justify-content-center shadow-2xs" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                            {(lead.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-black text-dark">{lead.name || 'Guest Visitor'}</div>
                            <div className="d-flex align-items-center gap-1.5 mt-0.5">
                              <span className="font-monospace text-dark fw-bold text-xs">{lead.phone}</span>
                              <button 
                                type="button" 
                                className="btn btn-link p-0 text-muted" 
                                onClick={() => handleCopyPhone(lead.phone)}
                                title="Copy mobile number"
                              >
                                {copiedPhone === lead.phone ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                              </button>
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                              Inquired: {lead.created_at || 'Recently'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Vendor Storefront Visited */}
                      <td className="py-3 px-3">
                        <div className="d-flex align-items-center gap-1.5">
                          {lead.vendor_type === 'hotel' ? <Hotel size={14} className="text-primary" /> : <Car size={14} className="text-warning" />}
                          <strong className="text-dark">{lead.vendor_title || 'Direct Storefront'}</strong>
                        </div>
                        {lead.vendor_slug && (
                          <div className="mt-1">
                            <a 
                              href={`/v/${lead.vendor_slug}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="badge bg-light text-secondary border text-xxs text-decoration-none d-inline-flex align-items-center gap-1"
                            >
                              <span>/v/{lead.vendor_slug}</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Claimed Offer */}
                      <td className="py-3 px-3">
                        <span className="badge bg-warning bg-opacity-25 text-dark border border-warning border-opacity-50 px-2.5 py-1 text-xs fw-bold font-monospace">
                          {lead.discount_code || 'WOW500'} (₹{Number(lead.discount_amount || 500)})
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {isConverted ? (
                          <div>
                            <span className="badge bg-success rounded-pill px-2.5 py-1 text-xs fw-bold d-inline-flex align-items-center gap-1">
                              <CheckCircle2 size={12} />
                              <span>Booked #{lead.converted_booking_id}</span>
                            </span>
                            {lead.converted_booking_item && (
                              <div className="text-muted small mt-1">
                                {lead.converted_booking_item} {lead.converted_booking_amount ? `• ₹${Number(lead.converted_booking_amount).toLocaleString('en-IN')}` : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="badge rounded-pill px-2.5 py-1 text-xs fw-bold d-inline-flex align-items-center gap-1" style={{ background: '#FFEDD5', color: '#9A3412', border: '1px solid #FDBA74' }}>
                              <Flame size={12} className="text-danger" />
                              <span>🔥 Unbooked Lead</span>
                            </span>
                            <div className="text-secondary mt-1" style={{ fontSize: '0.72rem' }}>
                              Claimed discount, not booked yet. Call now!
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Follow-up Notes */}
                      <td className="py-3 px-3" style={{ minWidth: '220px' }}>
                        {editingId === lead.id ? (
                          <div className="d-flex align-items-center gap-1">
                            <input 
                              type="text" 
                              className="form-control form-control-sm text-xs py-1 px-2"
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="e.g. Called, interested in Thar..."
                              autoFocus
                            />
                            <button 
                              type="button" 
                              className="btn btn-sm btn-dark py-1 px-2 text-xs"
                              onClick={() => handleSaveNote(lead.id)}
                              disabled={savingNoteId === lead.id}
                            >
                              <Save size={12} />
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-sm btn-light border py-1 px-2 text-xs"
                              onClick={() => setEditingId(null)}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center justify-content-between gap-1">
                            <span className="text-secondary text-xs fst-italic">
                              {lead.notes ? `"${lead.notes}"` : 'No notes added yet'}
                            </span>
                            <button 
                              type="button" 
                              className="btn btn-link p-0 text-muted"
                              onClick={() => {
                                setEditingId(lead.id);
                                setNoteText(lead.notes || '');
                              }}
                              title="Add / edit admin note"
                            >
                              <Edit3 size={13} />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Direct Actions */}
                      <td className="py-3 px-3 text-end">
                        <div className="d-inline-flex gap-1.5">
                          <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="btn btn-sm btn-success rounded-pill px-2.5 py-1 text-xs fw-bold d-inline-flex align-items-center gap-1 shadow-2xs"
                            title="Chat on WhatsApp to close booking"
                          >
                            <MessageSquare size={13} />
                            <span>WhatsApp</span>
                          </a>
                          <a 
                            href={`tel:${cleanPhone}`} 
                            className="btn btn-sm btn-outline-dark rounded-pill px-2.5 py-1 text-xs fw-bold d-inline-flex align-items-center gap-1"
                            title="Call customer directly"
                          >
                            <Phone size={13} />
                            <span>Call</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-5 bg-white rounded-4 border p-4">
          <Users size={42} className="text-muted mb-2" />
          <h5 className="fw-bold text-dark">No Storefront Inquiries Found</h5>
          <p className="text-muted small mb-0">
            When tourists land on any vendor's dynamic website and claim their discount voucher, their details will automatically show up here.
          </p>
        </div>
      )}
    </div>
  );
}
