import React, { useState, useEffect } from 'react';
import { 
  Car, UserCheck, LayoutGrid, Smartphone, ChevronRight, 
  ExternalLink, LogOut, ArrowLeft, Shield, Sparkles, Clock, MapPin
} from 'lucide-react';
import B2BDispatches from './B2BDispatches';
import ChauffeurPortal from './ChauffeurPortal';
import LiveFleetDirectory from './LiveFleetDirectory';

export default function TaxiOperationsHub({ initialTab = 'dispatch', onLogout, onNavigateHome }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    // Sync with browser URL if needed
    const path = window.location.pathname;
    if (path === '/taxi-chauffeur') setActiveTab('chauffeur');
    else if (path === '/taxi-fleet') setActiveTab('fleet');
    else if (path === '/taxi-dispatch') setActiveTab('dispatch');
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    let targetPath = '/taxi-portal';
    if (tab === 'dispatch') targetPath = '/taxi-dispatch';
    else if (tab === 'chauffeur') targetPath = '/taxi-chauffeur';
    else if (tab === 'fleet') targetPath = '/taxi-fleet';
    window.history.pushState(null, '', targetPath);
  };

  return (
    <div className="min-vh-100" style={{ background: '#f8fafc' }}>
      {/* ─── TOP PRIVATE OPS HEADER ────────────────────────────────────────── */}
      <header className="sticky-top border-bottom shadow-xs" style={{ background: '#0B192C', zIndex: 1020 }}>
        <div className="container-fluid px-4 py-2.5">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            
            {/* Left: Brand & Title */}
            <div className="d-flex align-items-center gap-3">
              <a 
                href="/taxi" 
                target="_blank" 
                rel="noreferrer" 
                className="d-flex align-items-center gap-2 text-decoration-none"
              >
                <div 
                  className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm"
                  style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #FF6B35 0%, #D84A1B 100%)' }}
                >
                  <Car size={20} />
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-black text-white" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.5px', fontSize: '15px' }}>
                      WOW GOA
                    </span>
                    <span className="badge rounded-pill px-2 py-0.5 text-uppercase fw-bold" style={{ background: 'rgba(255,107,53,0.2)', color: '#FF9466', fontSize: '10px' }}>
                      FLEET OPERATOR
                    </span>
                  </div>
                  <div className="text-white-50" style={{ fontSize: '11px' }}>
                    Taxi & Chauffeur Mobility Operations Hub
                  </div>
                </div>
              </a>
            </div>

            {/* Middle: Operations Switcher Tabs */}
            <div className="d-flex align-items-center p-1 rounded-pill" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <button
                type="button"
                onClick={() => handleTabChange('dispatch')}
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-2 transition-all ${
                  activeTab === 'dispatch' 
                    ? 'btn-warning text-dark shadow-sm' 
                    : 'text-white-50 hover-text-white border-0 bg-transparent'
                }`}
                style={{ fontSize: '12.5px' }}
              >
                <LayoutGrid size={15} />
                <span>Dispatcher Desk</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('chauffeur')}
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-2 transition-all ${
                  activeTab === 'chauffeur' 
                    ? 'btn-warning text-dark shadow-sm' 
                    : 'text-white-50 hover-text-white border-0 bg-transparent'
                }`}
                style={{ fontSize: '12.5px' }}
              >
                <Smartphone size={15} />
                <span>Chauffeur Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('fleet')}
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-2 transition-all ${
                  activeTab === 'fleet' 
                    ? 'btn-warning text-dark shadow-sm' 
                    : 'text-white-50 hover-text-white border-0 bg-transparent'
                }`}
                style={{ fontSize: '12.5px' }}
              >
                <UserCheck size={15} />
                <span>Fleet & Tariffs</span>
              </button>
            </div>

            {/* Right: Quick Links & Exit */}
            <div className="d-flex align-items-center gap-2">
              <a
                href="/taxi"
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline-light rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 fw-semibold"
                style={{ fontSize: '12px', borderColor: 'rgba(255,255,255,0.2)' }}
                title="Open customer booking screen in new tab"
              >
                <ExternalLink size={13} />
                <span className="d-none d-md-inline">Live Customer Site</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  if (onLogout) onLogout();
                  else window.location.href = '/';
                }}
                className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1.5 d-flex align-items-center gap-1.5 fw-semibold"
                style={{ fontSize: '12px' }}
                title="Exit Operations Hub"
              >
                <LogOut size={13} />
                <span className="d-none d-md-inline">Exit Hub</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ─── TAB CONTENT WORKSPACE ────────────────────────────────────────── */}
      <main className="p-0">
        {activeTab === 'dispatch' && <B2BDispatches />}
        {activeTab === 'chauffeur' && <ChauffeurPortal />}
        {activeTab === 'fleet' && <LiveFleetDirectory />}
      </main>
    </div>
  );
}
