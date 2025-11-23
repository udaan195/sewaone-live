import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// --- Pages Import ---
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import ManageWallet from './pages/ManageWallet';
// Govt Jobs & Updates
import GovtJobDashboard from './pages/GovtJobDashboard';
import ManageJobs from './pages/ManageJobs';
import AddJob from './pages/AddJob';
import EditJob from './pages/EditJob';
import ManageUpdates from './pages/ManageUpdates';

// Applications & Tasks
import ManageApplications from './pages/ManageApplications';
import ApplicationDetails from './pages/ApplicationDetails';

// Management
import ManageAgents from './pages/ManageAgents';
import ManageMasterData from './pages/ManageMasterData';
import ManageBanners from './pages/ManageBanners';
import ManageCoupons from './pages/ManageCoupons'; // Fixed Import
import AuditLog from './pages/AuditLog';
// Services
import AddService from './pages/AddService';
import ManageServices from './pages/ManageServices';
import FormBuilder from './pages/FormBuilder';
// Support
import ManageHelpRequests from './pages/ManageHelpRequests';
import EditService from './pages/EditService';
import UtilityTools from './pages/UtilityTools';
function App() {
  const [authData, setAuthData] = useState({ isAuth: false, role: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setAuthData({ isAuth: true, role: decoded.admin.role });
        } else {
          localStorage.removeItem('adminToken');
        }
      } catch (e) { localStorage.removeItem('adminToken'); }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (role) => setAuthData({ isAuth: true, role });
  const handleLogout = () => { localStorage.removeItem('adminToken'); setAuthData({ isAuth: false, role: null }); };

  if (isLoading) return <div />;

  const SuperAdminRoute = ({ children }) => {
    return authData.isAuth && authData.role === 'SuperAdmin' ? children : <Navigate to="/" />;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={!authData.isAuth ? <AdminLogin onLoginSuccess={handleLogin} /> : <Navigate to="/" replace />} />
        
        {/* Dashboard (Based on Role) */}
        <Route path="/" element={authData.isAuth ? (authData.role === 'SuperAdmin' ? <AdminDashboard onLogout={handleLogout} /> : <AgentDashboard onLogout={handleLogout} />) : <Navigate to="/login" replace />} />

        {/* --- SHARED ROUTES (Admin & Agent) --- */}
        <Route path="/applications/view/:id" element={authData.isAuth ? <ApplicationDetails onLogout={handleLogout}/> : <Navigate to="/login"/>} />

        {/* --- SUPER ADMIN ONLY ROUTES --- */}
        
        {/* Jobs */}
        <Route path="/government-jobs" element={<SuperAdminRoute><GovtJobDashboard onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/jobs/manage" element={<SuperAdminRoute><ManageJobs onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/jobs/add" element={<SuperAdminRoute><AddJob onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/jobs/edit/:id" element={<SuperAdminRoute><EditJob onLogout={handleLogout}/></SuperAdminRoute>} />
        
        {/* Updates (Admit Card/Result) */}
        <Route path="/updates/manage" element={<SuperAdminRoute><ManageUpdates onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/wallet/manage" element={
          <SuperAdminRoute><ManageWallet onLogout
          ={handleLogout}/></SuperAdminRoute>} />
        
        {/* Applications List */}
        <Route path="/applications" element={<SuperAdminRoute><ManageApplications onLogout={handleLogout}/></SuperAdminRoute>} />
        
        {/* Citizen Services */}
        <Route path="/services/add" element={<SuperAdminRoute><AddService onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/services/manage" element={<SuperAdminRoute><ManageServices onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/forms/builder" element={<SuperAdminRoute><FormBuilder onLogout={handleLogout}/></SuperAdminRoute>} />
       <Route path="/audit-log" element={<SuperAdminRoute><AuditLog onLogout={handleLogout}/></SuperAdminRoute>} />
        {/* Team, Data & Banners */}
        <Route path="/agents/create" element={<SuperAdminRoute><ManageAgents onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/master-data" element={<SuperAdminRoute><ManageMasterData onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/banners" element={<SuperAdminRoute><ManageBanners onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/tools" element={authData.isAuth ? <UtilityTools onLogout={handleLogout}/> : <Navigate to="/login"/>} />
        {/* Support */}
        <Route path="/help-desk" element={<SuperAdminRoute><ManageHelpRequests onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/services/edit/:id" element={authData.isAuth ? <EditService onLogout={handleLogout} /> : <Navigate to="/login" />} />
        {/* Coupons (New) */}
        <Route path="/coupons" element={<SuperAdminRoute><ManageCoupons onLogout={handleLogout}/></SuperAdminRoute>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;


