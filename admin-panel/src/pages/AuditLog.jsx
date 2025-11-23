import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './ManageJobs.css';
import { API_BASE_URL } from '../config';
const API_URL = ${API_BASE_URL}/admin';

export default function AuditLog({ onLogout }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      // Using the /audit-logs route
      const res = await axios.get(`${API_URL}/audit-logs`, { headers: { 'x-auth-token': token } });
      setLogs(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Failed to load logs. Check API connection.");
      setLoading(false);
    }
  };

  const getLogColor = (type) => {
      if (type.includes('REJECTED') || type.includes('BLOCKED') || type.includes('DELETED')) return 'red';
      if (type.includes('APPROVED') || type.includes('COMPLETED') || type.includes('CREATED')) return 'green';
      if (type.includes('REASSIGNED') || type.includes('STATUS_CHANGE')) return 'blue';
      return 'gray';
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content"><span className="nav-title">🔒 Audit Log</span><button onClick={onLogout} className="logout-button">Logout</button></div>
      </nav>
      
      <main className="dashboard-main">
        <div className="header-actions">
            <Link to="/" className="back-link">&larr; Dashboard</Link>
            <button onClick={fetchLogs} className="add-btn" style={{background:'#3b82f6'}}>🔄 Refresh Logs</button>
        </div>

        <div className="content-card">
            <h2 className="card-title">System Activity Log ({logs.length})</h2>
            <p className="card-subtitle">Every critical action performed by team members.</p>

            {loading ? <p>Loading history...</p> : (
                <div className="table-responsive" style={{marginTop: 20}}>
                    <table className="jobs-table" style={{tableLayout:'fixed'}}>
                        <thead>
                            <tr>
                                <th style={{width:'15%'}}>Time</th>
                                <th style={{width:'15%'}}>Agent</th>
                                <th style={{width:'20%'}}>Action Type</th>
                                <th style={{width:'50%'}}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log._id}>
                                    <td style={{fontSize:'12px', color:'#666', verticalAlign:'top'}}>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td style={{fontWeight:'bold', verticalAlign:'top'}}>{log.agentName} ({log.agentRole === 'SuperAdmin' ? 'Admin' : 'Agent'})</td>
                                    <td style={{verticalAlign:'top'}}>
                                        <span style={{color: getLogColor(log.actionType), fontWeight:'bold', fontSize:'12px', padding:'4px 8px', borderRadius:4, background:'rgba(0,0,0,0.05)'}}>
                                            {log.actionType.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td style={{wordBreak: 'break-word', fontSize:'14px', verticalAlign:'top'}}>{log.details}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:20}}>No activity logs found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

