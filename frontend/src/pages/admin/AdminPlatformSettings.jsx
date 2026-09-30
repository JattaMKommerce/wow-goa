import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import * as api from '../../services/api';
import HotelBookingDriverSetting from '../../components/common/HotelBookingDriverSetting';

export default function AdminPlatformSettings({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    booking_fee_deduction: 250,
    min_wallet_recharge: 1000
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.makeApiCall('/api.php?resource=site_configs');
      if (res && res.length > 0) {
        setConfig({
          booking_fee_deduction: res[0].booking_fee_deduction || 250,
          min_wallet_recharge: res[0].min_wallet_recharge || 1000
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.makeApiCall('/api.php', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_platform_settings',
          ...config
        })
      });
      alert('Platform settings updated successfully.');
    } catch (e) {
      alert('Error updating settings: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4" style={{ minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Platform Configuration</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Global settings for platform fees, booking options, and operations</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <form onSubmit={handleSave}>
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0D1B2E', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Settings size={18} className="text-primary" /> Vendor Wallet & Fee Settings
                    </h6>
                    <div className="alert bg-primary bg-opacity-10 text-primary border-0 rounded-3 small">
                      <AlertCircle size={16} className="me-2 mb-1" />
                      The platform fee is automatically deducted from a vendor's wallet when they confirm a booking. If their wallet balance falls below this fee, they cannot confirm the booking until they recharge.
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold small">Fixed Platform Fee (per booking)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">₹</span>
                      <input 
                        type="number" 
                        className="form-control border-start-0" 
                        value={config.booking_fee_deduction}
                        onChange={e => setConfig({ ...config, booking_fee_deduction: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="form-text" style={{ fontSize: '0.75rem' }}>Amount deducted from vendor's wallet upon confirming a booking.</div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-muted fw-bold small">Minimum Wallet Recharge Amount</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">₹</span>
                      <input 
                        type="number" 
                        className="form-control border-start-0" 
                        value={config.min_wallet_recharge}
                        onChange={e => setConfig({ ...config, min_wallet_recharge: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="form-text" style={{ fontSize: '0.75rem' }}>Minimum amount vendors are allowed to top-up at one time.</div>
                  </div>

                  <div className="text-end mt-4">
                    <button type="submit" className="btn btn-primary fw-bold px-4 rounded-pill" disabled={saving}>
                      {saving ? 'Saving...' : <><Save size={16} className="me-2 mb-1" /> Save Configuration</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <HotelBookingDriverSetting currentUser={currentUser} />
          </div>
        </div>
      )}
    </div>
  );
}
