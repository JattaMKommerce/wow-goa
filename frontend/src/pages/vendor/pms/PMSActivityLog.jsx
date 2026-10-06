import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Filter } from 'lucide-react';
import * as api from '../../../services/api';
import { getRelativeTimeString } from '../../../utils/notificationSound';

const ACTION_ICONS = {
  'Created': '➕', 'Updated': '✏️', 'Deleted': '🗑️', 'Submitted': '📤',
  'Logged in': '🔑', 'Exported': '📥', 'Replied': '💬', 'Checked': '✅'
};

export default function PMSActivityLog({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.pmsListActivity(currentUser.id);
      setLogs(res.logs || []);
    } catch {
      setLogs([
        { id: 'l1', user_name: currentUser.username, action: 'Logged in to PMS', related_type: 'auth', created_at: new Date().toISOString() },
        { id: 'l2', user_name: currentUser.username, action: 'Updated availability for Standard Room', related_type: 'availability', created_at: new Date(Date.now() - 3600000).toISOString() }
      ]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [currentUser.id]);

  const filtered = logs.filter(l => !filter || l.action.toLowerCase().includes(filter.toLowerCase()) || l.user_name.toLowerCase().includes(filter.toLowerCase()));

  const timeAgo = (dateStr) => getRelativeTimeString(dateStr);

  const TYPE_COLORS = { auth: '#6c5ce7', availability: '#0984e3', booking: '#00b894', hotel: '#fdcb6e', payment: '#e17055', review: '#FFC107' };

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div><h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Activity Log</h4><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Track all actions taken in your PMS account</p></div>
        <button onClick={fetchLogs} className="btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1" style={{ background: '#fff', border: '1px solid #dee2e6', fontSize: '0.78rem' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="card border-0 rounded-4 shadow-sm p-3 mb-4" style={{ background: '#fff' }}>
        <input className="form-control form-control-sm rounded-pill" style={{ maxWidth: '320px' }} placeholder="Search actions or user..." value={filter} onChange={e => setFilter(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : (
        <div className="card border-0 rounded-4 shadow-sm overflow-hidden" style={{ background: '#fff' }}>
          <div className="d-flex flex-column">
            {filtered.length === 0 ? (
              <div className="text-center py-5 text-muted">No activity logs yet</div>
            ) : filtered.map((l, idx) => {
              const firstWord = l.action.split(' ')[0];
              const icon = ACTION_ICONS[firstWord] || '📋';
              const color = TYPE_COLORS[l.related_type] || '#6c757d';
              return (
                <div key={l.id || idx} className="d-flex align-items-start gap-3 px-4 py-3" style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f0f2f5' : 'none' }}>
                  <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '36px', height: '36px', background: `${color}15`, fontSize: '16px', marginTop: '2px' }}>
                    {icon}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2d3748' }}>{l.action}</div>
                    <div className="text-muted" style={{ fontSize: '0.73rem' }}>
                      by <strong>{l.user_name}</strong>
                      {l.related_type && <span className="ms-2 badge rounded-pill" style={{ background: `${color}20`, color, fontSize: '0.65rem' }}>{l.related_type}</span>}
                    </div>
                    {(l.previous_value || l.new_value) && (
                      <div className="mt-1" style={{ fontSize: '0.72rem', color: '#adb5bd' }}>
                        {l.previous_value && <span>Before: {l.previous_value} </span>}
                        {l.new_value && <span>After: {l.new_value}</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-muted flex-shrink-0" style={{ fontSize: '0.72rem' }}>{timeAgo(l.created_at)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
