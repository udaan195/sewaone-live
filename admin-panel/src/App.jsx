import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from './config';

// Imports
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ManageJobs from './pages/ManageJobs';
import AddJob from './pages/AddJob';
import EditJob from './pages/EditJob';
import ManageApplications from './pages/ManageApplications';
import ApplicationDetails from './pages/ApplicationDetails';
import ManageServices from './pages/ManageServices';
import AddService from './pages/AddService';
import EditService from './pages/EditService';
import ManageAgents from './pages/ManageAgents';
import ManageBanners from './pages/ManageBanners';
import UtilityTools from './pages/UtilityTools';
import LandingPage from './pages/LandingPage'; // ✅ Landing Page Import

function App() {
  const [authData, setAuthData] = useState({ isAuth: false, token: null, role: null, loading: true });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const role = localStorage.getItem('adminRole');
    if (token) {
      setAuthData({ isAuth: true, token, role, loading: false });
    } else {
      setAuthData({ isAuth: false, token: null, role: null, loading: false });
    }
  }, []);

  const handleLogin = (token, role) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminRole', role);
    setAuthData({ isAuth: true, token, role, loading: false });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRole');
    setAuthData({ isAuth: false, token: null, role: null, loading: false });
  };

  if (authData.loading) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        {/* ✅ 1. PUBLIC LANDING PAGE (Root URL) */}
        <Route path="/" element={<LandingPage />} />

        {/* ✅ 2. LOGIN PAGE (Redirects to Dashboard if already logged in) */}
        <Route path="/login" element={!authData.isAuth ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />

        {/* ✅ 3. DASHBOARD (Protected) */}
        <Route path="/dashboard" element={authData.isAuth ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" />} />

        {/* ... Other Protected Routes ... */}
        <Route path="/government-jobs" element={authData.isAuth ? <ManageJobs onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/jobs/add" element={authData.isAuth ? <AddJob onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/jobs/edit/:id" element={authData.isAuth ? <EditJob onLogout={handleLogout} /> : <Navigate to="/login" />} />
        
        <Route path="/applications" element={authData.isAuth ? <ManageApplications onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/applications/view/:id" element={authData.isAuth ? <ApplicationDetails onLogout={handleLogout} /> : <Navigate to="/login" />} />
        
        <Route path="/services/manage" element={authData.isAuth ? <ManageServices onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/services/add" element={authData.isAuth ? <AddService onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/services/edit/:id" element={authData.isAuth ? <EditService onLogout={handleLogout} /> : <Navigate to="/login" />} />
        
        <Route path="/agents/create" element={authData.isAuth ? <ManageAgents onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/banners" element={authData.isAuth ? <ManageBanners onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/tools" element={authData.isAuth ? <UtilityTools onLogout={handleLogout} /> : <Navigate to="/login" />} />

        {/* Fallback: Redirect unknown URLs to Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;