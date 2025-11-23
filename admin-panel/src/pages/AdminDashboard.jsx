import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './AdminDashboard.css';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/admin`;

export default function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API_URL}/dashboard-stats`, {
           headers: { 'x-auth-token': token }
        });
        setStats(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Stats fetch error", err);
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const revenueData = [
    { name: 'Mon', uv: 400 }, { name: 'Tue', uv: 300 }, { name: 'Wed', uv: 500 },
    { name: 'Thu', uv: 200 }, { name: 'Fri', uv: 600 }, { name: 'Sat', uv: 800 }, { name: 'Sun', uv: 900 },
  ];

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <span className="nav-title">SewaOne Admin</span>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div style={{marginBottom: 20}}>
            <h2 style={{margin:0, color:'#1e3c72'}}>Business Overview</h2>
            <p style={{color:'#6b7280', margin:0}}>Financials & Performance Metrics</p>
        </div>

        {loading ? <p>Loading Analytics...</p> : (
            <>
                {/* --- 1. FINANCIAL BREAKDOWN --- */}
                <h3 style={{color:'#374151', fontSize:'1.1rem', marginBottom:15, marginTop: 5}}>💰 Financial Health</h3>
                <div className="stats-grid">
                    <div className="stat-card" style={{borderLeft: '4px solid #16a34a', background:'#f0fdf4'}}>
                        <span className="stat-value" style={{color:'#166534'}}>₹{stats?.financeDetail?.collectedServiceFee || 0}</span>
                        <span className="stat-label" style={{color:'#16a34a'}}>Profit Collected</span>
                        <small style={{color:'#15803d', marginTop:5}}>Available in Bank</small>
                    </div>
                    <div className="stat-card" style={{borderLeft: '4px solid #2563eb', background:'#eff6ff'}}>
                        <span className="stat-value" style={{color:'#1e40af'}}>₹{stats?.financeDetail?.collectedOfficialFee || 0}</span>
                        <span className="stat-label" style={{color:'#2563eb'}}>Govt Fees Held</span>
                        <small style={{color:'#1e3a8a', marginTop:5}}>To be paid</small>
                    </div>
                    <div className="stat-card" style={{borderLeft: '4px solid #f59e0b', background:'#fffbeb'}}>
                        <span className="stat-value" style={{color:'#b45309'}}>₹{stats?.financeDetail?.pendingServiceFee || 0}</span>
                        <span className="stat-label" style={{color:'#d97706'}}>Pending Profit</span>
                        <small style={{color:'#92400e', marginTop:5}}>Yet to receive</small>
                    </div>
                    <div className="stat-card" style={{borderLeft: '4px solid #dc2626', background:'#fef2f2'}}>
                        <span className="stat-value" style={{color:'#991b1b'}}>₹{stats?.financeDetail?.pendingOfficialFee || 0}</span>
                        <span className="stat-label" style={{color:'#dc2626'}}>Pending Govt Fee</span>
                        <small style={{color:'#7f1d1d', marginTop:5}}>Waiting from users</small>
                    </div>
                </div>

                {/* --- 2. GENERAL STATS (Wallet & Apps) --- */}
                <div className="stats-grid" style={{marginTop: 20}}>
                    <div className="stat-card" style={{borderLeft: '4px solid #f59e0b', background:'#fff7ed'}}>
                        <div style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                            <span className="stat-value" style={{color:'#b45309'}}>{stats?.counts?.pendingWalletRequests || 0}</span>
                            <span style={{fontSize:'2rem'}}>⏳</span>
                        </div>
                        <span className="stat-label" style={{color:'#c2410c'}}>Pending Top-ups</span>
                        <Link to="/wallet/manage" style={{fontSize:12, color:'#ea580c', marginTop:5, fontWeight:'bold'}}>Process Now &rarr;</Link>
                    </div>
                    <div className="stat-card" style={{borderLeft: '4px solid #8b5cf6', background:'#f5f3ff'}}>
                        <span className="stat-value" style={{color:'#6d28d9'}}>₹{stats?.counts?.totalUserWalletBalance || 0}</span>
                        <span className="stat-label" style={{color:'#7c3aed'}}>User Wallet Holdings</span>
                        <small style={{color:'#5b21b6', marginTop:5}}>Advance Cash</small>
                    </div>
                    <div className="stat-card sc-purple">
                        <span className="stat-value">{stats?.counts?.totalApps || 0}</span>
                        <span className="stat-label">Total Applications</span>
                    </div>
                    <div className="stat-card sc-blue">
                        <span className="stat-value">{stats?.counts?.totalUsers || 0}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                </div>

                {/* --- 3. DATA TABLES --- */}
                <div className="dashboard-section">
                    <div className="section-box">
                        <div className="box-title">Recent Applications</div>
                        <table className="mini-table">
                            <thead><tr><th>User</th><th>Job</th><th>Time</th></tr></thead>
                            <tbody>
                                {stats?.recentApps?.map(app => (
                                    <tr key={app._id}>
                                        <td style={{fontWeight:'bold'}}>{app.userId?.firstName}</td>
                                        <td>{app.jobId?.title?.substring(0, 20)}...</td>
                                        <td style={{color:'#6b7280', fontSize:'0.8rem'}}>{new Date(app.appliedAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {stats?.recentApps?.length === 0 && <tr><td colSpan="3">No recent activity</td></tr>}
                            </tbody>
                        </table>
                        <Link to="/applications" style={{display:'block', marginTop:10, fontSize:'0.9rem', color:'#2563eb', textAlign:'center'}}>View All &rarr;</Link>
                    </div>
                    <div className="section-box">
                        <div className="box-title">Agent Status</div>
                        <table className="mini-table">
                            <thead><tr><th>Name</th><th>Status</th><th>Load</th></tr></thead>
                            <tbody>
                                {stats?.agents?.map(agent => (
                                    <tr key={agent._id}>
                                        <td style={{fontWeight:'bold'}}>{agent.firstName}</td>
                                        <td><span className={`agent-status ${agent.isOnline ? 'dot-online' : 'dot-offline'}`}></span>{agent.isOnline ? 'Online' : 'Offline'}</td>
                                        <td>{agent.currentLoad} Active</td>
                                    </tr>
                                ))}
                                {stats?.agents?.length === 0 && <tr><td colSpan="3">No agents active</td></tr>}
                            </tbody>
                        </table>
                        <Link to="/agents/create" style={{display:'block', marginTop:10, fontSize:'0.9rem', color:'#2563eb', textAlign:'center'}}>Manage Team &rarr;</Link>
                    </div>
                </div>
            </>
        )}

        {/* --- 4. QUICK ACTIONS --- */}
        <h3 className="section-title">Quick Actions</h3>
        <div className="module-grid">
          
          {/* 1. Govt Jobs */}
          <Link to="/government-jobs" className="module-card"><div className="module-card-icon" style={{ backgroundColor: '#DBEAFE', color: '#3B82F6' }}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg></div><h4>Govt Jobs</h4><p>Add/Edit Jobs</p></Link>
          
          {/* 2. Applications */}
          <Link to="/applications" className="module-card"><div className="module-card-icon" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div><h4>Applications</h4><p>Process Requests</p></Link>
          
          {/* 3. Citizen Services (MISSING THA - NOW ADDED) */}
          <Link to="/services/manage" className="module-card">
            <div className="module-card-icon" style={{ backgroundColor: '#F3E8FF', color: '#8B5CF6' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h4>Citizen Services</h4>
            <p>Pan, Passport, etc.</p>
          </Link>
          
          <Link to="/forms/builder" className="module-card">
  <div className="module-card-icon" style={{backgroundColor:'#fef3c7', color:'#d97706'}}>
    {/* Form Icon */}
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
  </div>
  <h4>Form Builder</h4>
  <p>Create Templates</p>
</Link>

          {/* 4. Wallet */}
          <Link to="/wallet/manage" className="module-card"><div className="module-card-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div><h4>Wallet Manager</h4><p>Approve Top-ups</p></Link>

          {/* 5. Coupons (NEW) */}
          <Link to="/coupons" className="module-card">
            <div className="module-card-icon" style={{backgroundColor:'#dbeafe', color:'#2563eb'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            </div>
            <h4>Coupons</h4>
            <p>Discounts & Offers</p>
          </Link>

          {/* 6. Team */}
          <Link to="/agents/create" className="module-card"><div className="module-card-icon" style={{ backgroundColor: '#fae8ff', color: '#86198f' }}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div><h4>Team</h4><p>Add Agents</p></Link>
          
          {/* 7. Master Data */}
          <Link to="/master-data" className="module-card"><div className="module-card-icon" style={{backgroundColor:'#ffedd5', color:'#ea580c'}}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg></div><h4>Master Data</h4><p>Docs List</p></Link>
          
          {/* 8. Banners */}
          <Link to="/banners" className="module-card"><div className="module-card-icon" style={{backgroundColor:'#fce7f3', color:'#be185d'}}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div><h4>Banners</h4><p>App Slider</p></Link>
          
          <Link to="/audit-log" className="module-card">
      <div className="module-card-icon" style={{backgroundColor:'#e0e7ff', color:'#3b82f6'}}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      </div>
      <h4>Audit Log</h4>
      <p>View all team actions.</p>
    </Link>
          
          {/* 9. Help Desk */}
          <Link to="/help-desk" className="module-card"><div className="module-card-icon" style={{backgroundColor:'#fee2e2', color:'#dc2626'}}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div><h4>Help Desk</h4><p>Support Tickets</p></Link>
          
          {/* 10. Utility Tools (New) */}
          <Link to="/tools" className="module-card"><div className="module-card-icon" style={{backgroundColor:'#e0e7ff', color:'#3730a3'}}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg></div><h4>Tools</h4><p>Resize & Calc</p></Link>

        </div>
      </main>
    </div>
  );
}


