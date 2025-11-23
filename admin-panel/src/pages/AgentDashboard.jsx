import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AgentDashboard.css';
import { API_BASE_URL } from '../config';
const API_URL = `${API_BASE_URL}`; 


export default function AgentDashboard({ onLogout }) {
  const [isOnline, setIsOnline] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, completed: 0, processing: 0 });
  const [agentName, setAgentName] = useState('');

  useEffect(() => {
    syncData();
  }, []);

  const syncData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // 1. Get My Profile (Status & Name)
      // (Ensure backend has GET /api/admin/me route logic in adminRoutes)
      // Agar /me route nahi banaya hai to ise skip karke direct tasks layein, 
      // par status sync ke liye ye zaroori hai.
      // Hum assume kar rahe hain ki pichle steps mein humne GET /admin/me add kiya tha.
      try {
          const profileRes = await axios.get(`${API_URL}/admin/me`, { headers: { 'x-auth-token': token } });
          setIsOnline(profileRes.data.isOnline);
          setAgentName(profileRes.data.firstName);
      } catch(e) { console.log("Profile fetch warning"); }

      // 2. Get Assigned Tasks
      const taskRes = await axios.get(`${API_URL}/applications/my-tasks`, {
        headers: { 'x-auth-token': token }
      });
      
      setTasks(taskRes.data);
      
      // 3. Calculate Stats
      const pend = taskRes.data.filter(t => t.status === 'Pending Verification' || t.status === 'Payment Pending' || t.status === 'Action Required').length;
      const proc = taskRes.data.filter(t => t.status === 'Processing').length;
      const comp = taskRes.data.filter(t => t.status === 'Completed').length;
      
      setStats({ pending: pend, processing: proc, completed: comp });

    } catch (err) {
      console.error("Sync Error", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.put(`${API_URL}/admin/toggle-status`, {}, {
        headers: { 'x-auth-token': token }
      });
      setIsOnline(res.data.isOnline);
    } catch (e) {
      alert("Status update failed");
    }
  };

  const getStatusColor = (status) => {
      switch(status) {
          case 'Processing': return 'blue';
          case 'Action Required': return 'orange';
          case 'Payment Verification Pending': return 'purple';
          default: return 'gray';
      }
  };

  return (
    <div className="agent-container">
      {/* --- NAVBAR --- */}
      <nav className="agent-nav">
        <div className="agent-brand">
          <span style={{fontSize:'1.5rem'}}>👨‍💻</span>
          <div>
              <div style={{fontWeight:'800', fontSize:'1.1rem', color:'#1e293b'}}>Agent Workspace</div>
              <div style={{fontSize:'0.75rem', color:'#64748b'}}>Welcome, {agentName || 'Partner'}</div>
          </div>
        </div>
        
        <div className="nav-actions">
            {/* Live Status Toggle */}
            <button 
              onClick={toggleStatus}
              className={`status-toggle ${isOnline ? 'online' : 'offline'}`}
            >
              <div className="status-indicator"></div>
              <span>{isOnline ? "You are Online" : "You are Offline"}</span>
            </button>

            <button onClick={onLogout} className="logout-button-agent">Logout</button>
        </div>
      </nav>

      {/* --- STATS STRIP --- */}
      <div className="stats-strip">
        <div className="stat-box">
           <div className="stat-num" style={{color:'#f59e0b'}}>{stats.pending}</div>
           <div className="stat-label">Pending</div>
        </div>
        <div className="stat-box">
           <div className="stat-num" style={{color:'#3b82f6'}}>{stats.processing}</div>
           <div className="stat-label">Processing</div>
        </div>
        <div className="stat-box">
           <div className="stat-num" style={{color:'#10b981'}}>{stats.completed}</div>
           <div className="stat-label">Done Today</div>
        </div>
      </div>

      {/* --- MAIN TASK AREA --- */}
      <div className="task-section">
        <div className="section-header">
            <h3>My Assigned Tasks</h3>
            <button onClick={syncData} className="refresh-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
                Refresh
            </button>
        </div>

        {loading ? (
            <div style={{textAlign:'center', padding:40, color:'#666'}}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
            <div className="empty-state">
                <div style={{fontSize:'3rem'}}>☕</div>
                <h3>No Tasks Assigned</h3>
                <p>Go Online to receive new live requests automatically.</p>
            </div>
        ) : (
            <div className="task-list">
                {tasks.map((app) => (
                    <div 
                        key={app._id} 
                        className={`task-card ${app.isLiveRequest ? 'live-card' : ''} ${app.status === 'Completed' ? 'completed-card' : ''}`}
                    >
                        <div className="card-left">
                            <div className="card-header">
                                {app.isLiveRequest && <span className="badge-live">● LIVE REQUEST</span>}
                                <span className="badge-id">#{app.trackingId}</span>
                                <span className={`badge-status status-${getStatusColor(app.status)}`}>{app.status}</span>
                            </div>
                            
                            <h4 className="job-title">{app.jobId?.title || "Service Request"}</h4>
                            
                            <div className="card-meta">
                                <div className="meta-item">
                                    <span className="icon">👤</span> {app.userId?.firstName} {app.userId?.lastName}
                                </div>
                                <div className="meta-item">
                                    <span className="icon">📱</span> {app.userId?.mobile}
                                </div>
                                <div className="meta-item">
                                    <span className="icon">🕒</span> 
                                    {app.isLiveRequest ? "Instant Apply" : `${app.selectedSlot?.date} @ ${app.selectedSlot?.time}`}
                                </div>
                            </div>
                        </div>
                        
                        <div className="card-right">
                            {app.status === 'Completed' ? (
                                <button className="btn-view" disabled>Completed ✅</button>
                            ) : (
                                <Link to={`/applications/view/${app._id}`} className="btn-process">
                                    Open & Process &rarr;
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Utility Tool Shortcut */}
      <div style={{position:'fixed', bottom:20, right:20}}>
          <Link to="/tools" style={{background:'#1e3c72', color:'#fff', padding:'12px 20px', borderRadius:30, textDecoration:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.2)', fontWeight:'bold', display:'flex', alignItems:'center', gap:10}}>
              <span>🛠️ Tools</span>
          </Link>
      </div>
    </div>
  );
}


