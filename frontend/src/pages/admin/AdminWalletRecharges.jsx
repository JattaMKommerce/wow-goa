import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle } from 'lucide-react';
import * as api from '../../services/api';

export default function AdminWalletRecharges({ vendors }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.makeApiCall('/api.php?resource=wallet_transactions');
      setTransactions(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this recharge?`)) return;
    try {
      await api.makeApiCall('/api.php', {
        method: 'POST',
        body: JSON.stringify({
          action: 'approve_recharge',
          id: id,
          status: status
        })
      });
      window.dispatchEvent(new CustomEvent('vendor-wallet-updated', { detail: { id, status } }));
      window.dispatchEvent(new CustomEvent('tripgalileo-notification-sync'));
      try {
        localStorage.setItem('tg_wallet_updated', Date.now().toString());
      } catch (_) {}
      fetchData();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const getVendorName = (vendorId) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor ? vendor.name : vendorId;
  };

  return (
    <div className="p-4" style={{ minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Wallet Recharges</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Approve or reject vendor wallet recharge requests</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : transactions.filter(t => t.type === 'credit').length === 0 ? (
            <div className="text-center py-5 text-muted">
              <CreditCard size={48} className="mb-3 opacity-50" />
              <h5>No recharge requests found</h5>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th className="px-4 py-3">Date</th>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Proof</th>
                    <th>Status</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.filter(t => t.type === 'credit').map(t => (
                    <tr key={t.id}>
                      <td className="px-4 text-muted small">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="fw-bold text-primary">{getVendorName(t.vendor_id)}</td>
                      <td className="fw-bold text-success">+₹{t.amount?.toLocaleString()}</td>
                      <td>{t.description?.replace('Wallet recharge via ', '') || 'Unknown'}</td>
                      <td><span className="badge bg-light text-dark border">{t.reference_id || 'N/A'}</span></td>
                      <td>
                        {t.payment_proof ? (
                          <a href={t.payment_proof} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-link p-0">View Proof</a>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${t.status === 'Completed' ? 'bg-success' : t.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="text-end px-4">
                        {t.status === 'Pending Verification' && (
                          <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-sm btn-success rounded-pill px-3 fw-bold" onClick={() => handleApprove(t.id, 'Completed')}>
                              Approve
                            </button>
                            <button className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold" onClick={() => handleApprove(t.id, 'Rejected')}>
                              Reject
                            </button>
                          </div>
                        )}
                        {t.status !== 'Pending Verification' && (
                          <span className="text-muted small">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
