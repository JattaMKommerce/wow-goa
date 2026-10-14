import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import DashboardOverview from './pages/DashboardOverview';
import VehicleManagement from './pages/VehicleManagement';
import DriverDirectory from './pages/DriverDirectory';
import ComplianceVault from './pages/ComplianceVault';
import B2BDispatches from './pages/B2BDispatches';
import BillingSettlements from './pages/BillingSettlements';
import LiveTelematicsMap from './pages/LiveTelematicsMap';
import ChauffeurPortal from './pages/ChauffeurPortal';
import LiveFleetDirectory from './pages/LiveFleetDirectory';

const MainLayout = ({ onViewWebsite }) => {
  const { activeRole } = useAuth();
  
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
        <Header title={getPageTitle()} onViewWebsite={onViewWebsite} onRoleChange={handleRoleChange} />
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

const AppContent = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState(() => (localStorage.getItem('access_token') ? 'console' : 'website'));

  // If user is logged in
  if (user) {
    if (currentView === 'website') {
      return (
        <LandingPage 
          onNavigateToLogin={() => setCurrentView('console')} 
        />
      );
    }
    return <MainLayout onViewWebsite={() => setCurrentView('website')} />;
  }

  // If user is NOT logged in:
  if (currentView === 'login') {
    return <Login onBackToWebsite={() => setCurrentView('website')} />;
  }

  return (
    <LandingPage 
      onNavigateToLogin={() => setCurrentView('login')} 
    />
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
