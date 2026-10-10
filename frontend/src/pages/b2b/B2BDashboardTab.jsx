import React from 'react';
import { 
  Building2, Calendar, CheckCircle2, Clock, XCircle, DollarSign, Gift, Tag, 
  TrendingUp, ArrowUpRight, Hotel, Car, Compass, ChevronRight, Users, 
  ShieldCheck, Wallet, Plane, Wand2, ArrowRight, Lock, AlertCircle, Sparkles
} from 'lucide-react';

export default function B2BDashboardTab({ 
  dashboardData, 
  partnerUser,
  onNavigateTab, 
  onSelectService 
}) {
  const metrics = dashboardData?.metrics || {};
  const recentBookings = metrics.recent_bookings || [];

  const hasCommission = Boolean(partnerUser?.allow_commission);
  const hasNonCommission = Boolean(partnerUser?.allow_non_commission);
  const isPendingMode = (partnerUser?.mode_request_status === 'PENDING');
  const requestedMode = partnerUser?.requested_mode;

  return (
    <div className="animate-fade-in">
      {/* Welcome Hero Banner */}
      <div 
        className="card border-0 shadow-sm rounded-4 mb-4 text-white overflow-hidden" 
        style={{ 
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1.5 flex-wrap">
              <span className="badge bg-warning text-dark text-xs fw-bold px-2.5 py-1 rounded-pill">
                OFFICIAL B2B PARTNER
              </span>
              <span className="text-slate-400 text-xs font-monospace">
                Partner ID: {metrics.partner_id || partnerUser?.id}
              </span>
            </div>
            <h3 className="fw-black font-heading mb-1 text-white fs-4">
              {metrics.company_name || partnerUser?.company_name || 'Partner Travel Agency'}
            </h3>
            <p className="text-slate-300 small mb-0">
              WOW GOA Centralized B2B Distribution &amp; Live Reservation Engine
            </p>
          </div>

          {/* Quick Mode Access Buttons (Strictly filtered by Admin permissions) */}
          <div className="d-flex gap-2.5 flex-wrap">
            {hasCommission && (
              <button 
                onClick={() => onNavigateTab('commission_services')}
                className="btn btn-warning text-dark fw-bold rounded-pill px-3.5 py-2 text-xs d-flex align-items-center gap-2 shadow-sm font-heading"
              >
                <Gift size={16} />
                <span>Commission Channel ({partnerUser?.default_commission_rate || 10}%)</span>
              </button>
            )}

            {hasNonCommission && (
              <button 
                onClick={() => onNavigateTab('non_commission_services')}
                className="btn btn-primary text-white fw-bold rounded-pill px-3.5 py-2 text-xs d-flex align-items-center gap-2 shadow-sm font-heading"
              >
                <Tag size={16} />
                <span>Net Wholesale Channel ({partnerUser?.default_net_discount_rate || 10}% OFF)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mode Status & Pending Alert Banner (Case 4) */}
      {isPendingMode && (
        <div className="card border-0 shadow-sm rounded-4 p-3.5 mb-4 bg-white border-start border-4 border-warning">
          <div className="d-flex align-items-start gap-3">
            <div className="p-2 rounded-circle bg-warning bg-opacity-20 text-warning">
              <Clock size={20} />
            </div>
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-warning text-dark text-xs fw-bold px-2 py-0.5 rounded-pill">
                  ADMIN REVIEW IN PROGRESS
                </span>
                <span className="fw-bold text-dark text-xs font-heading">
                  Request for {requestedMode === 'COMMISSION' ? 'Commission Mode' : 'Non-Commission Net Mode'} Submitted
                </span>
              </div>
              <p className="text-muted text-xs mb-0 leading-relaxed">
                Your request to access the secondary pricing mode is currently under administrative verification. 
                You continue to have full access to your approved channel while the second mode remains locked.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('profile')}
              className="btn btn-outline-dark btn-xs rounded-pill px-3 py-1 text-xs fw-semibold text-nowrap"
            >
              View Request Status
            </button>
          </div>
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 position-relative" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted fw-bold text-uppercase d-block" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>Total Bookings</span>
                <div className="fs-2 fw-black text-dark font-heading mt-1 mb-1">{metrics.total_bookings || 0}</div>
                <div className="text-muted small mt-2 d-flex align-items-center gap-1.5 flex-wrap" style={{ fontSize: '12px' }}>
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 rounded-pill fw-semibold">{metrics.completed_bookings || 0} completed</span>
                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-0.5 rounded-pill fw-semibold">{metrics.upcoming_bookings || 0} upcoming</span>
                </div>
              </div>
              <div className="rounded-3 p-2.5 bg-primary bg-opacity-10 text-primary">
                <Calendar size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Commission KPI card (only if commission is enabled) */}
        {hasCommission && (
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 position-relative" style={{ borderTop: '3px solid #10b981' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <span className="text-muted fw-bold text-uppercase d-block" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>Commission Earned</span>
                  <div className="fs-2 fw-black text-success font-heading mt-1 mb-1">
                    ₹{(metrics.total_commission_earned || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-muted small mt-2 d-flex align-items-center gap-1" style={{ fontSize: '12px' }}>
                    <span className="fw-semibold text-secondary">₹{(metrics.total_commission_pending || 0).toLocaleString('en-IN')}</span>
                    <span>accrued pending</span>
                  </div>
                </div>
                <div className="rounded-3 p-2.5 bg-success bg-opacity-10 text-success">
                  <Gift size={22} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Net Bookings KPI card (only if non-commission is enabled) */}
        {hasNonCommission && (
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 position-relative" style={{ borderTop: '3px solid #06b6d4' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <span className="text-muted fw-bold text-uppercase d-block" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>Net Bookings Volume</span>
                  <div className="fs-2 fw-black text-dark font-heading mt-1 mb-1">
                    {metrics.non_commission_bookings || 0}
                  </div>
                  <div className="text-muted small mt-2" style={{ fontSize: '12px' }}>
                    Wholesale B2B purchases
                  </div>
                </div>
                <div className="rounded-3 p-2.5 bg-info bg-opacity-10 text-info">
                  <Tag size={22} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 position-relative" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <span className="text-muted fw-bold text-uppercase d-block" style={{ fontSize: '11px', letterSpacing: '0.6px' }}>Total Sales Volume</span>
                <div className="fs-2 fw-black text-dark font-heading mt-1 mb-1">
                  ₹{(metrics.total_sales_volume || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-muted small mt-2" style={{ fontSize: '12px' }}>
                  Across all WOW Goa inventory
                </div>
              </div>
              <div className="rounded-3 p-2.5 bg-warning bg-opacity-10 text-dark">
                <TrendingUp size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Website Services Direct Showcase */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom flex-wrap gap-2">
          <div>
            <h5 className="fw-bold mb-1 text-dark font-heading fs-5">WOW GOA Service Distribution</h5>
            <span className="text-muted small">Direct access to live shared inventory across all product categories</span>
          </div>
          <span className="badge bg-light text-secondary border px-3 py-1.5 text-xs rounded-pill">
            ● Real-Time D2C + B2B Database Sync
          </span>
        </div>

        <div className="row g-3">
          {/* Self Drive */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div 
              onClick={() => onSelectService('selfdrive')}
              className="p-4 rounded-4 border h-100 cursor-pointer transition-all hover-shadow-md bg-white d-flex flex-column justify-content-between"
              style={{ cursor: 'pointer', borderColor: '#e2e8f0' }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="rounded-3 p-2.5 d-flex align-items-center justify-content-center shadow-xs" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                    <Car size={22} />
                  </div>
                  <span className="badge bg-warning text-dark text-xs fw-bold px-2.5 py-1 rounded-pill">Popular</span>
                </div>
                <h6 className="fw-bold text-dark font-heading mb-1.5 fs-6">Self Drive Holidays</h6>
                <p className="text-secondary small mb-0" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                  Interactive vehicle booking with airport pickup/drop, chauffeur options, and verified fleets.
                </p>
              </div>
              <div className="pt-3 mt-3 border-top border-light-subtle d-flex align-items-center justify-content-between text-warning fw-bold text-xs">
                <span>Book Vehicle</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* B2B Taxi & Chauffeur Mobility */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div 
              onClick={() => onSelectService('taxi')}
              className="p-4 rounded-4 border h-100 cursor-pointer transition-all hover-shadow-md bg-white d-flex flex-column justify-content-between"
              style={{ cursor: 'pointer', borderColor: '#e2e8f0' }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="rounded-3 p-2.5 d-flex align-items-center justify-content-center shadow-xs" style={{ background: 'rgba(255, 107, 53, 0.12)', color: '#FF6B35' }}>
                    <Car size={22} />
                  </div>
                  <span className="badge text-white text-xs fw-bold px-2.5 py-1 rounded-pill" style={{ background: '#FF6B35' }}>Corporate</span>
                </div>
                <h6 className="fw-bold text-dark font-heading mb-1.5 fs-6">Taxi & Chauffeur Mobility</h6>
                <p className="text-secondary small mb-0" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                  B2B airport transfers from Mopa &amp; Dabolim with flight delay radar, meet &amp; greet placards, and partner rates.
                </p>
              </div>
              <div className="pt-3 mt-3 border-top border-light-subtle d-flex align-items-center justify-content-between fw-bold text-xs" style={{ color: '#FF6B35' }}>
                <span>Book Chauffeur Cab</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>


          {/* Trip Packages */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div 
              onClick={() => onSelectService('packages')}
              className="p-4 rounded-4 border h-100 cursor-pointer transition-all hover-shadow-md bg-white d-flex flex-column justify-content-between"
              style={{ cursor: 'pointer', borderColor: '#e2e8f0' }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="rounded-3 p-2.5 d-flex align-items-center justify-content-center shadow-xs" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
                    <Compass size={22} />
                  </div>
                  <span className="badge bg-primary text-white text-xs fw-bold px-2.5 py-1 rounded-pill">Packages</span>
                </div>
                <h6 className="fw-bold text-dark font-heading mb-1.5 fs-6">Trip Packages &amp; Tours</h6>
                <p className="text-secondary small mb-0" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                  Day-wise curated itineraries, North/South Goa sightseeing, watersports, and boat cruises.
                </p>
              </div>
              <div className="pt-3 mt-3 border-top border-light-subtle d-flex align-items-center justify-content-between text-primary fw-bold text-xs">
                <span>Browse Packages</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Hotels */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div 
              onClick={() => onSelectService('hotels')}
              className="p-4 rounded-4 border h-100 cursor-pointer transition-all hover-shadow-md bg-white d-flex flex-column justify-content-between"
              style={{ cursor: 'pointer', borderColor: '#e2e8f0' }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="rounded-3 p-2.5 d-flex align-items-center justify-content-center shadow-xs" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                    <Hotel size={22} />
                  </div>
                  <span className="badge bg-success text-white text-xs fw-bold px-2.5 py-1 rounded-pill">Stays</span>
                </div>
                <h6 className="fw-bold text-dark font-heading mb-1.5 fs-6">Hotels &amp; Beach Resorts</h6>
                <p className="text-secondary small mb-0" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                  Live room inventory of luxury resorts, beachside villas, boutique suites, and amenities.
                </p>
              </div>
              <div className="pt-3 mt-3 border-top border-light-subtle d-flex align-items-center justify-content-between text-success fw-bold text-xs">
                <span>Reserve Room</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Sightseeing & Activities */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div 
              onClick={() => onSelectService('activities')}
              className="p-4 rounded-4 border h-100 cursor-pointer transition-all hover-shadow-md bg-white d-flex flex-column justify-content-between"
              style={{ cursor: 'pointer', borderColor: '#e2e8f0' }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="rounded-3 p-2.5 d-flex align-items-center justify-content-center shadow-xs" style={{ background: 'rgba(244, 63, 94, 0.12)', color: '#e11d48' }}>
                    <Sparkles size={22} />
                  </div>
                  <span className="badge bg-danger text-white text-xs fw-bold px-2.5 py-1 rounded-pill">Experiences</span>
                </div>
                <h6 className="fw-bold text-dark font-heading mb-1.5 fs-6">Sightseeing &amp; Activities</h6>
                <p className="text-secondary small mb-0" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                  Heritage tours, coastal beach sightseeing, scuba diving, and adventure water sports.
                </p>
              </div>
              <div className="pt-3 mt-3 border-top border-light-subtle d-flex align-items-center justify-content-between text-danger fw-bold text-xs">
                <span>Book Experience</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Flights */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div 
              onClick={() => onSelectService('flights')}
              className="p-4 rounded-4 border h-100 cursor-pointer transition-all hover-shadow-md bg-white d-flex flex-column justify-content-between"
              style={{ cursor: 'pointer', borderColor: '#e2e8f0' }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="rounded-3 p-2.5 d-flex align-items-center justify-content-center shadow-xs" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0284c7' }}>
                    <Plane size={22} />
                  </div>
                  <span className="badge bg-info text-white text-xs fw-bold px-2.5 py-1 rounded-pill">Airlines</span>
                </div>
                <h6 className="fw-bold text-dark font-heading mb-1.5 fs-6">Domestic &amp; Regional Flights</h6>
                <p className="text-secondary small mb-0" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                  Flight connections into Goa (GOI / GOX) and major Indian metro hubs.
                </p>
              </div>
              <div className="pt-3 mt-3 border-top border-light-subtle d-flex align-items-center justify-content-between text-info fw-bold text-xs">
                <span>View Flights</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Craft My Trip */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div 
              onClick={() => onSelectService('craft')}
              className="p-4 rounded-4 border h-100 cursor-pointer transition-all hover-shadow-md bg-white d-flex flex-column justify-content-between"
              style={{ cursor: 'pointer', borderColor: '#e2e8f0' }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="rounded-3 p-2.5 d-flex align-items-center justify-content-center shadow-xs" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}>
                    <Wand2 size={22} />
                  </div>
                  <span className="badge bg-warning text-dark text-xs fw-bold px-2.5 py-1 rounded-pill">Bespoke</span>
                </div>
                <h6 className="fw-bold text-dark font-heading mb-1.5 fs-6">Craft My Trip (Tailor-Made)</h6>
                <p className="text-secondary small mb-0" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                  Custom itineraries combining hotels, vehicle rentals, flights, and specialized activities.
                </p>
              </div>
              <div className="pt-3 mt-3 border-top border-light-subtle d-flex align-items-center justify-content-between text-warning fw-bold text-xs">
                <span>Customize Trip</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
          <div>
            <h5 className="fw-bold mb-0 text-dark font-heading fs-5">Recent Agency Reservations</h5>
            <span className="text-muted small">Live tracking of transactions booked under your partner account</span>
          </div>
          <button
            onClick={() => onNavigateTab(hasCommission ? 'commission_bookings' : 'non_commission_bookings')}
            className="btn btn-outline-dark btn-sm rounded-pill px-3.5 py-1.5 text-xs fw-semibold"
          >
            View Full Ledger
          </button>
        </div>

        {recentBookings.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Calendar size={36} className="mx-auto text-muted opacity-40 mb-2 d-block" />
            <p className="mb-1 text-sm fw-bold text-dark">No recent bookings found</p>
            <span className="text-xs text-muted">New bookings created under your agency account will appear here immediately.</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-sm">
              <thead className="table-light text-muted text-uppercase text-xs fw-bold">
                <tr>
                  <th className="py-3 ps-3">Booking ID</th>
                  <th className="py-3">Service</th>
                  <th className="py-3">Guest</th>
                  <th className="py-3">Channel Mode</th>
                  <th className="py-3">Amount</th>
                  <th className="py-3 pe-3 text-end">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.slice(0, 5).map(b => (
                  <tr key={b.id}>
                    <td className="ps-3 font-monospace fw-bold text-dark text-xs py-3">#{b.id}</td>
                    <td className="text-truncate fw-semibold text-dark py-3" style={{ maxWidth: '200px' }}>{b.item_name}</td>
                    <td className="py-3 text-secondary">{b.name}</td>
                    <td className="py-3">
                      <span className={`badge ${b.b2b_mode === 'COMMISSION' ? 'bg-warning text-dark' : 'bg-primary text-white'} text-xs px-2.5 py-1 fw-bold rounded-pill`}>
                        {b.b2b_mode || 'B2B'}
                      </span>
                    </td>
                    <td className="fw-bold text-dark py-3">₹{parseFloat(b.total_amount || 0).toLocaleString()}</td>
                    <td className="pe-3 text-end py-3">
                      {(() => {
                        const st = (b.status || 'Pending').toLowerCase();
                        let badgeStyle = { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' };
                        if (st === 'completed') badgeStyle = { background: '#dcfce7', color: '#059669', border: '1px solid #86efac' };
                        else if (st === 'confirmed') badgeStyle = { background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd' };
                        else if (st === 'cancelled' || st === 'rejected') badgeStyle = { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
                        return (
                          <span className="badge text-xs px-3 py-1 rounded-pill fw-bold text-capitalize" style={badgeStyle}>
                            {b.status || 'Pending'}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
