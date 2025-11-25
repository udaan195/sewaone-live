import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// --- Pages Import ---
import AdminLogin from './pages/AdminLogin'; // (Note: Check if file is Login.jsx or AdminLogin.jsx)
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import LandingPage from './pages/LandingPage';

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
import ManageCoupons from './pages/ManageCoupons';
import ManageWallet from './pages/ManageWallet';
import AuditLog from './pages/AuditLog';

// Services
import AddService from './pages/AddService';
import EditService from './pages/EditService';
import ManageServices from './pages/ManageServices';
import FormBuilder from './pages/FormBuilder';

// Support & Tools
import ManageHelpRequests from './pages/ManageHelpRequests';
import UtilityTools from './pages/UtilityTools';

function App() {
  const [authData, setAuthData] = useState({ isAuth: false, role: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Token expiry check
        if (decoded.exp * 1000 > Date.now()) {
          setAuthData({ isAuth: true, role: decoded.admin.role });
        } else {
          localStorage.removeItem('adminToken');
          setAuthData({ isAuth: false, role: null });
        }
      } catch (e) { 
        localStorage.removeItem('adminToken');
        setAuthData({ isAuth: false, role: null });
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (role) => setAuthData({ isAuth: true, role });
  
  const handleLogout = () => { 
      localStorage.removeItem('adminToken'); 
      setAuthData({ isAuth: false, role: null }); 
  };

  if (isLoading) return <div style={{padding: 20, textAlign: 'center'}}>Loading SewaOne Admin...</div>;

  // --- Protected Route Component ---
  const SuperAdminRoute = ({ children }) => {
    // Agar login nahi hai to Login page, agar SuperAdmin nahi hai to Dashboard par bhejo
    if (!authData.isAuth) return <Navigate to="/login" />;
    return authData.role === 'SuperAdmin' ? children : <Navigate to="/dashboard" />;
  };

  return (
    <BrowserRouter>
      <Routes>
        
        {/* ✅ 1. PUBLIC LANDING PAGE (Root URL) */}
        <Route path="/" element={<LandingPage />} /> 

        {/* ✅ 2. LOGIN PAGE */}
        {/* Agar pehle se login hai to seedha Dashboard bhejo */}
        <Route path="/login" element={!authData.isAuth ? <AdminLogin onLoginSuccess={handleLogin} /> : <Navigate to="/dashboard" replace />} />
        
        {/* ✅ 3. MAIN DASHBOARD (Protected) */}
        <Route path="/dashboard" element={
            authData.isAuth ? (
                authData.role === 'SuperAdmin' ? <AdminDashboard onLogout={handleLogout} /> : <AgentDashboard onLogout={handleLogout} />
            ) : (
                <Navigate to="/login" replace />
            )
        } />

        {/* --- SHARED ROUTES (Available to both Admin & Agent) --- */}
        <Route path="/applications/view/:id" element={authData.isAuth ? <ApplicationDetails onLogout={handleLogout}/> : <Navigate to="/login"/>} />
        <Route path="/tools" element={authData.isAuth ? <UtilityTools onLogout={handleLogout}/> : <Navigate to="/login"/>} />

        {/* --- SUPER ADMIN ONLY ROUTES --- */}
        
        {/* Jobs */}
        <Route path="/government-jobs" element={<SuperAdminRoute><GovtJobDashboard onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/jobs/manage" element={<SuperAdminRoute><ManageJobs onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/jobs/add" element={<SuperAdminRoute><AddJob onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/jobs/edit/:id" element={<SuperAdminRoute><EditJob onLogout={handleLogout}/></SuperAdminRoute>} />
        
        {/* Services */}
        <Route path="/services/manage" element={<SuperAdminRoute><ManageServices onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/services/add" element={<SuperAdminRoute><AddService onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/services/edit/:id" element={<SuperAdminRoute><EditService onLogout={handleLogout} /> </SuperAdminRoute>} />
        <Route path="/forms/builder" element={<SuperAdminRoute><FormBuilder onLogout={handleLogout}/></SuperAdminRoute>} />

        {/* Updates & Applications */}
        <Route path="/updates/manage" element={<SuperAdminRoute><ManageUpdates onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/applications" element={<SuperAdminRoute><ManageApplications onLogout={handleLogout}/></SuperAdminRoute>} />
        
        {/* Wallet & Coupons */}
        <Route path="/wallet/manage" element={<SuperAdminRoute><ManageWallet onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/coupons" element={<SuperAdminRoute><ManageCoupons onLogout={handleLogout}/></SuperAdminRoute>} />

        {/* Management */}
        <Route path="/agents/create" element={<SuperAdminRoute><ManageAgents onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/master-data" element={<SuperAdminRoute><ManageMasterData onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/banners" element={<SuperAdminRoute><ManageBanners onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/audit-log" element={<SuperAdminRoute><AuditLog onLogout={handleLogout}/></SuperAdminRoute>} />
        <Route path="/help-desk" element={<SuperAdminRoute><ManageHelpRequests onLogout={handleLogout}/></SuperAdminRoute>} />

        {/* 404 Fallback: Redirect unknown URLs to Home */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;