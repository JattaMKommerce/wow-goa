import React, { useState, useEffect } from 'react';
import { 
  FileText, TrendingUp, DollarSign, Gift, Tag, Download, Printer, 
  Calendar, Building2, CheckCircle2, PieChart, BarChart3 
} from 'lucide-react';
import * as api from '../../services/api';

export default function B2BReportsTab({ partnerUser }) {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadReports = async () => {
      if (!partnerUser) return;
      setLoading(true);
      try {
        const data = await api.fetchB2BReports(partnerUser.id);
        if (isMounted) setReportsData(data);
      } catch (err) {
        console.warn('Failed to load B2B reports:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadReports();
    return () => { isMounted = false; };
  }, [partnerUser]);

  const summary = reportsData?.summary || {};
  const services = reportsData?.service_breakdown || [];
  const monthly = reportsData?.monthly_trends || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in">
      {/* Header Actions */}
      <div className="card border-0 shadow-sm rounded-4 p-3.5 mb-4 bg-white d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <h5 className="fw-bold text-dark font-heading mb-1">Financial Statements &amp; Commission Reports</h5>
          <span className="text-muted text-xs">Automated B2B statements generated for {partnerUser?.company_name || 'your agency'}</span>
        </div>
        <div className="d-flex gap-2">
          <button onClick={handlePrint} className="btn btn-outline-dark btn-sm rounded-pill px-3 text-xs d-flex align-items-center gap-1.5">
            <Printer size={14} />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
          <p className="text-muted text-xs mt-2">Compiling financial performance statements...</p>
        </div>
      ) : (
        <>
          {/* Executive Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-top border-4 border-success">
                <div className="text-muted text-xs fw-bold text-uppercase">Credited Commission</div>
                <div className="fs-3 fw-black text-success font-heading mt-1">
                  ₹{Number(summary.total_commission_earned || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-muted text-xs mt-1">Completed bookings commission ready for payout</div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-top border-4 border-warning">
                <div className="text-muted text-xs fw-bold text-uppercase">Pending Commission</div>
                <div className="fs-3 fw-black text-warning font-heading mt-1">
                  ₹{Number(summary.total_commission_pending || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-muted text-xs mt-1">Awaiting guest travel completion</div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-top border-4 border-primary">
                <div className="text-muted text-xs fw-bold text-uppercase">Total Sales Turnover</div>
                <div className="fs-3 fw-black text-dark font-heading mt-1">
                  ₹{Number(summary.total_sales_volume || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-muted text-xs mt-1">Gross reservation value through agency channel</div>
              </div>
            </div>
          </div>

          {/* Service Breakdown Table */}
          <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
            <div className="p-3.5 border-bottom">
              <h6 className="fw-bold text-dark mb-0 font-heading">Performance by Service Category</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                <thead className="table-light text-muted fw-semibold" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <tr>
                    <th className="ps-3 py-3">Category</th>
                    <th className="py-3 text-center">Bookings Count</th>
                    <th className="py-3">Sales Volume</th>
                    <th className="pe-3 py-3 text-end">Commission Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">No category data recorded yet.</td>
                    </tr>
                  ) : (
                    services.map((s, idx) => (
                      <tr key={idx}>
                        <td className="ps-3 fw-bold text-dark">{s.service_category}</td>
                        <td className="text-center">
                          <span className="badge bg-light text-dark text-xs px-2.5 py-1 rounded-pill font-monospace">
                            {s.booking_count}
                          </span>
                        </td>
                        <td className="fw-semibold text-dark">₹{Number(s.sales_volume || 0).toLocaleString('en-IN')}</td>
                        <td className="pe-3 text-end text-success fw-bold">₹{Number(s.commission_earned || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Trends Table */}
          <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
            <div className="p-3.5 border-bottom">
              <h6 className="fw-bold text-dark mb-0 font-heading">Monthly Performance & Settlements</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                <thead className="table-light text-muted fw-semibold" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <tr>
                    <th className="ps-3 py-3">Month / Year</th>
                    <th className="py-3 text-center">Bookings</th>
                    <th className="py-3">Monthly Sales</th>
                    <th className="pe-3 py-3 text-end">Commission Value</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">No monthly history available yet.</td>
                    </tr>
                  ) : (
                    monthly.map((m, idx) => (
                      <tr key={idx}>
                        <td className="ps-3 font-monospace fw-bold text-dark">{m.month_year}</td>
                        <td className="text-center">
                          <span className="badge bg-light text-dark text-xs px-2.5 py-1 rounded-pill">
                            {m.bookings_count} Bookings
                          </span>
                        </td>
                        <td className="fw-semibold text-dark">₹{Number(m.monthly_sales || 0).toLocaleString('en-IN')}</td>
                        <td className="pe-3 text-end text-success fw-bold">₹{Number(m.monthly_commission || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
