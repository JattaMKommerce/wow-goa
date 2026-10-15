import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../../context/TaxiAuthContext';
import Sidebar from '../../components/taxi/Sidebar';
import Header from '../../components/taxi/Header';
import DashboardOverview from '../taxi/DashboardOverview';
import VehicleManagement from '../taxi/VehicleManagement';
import DriverDirectory from '../taxi/DriverDirectory';
import ComplianceVault from '../taxi/ComplianceVault';
import B2BDispatches from '../taxi/B2BDispatches';
import BillingSettlements from '../taxi/BillingSettlements';
import LiveTelematicsMap from '../taxi/LiveTelematicsMap';
import ChauffeurPortal from '../taxi/ChauffeurPortal';
import LiveFleetDirectory from '../taxi/LiveFleetDirectory';

const TaxiVendorMainLayout = ({ onLogout, currentUser }) => {
  const { activeRole, logout, user } = useAuth();
  
  // Set default tab based on active role
  const [activeTab, setActiveTab] = useState(() => {
    return activeRole === 'DISPATCHER' ? 'dispatches' : 'dashboard';
  });

  // Whenever role changes, ensure user is on an authorized view for that role
  useEffect(() => {
    if (activeRole === 'DISPATCHER') {
      const allowedDispatcherTabs = ['dispatches', 'directory', 'telematics', 'drivers'];
      if (!allowedDispatcherTabs.includes(activeTab)) {
        setActiveTab('dispatches');
      }
    } else if (activeRole === 'FLEET_ADMIN') {
      const allowedAdminTabs = ['dashboard', 'directory', 'vehicles', 'drivers', 'compliance', 'settlements'];
      if (!allowedAdminTabs.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [activeRole]);

  const handleRoleChange = (newRole) => {
    if (newRole === 'DISPATCHER') {
      setActiveTab('dispatches');
    } else if (newRole === 'FLEET_ADMIN') {
      setActiveTab('dashboard');
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Executive Financial Dashboard';
      case 'directory': return 'Live Fleet Directory & Rate Card';
      case 'vehicles': return 'Fleet Garage & Vehicles';
      case 'drivers': return activeRole === 'DISPATCHER' ? 'On-Duty Chauffeur Roster' : 'Chauffeur Records & KYC';
      case 'compliance': return 'RTO Papers & Insurance Vault';
      case 'dispatches': return 'Dispatcher Operations Desk';
      case 'settlements': return 'Corporate Invoicing & GST Settlements';
      case 'telematics': return 'Live Fleet GPS Tracking';
      default: return 'Fleet Control Center';
    }
  };

  const handleFullLogout = () => {
    logout();
    if (onLogout) onLogout();
  };

  // If driver role is active, render full-screen Chauffeur Mobile Portal without desktop sidebar
  if (activeRole === 'DRIVER') {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
        <ChauffeurPortal />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Header 
          title={getPageTitle()} 
          onViewWebsite={() => window.open('/cabs', '_blank')} 
          onRoleChange={handleRoleChange} 
        />
        {activeTab === 'dashboard' && <DashboardOverview setActiveTab={setActiveTab} />}
        {activeTab === 'directory' && <LiveFleetDirectory />}
        {activeTab === 'vehicles' && <VehicleManagement setActiveTab={setActiveTab} />}
        {activeTab === 'drivers' && <DriverDirectory />}
        {activeTab === 'compliance' && <ComplianceVault />}
        {activeTab === 'dispatches' && <B2BDispatches />}
        {activeTab === 'settlements' && <BillingSettlements />}
        {activeTab === 'telematics' && <LiveTelematicsMap />}
      </div>
    </div>
  );
};

export default function TaxiVendorPortalPage({ currentUser, onLogout }) {
  // Ensure access_token and user exist in localStorage for Taxi B2B context
  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      localStorage.setItem('access_token', 'apex-b2b-active-session');
    }
    const existing = localStorage.getItem('user');
    if (!existing || existing === 'null' || existing === 'undefined') {
      localStorage.setItem('user', JSON.stringify({
        id: currentUser?.id || 1,
        username: currentUser?.username || 'Fleet Director',
        role: 'FLEET_ADMIN',
        company_name: 'WOW GOA B2B Fleet'
      }));
    }
  }, [currentUser]);

  return (
    <AuthProvider>
      <TaxiVendorMainLayout onLogout={onLogout} currentUser={currentUser} />
    </AuthProvider>
  );
}
