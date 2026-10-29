import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Search, RefreshCw, CheckCircle, Clock, XCircle, 
  Eye, Mail, Phone, Calendar, Globe, User, Shield, AlertCircle, X, Download
} from 'lucide-react';
import { fetchLeads, updateLeadStatus } from '../../services/api';

export function parseVisaLead(lead) {
  const notes = String(lead.notes || '');
  const getField = (regex) => {
    const m = notes.match(regex);
    return m ? m[1].trim() : '';
  };

  const country = getField(/Country:\s*([^\(\|]+)/i) || lead.country || 'International';
  const flag = getField(/Country:\s*[^\(]+\(([^\)]+)\)/i) || '🌐';
  const visaDuration = getField(/Visa:\s*([^\|]+)/i) || lead.service || 'Tourist Visa';
  const passportNo = getField(/Passport No:\s*([^\|]+)/i) || lead.passport_number || 'Pending';
  const passportExpiry = getField(/Passport Expiry:\s*([^\|]+)/i) || lead.passport_expiry || 'Not specified';
  const arrivalDate = getField(/Arrival Date:\s*([^\|]+)/i) || lead.arrival_date || 'Not specified';
  const documentsStr = getField(/Documents:\s*([^\|]+)/i) || '';
  const documents = documentsStr ? documentsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  return {
    ...lead,
    country,
    flag,
    visaDuration,
    passportNo,
    passportExpiry,
    arrivalDate,
    documents
  };
}

export default function VisaApplicationsManager({ currentUser }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const allLeads = await fetchLeads();
      // Filter for visa applications
      const visaLeads = (Array.isArray(allLeads) ? allLeads : []).filter(l => {
        const src = String(l.source || '').toLowerCase();
        const serv = String(l.service || '').toLowerCase();
        const id = String(l.id || '').toUpperCase();
        return src.includes('visa') || serv.includes('visa') || id.startsWith('VISA-');
      });
      setLeads(visaLeads);
    } catch (err) {
      console.warn('[VisaManager] Failed to load visa applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const parsedLeads = useMemo(() => {
    return leads.map(parseVisaLead);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return parsedLeads.filter(l => {
      // Status filter
      if (statusFilter !== 'ALL') {
        const curStatus = (l.status || 'New').toLowerCase();
        if (statusFilter === 'NEW' && !['new', 'pending', 'pending inquiry'].includes(curStatus)) return false;
        if (statusFilter === 'IN_REVIEW' && !['in review', 'in progress', 'contacted', 'review'].includes(curStatus)) return false;
        if (statusFilter === 'APPROVED' && !['approved', 'qualified', 'booked', 'closed-won'].includes(curStatus)) return false;
        if (statusFilter === 'REJECTED' && !['rejected', 'closed-lost'].includes(curStatus)) return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const str = `${l.id} ${l.name} ${l.email} ${l.phone} ${l.country} ${l.passportNo} ${l.visaDuration}`.toLowerCase();
        if (!str.includes(q)) return false;
      }

      return true;
    });
  }, [parsedLeads, statusFilter, search]);

  // Status stats
  const stats = useMemo(() => {
    const total = parsedLeads.length;
    const newCount = parsedLeads.filter(l => ['new', 'pending', 'pending inquiry'].includes((l.status || 'New').toLowerCase())).length;
    const inReview = parsedLeads.filter(l => ['in review', 'in progress', 'contacted', 'review'].includes((l.status || '').toLowerCase())).length;
    const approved = parsedLeads.filter(l => ['approved', 'qualified', 'booked', 'closed-won'].includes((l.status || '').toLowerCase())).length;
    const rejected = parsedLeads.filter(l => ['rejected', 'closed-lost'].includes((l.status || '').toLowerCase())).length;
    return { total, newCount, inReview, approved, rejected };
  }, [parsedLeads]);

  const handleStatusChange = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    try {
      await updateLeadStatus(leadId, newStatus, currentUser);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => ({ ...prev, status: newStatus }));
      }
      setFeedbackMsg({ type: 'success', text: `Status updated to ${newStatus}` });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err) {
      setFeedbackMsg({ type: 'danger', text: `Failed to update status: ${err.message}` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status = 'New') => {
    const s = String(status).toLowerCase();
    if (['new', 'pending', 'pending inquiry'].includes(s)) {
      return <span className="badge bg-warning text-dark px-2.5 py-1.5 fw-bold" style={{ fontSize: '11px' }}>🟡 New Application</span>;
    }
    if (['in review', 'in progress', 'contacted', 'review'].includes(s)) {
      return <span className="badge bg-primary text-white px-2.5 py-1.5 fw-bold" style={{ fontSize: '11px' }}>🔵 In Review</span>;
    }
    if (['approved', 'qualified', 'booked', 'closed-won'].includes(s)) {
      return <span className="badge bg-success text-white px-2.5 py-1.5 fw-bold" style={{ fontSize: '11px' }}>🟢 Approved</span>;
    }
    if (['rejected', 'closed-lost'].includes(s)) {
      return <span className="badge bg-danger text-white px-2.5 py-1.5 fw-bold" style={{ fontSize: '11px' }}>🔴 Rejected</span>;
    }
    return <span className="badge bg-secondary text-white px-2.5 py-1.5 fw-bold" style={{ fontSize: '11px' }}>{status}</span>;
  };

  return (
    <div className="container-fluid p-0">
      
      {/* ── HEADER BANNER ── */}
      <div className="bg-white border rounded-3 p-4 mb-4 shadow-sm">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="p-2 rounded bg-warning bg-opacity-10 text-warning d-inline-flex">
                <FileText size={22} />
              </span>
              <h4 className="fw-bold text-dark m-0">Tourist Visa Applications</h4>
            </div>
            <p className="text-muted small m-0">
              Manage incoming tourist visa requests, review passport documents, and update application status.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5 px-3 py-2 fw-semibold"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        {feedbackMsg && (
          <div className={`alert alert-${feedbackMsg.type} py-2 px-3 small mt-3 mb-0 d-flex align-items-center justify-content-between`}>
            <span>{feedbackMsg.text}</span>
            <button type="button" className="btn-close btn-sm p-1" onClick={() => setFeedbackMsg(null)}></button>
          </div>
        )}

        {/* ── METRICS TILES ── */}
        <div className="row g-3 mt-2">
          <div className="col-6 col-md-3">
            <div 
              className={`p-3 rounded-3 border text-start cursor-pointer transition ${statusFilter === 'ALL' ? 'border-primary bg-primary bg-opacity-10' : 'bg-light hover-bg-white'}`}
              onClick={() => setStatusFilter('ALL')}
            >
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '11px' }}>Total Applications</div>
              <div className="fs-3 fw-bold text-dark mt-1">{stats.total}</div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div 
              className={`p-3 rounded-3 border text-start cursor-pointer transition ${statusFilter === 'NEW' ? 'border-warning bg-warning bg-opacity-10' : 'bg-light hover-bg-white'}`}
              onClick={() => setStatusFilter('NEW')}
            >
              <div className="text-warning small fw-bold text-uppercase" style={{ fontSize: '11px' }}>New / Pending Review</div>
              <div className="fs-3 fw-bold text-warning mt-1">{stats.newCount}</div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div 
              className={`p-3 rounded-3 border text-start cursor-pointer transition ${statusFilter === 'IN_REVIEW' ? 'border-primary bg-primary bg-opacity-10' : 'bg-light hover-bg-white'}`}
              onClick={() => setStatusFilter('IN_REVIEW')}
            >
              <div className="text-primary small fw-bold text-uppercase" style={{ fontSize: '11px' }}>In Review</div>
              <div className="fs-3 fw-bold text-primary mt-1">{stats.inReview}</div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div 
              className={`p-3 rounded-3 border text-start cursor-pointer transition ${statusFilter === 'APPROVED' ? 'border-success bg-success bg-opacity-10' : 'bg-light hover-bg-white'}`}
              onClick={() => setStatusFilter('APPROVED')}
            >
              <div className="text-success small fw-bold text-uppercase" style={{ fontSize: '11px' }}>Approved</div>
              <div className="fs-3 fw-bold text-success mt-1">{stats.approved}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="bg-white border rounded-3 p-3 mb-3 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="position-relative" style={{ maxWidth: '380px', width: '100%' }}>
          <Search size={15} className="position-absolute text-muted" style={{ top: '10px', left: '12px' }} />
          <input
            type="text"
            className="form-control form-control-sm ps-5"
            placeholder="Search by name, reference #, passport, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button 
              type="button" 
              className="btn btn-sm btn-link position-absolute p-0 text-muted" 
              style={{ top: '7px', right: '10px' }}
              onClick={() => setSearch('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="d-flex align-items-center gap-1.5 flex-wrap">
          <span className="text-muted small fw-semibold me-1">Filter:</span>
          {['ALL', 'NEW', 'IN_REVIEW', 'APPROVED', 'REJECTED'].map(sf => (
            <button
              key={sf}
              type="button"
              className={`btn btn-sm ${statusFilter === sf ? 'btn-dark' : 'btn-outline-secondary'}`}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
              onClick={() => setStatusFilter(sf)}
            >
              {sf.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── APPLICATIONS TABLE ── */}
      <div className="bg-white border rounded-3 shadow-sm overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="table-light text-muted fw-bold" style={{ fontSize: '11.5px', textTransform: 'uppercase' }}>
              <tr>
                <th style={{ width: '150px' }}>Reference #</th>
                <th>Applicant Details</th>
                <th>Nationality</th>
                <th>Visa Duration</th>
                <th>Passport Details</th>
                <th>Arrival Date</th>
                <th>Documents</th>
                <th>Status</th>
                <th className="text-end" style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <RefreshCw size={20} className="spin mb-2 d-block mx-auto" />
                    Loading tourist visa applications...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <FileText size={28} className="text-muted opacity-50 mb-2 d-block mx-auto" />
                    No tourist visa applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr key={lead.id} className={selectedLead?.id === lead.id ? 'table-active' : ''}>
                    
                    {/* 1. REFERENCE ID */}
                    <td>
                      <span className="fw-bold text-dark font-monospace" style={{ fontSize: '12px' }}>
                        #{lead.id}
                      </span>
                      <div className="text-muted" style={{ fontSize: '10.5px' }}>
                        {lead.created_at ? lead.created_at.split(' ')[0] : 'Today'}
                      </div>
                    </td>

                    {/* 2. APPLICANT */}
                    <td>
                      <div className="fw-bold text-dark">{lead.name || 'Valued Applicant'}</div>
                      <div className="text-muted small d-flex align-items-center gap-1">
                        <Mail size={11} className="text-muted" /> {lead.email || 'No email'}
                      </div>
                      <div className="text-muted small d-flex align-items-center gap-1">
                        <Phone size={11} className="text-muted" /> {lead.phone || 'No phone'}
                      </div>
                    </td>

                    {/* 3. NATIONALITY */}
                    <td>
                      <span className="fs-5 me-1">{lead.flag}</span>
                      <span className="fw-semibold text-dark">{lead.country}</span>
                    </td>

                    {/* 4. VISA DURATION */}
                    <td>
                      <span className="badge bg-light text-dark border fw-bold px-2 py-1">
                        {lead.visaDuration}
                      </span>
                    </td>

                    {/* 5. PASSPORT */}
                    <td>
                      <div className="fw-bold text-dark font-monospace">{lead.passportNo}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>
                        Exp: {lead.passportExpiry}
                      </div>
                    </td>

                    {/* 6. ARRIVAL DATE */}
                    <td>
                      <div className="d-flex align-items-center gap-1 fw-semibold text-dark">
                        <Calendar size={13} className="text-warning" />
                        {lead.arrivalDate}
                      </div>
                    </td>

                    {/* 7. DOCUMENTS */}
                    <td>
                      {lead.documents && lead.documents.length > 0 ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success fw-bold px-2 py-1">
                          📄 {lead.documents.length} File{lead.documents.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-muted small">None</span>
                      )}
                    </td>

                    {/* 8. STATUS */}
                    <td>
                      <div className="dropdown d-inline-block">
                        <button
                          className="btn btn-sm p-0 border-0 dropdown-toggle"
                          type="button"
                          data-bs-toggle="dropdown"
                          disabled={updatingId === lead.id}
                        >
                          {getStatusBadge(lead.status)}
                        </button>
                        <ul className="dropdown-menu shadow-sm" style={{ fontSize: '12px' }}>
                          <li><button className="dropdown-item" onClick={() => handleStatusChange(lead.id, 'New')}>🟡 Mark as New</button></li>
                          <li><button className="dropdown-item" onClick={() => handleStatusChange(lead.id, 'In Review')}>🔵 Mark In Review</button></li>
                          <li><button className="dropdown-item text-success" onClick={() => handleStatusChange(lead.id, 'Approved')}>🟢 Mark as Approved</button></li>
                          <li><button className="dropdown-item text-danger" onClick={() => handleStatusChange(lead.id, 'Rejected')}>🔴 Mark as Rejected</button></li>
                        </ul>
                      </div>
                    </td>

                    {/* 9. ACTIONS */}
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm px-2.5 py-1 d-inline-flex align-items-center gap-1"
                        style={{ fontSize: '11.5px' }}
                        onClick={() => setSelectedLead(lead)}
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── APPLICATION DETAILS MODAL ── */}
      {selectedLead && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
          onClick={() => setSelectedLead(null)}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-lg" 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-content shadow-lg border-0 rounded-4">
              
              {/* MODAL HEADER */}
              <div className="modal-header bg-dark text-white rounded-top-4 px-4 py-3">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-warning text-dark fw-bold">Tourist Visa Request</span>
                    <h5 className="modal-title fw-bold m-0 font-monospace">#{selectedLead.id}</h5>
                  </div>
                  <div className="text-white-50 small mt-1">Submitted on {selectedLead.created_at || 'Recently'}</div>
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setSelectedLead(null)}
                />
              </div>

              {/* MODAL BODY */}
              <div className="modal-body p-4">
                
                {/* APPLICANT CARD */}
                <div className="bg-light p-3 rounded-3 border mb-3">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '10.5px' }}>Applicant Full Name</label>
                      <div className="fw-bold fs-6 text-dark">{selectedLead.name}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '10.5px' }}>Country / Nationality</label>
                      <div className="fw-bold fs-6 text-dark">{selectedLead.flag} {selectedLead.country}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '10.5px' }}>Email Address</label>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold text-dark">{selectedLead.email}</span>
                        {selectedLead.email && (
                          <a href={`mailto:${selectedLead.email}`} className="btn btn-outline-primary btn-sm p-1 py-0" title="Send Email">
                            <Mail size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '10.5px' }}>Phone Number</label>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold text-dark">{selectedLead.phone}</span>
                        {selectedLead.phone && (
                          <a href={`tel:${selectedLead.phone}`} className="btn btn-outline-success btn-sm p-1 py-0" title="Call">
                            <Phone size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PASSPORT & TRAVEL DETAILS */}
                <div className="card border p-3 mb-3">
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Passport &amp; Travel Specifications</h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '10.5px' }}>Visa Type</label>
                      <span className="badge bg-primary text-white px-2.5 py-1.5 fw-bold">{selectedLead.visaDuration}</span>
                    </div>
                    <div className="col-md-4">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '10.5px' }}>Passport Number</label>
                      <div className="fw-bold font-monospace text-dark fs-6">{selectedLead.passportNo}</div>
                    </div>
                    <div className="col-md-4">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '10.5px' }}>Passport Expiry Date</label>
                      <div className="fw-semibold text-dark">{selectedLead.passportExpiry}</div>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '10.5px' }}>Expected Date of Arrival</label>
                      <div className="fw-bold text-warning d-flex align-items-center gap-1">
                        <Calendar size={14} /> {selectedLead.arrivalDate}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ fontSize: '10.5px' }}>Current Application Status</label>
                      <div>{getStatusBadge(selectedLead.status)}</div>
                    </div>
                  </div>
                </div>

                {/* DOCUMENTS SECTION */}
                <div className="card border p-3 mb-3">
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-2">Attached Documents</h6>
                  {selectedLead.documents && selectedLead.documents.length > 0 ? (
                    <div className="d-flex flex-column gap-2 mt-2">
                      {selectedLead.documents.map((doc, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-light border d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2 text-truncate">
                            <FileText size={16} className="text-primary flex-shrink-0" />
                            <span className="fw-semibold text-dark small text-truncate">{doc}</span>
                          </div>
                          <span className="badge bg-secondary text-white small">Uploaded via Web</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted small m-0 py-1">No separate document files uploaded or files linked in lead notes.</p>
                  )}
                </div>

                {/* RAW NOTES */}
                {selectedLead.notes && (
                  <div className="p-2.5 rounded bg-light border text-muted small" style={{ fontSize: '11.5px', whiteSpace: 'pre-wrap' }}>
                    <strong>System Log:</strong> {selectedLead.notes}
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="modal-footer bg-light px-4 py-2.5 d-flex justify-content-between">
                <div className="d-flex align-items-center gap-1.5">
                  <span className="text-muted small fw-bold me-1">Change Status:</span>
                  <button 
                    type="button" 
                    className="btn btn-outline-warning btn-sm"
                    onClick={() => handleStatusChange(selectedLead.id, 'New')}
                  >
                    New
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleStatusChange(selectedLead.id, 'In Review')}
                  >
                    In Review
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-success btn-sm"
                    onClick={() => handleStatusChange(selectedLead.id, 'Approved')}
                  >
                    Approved
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleStatusChange(selectedLead.id, 'Rejected')}
                  >
                    Rejected
                  </button>
                </div>

                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm px-3" 
                  onClick={() => setSelectedLead(null)}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
