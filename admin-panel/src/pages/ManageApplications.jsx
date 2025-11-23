import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './AdminDashboard.css';
import './ManageJobs.css';
import { API_BASE_URL } from '../config';
const API_URL = `${API_BASE_URL}`;

export default function ManageApplications({ onLogout }) {
  const [apps, setApps] = useState([]);
  const [agents, setAgents] = useState([]); // Agent List for dropdown
  const [loading, setLoading] = useState(true);
  
  // Reassign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');

  useEffect(() => {
    fetchApps();
    fetchAgents();
  }, []);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/applications/all-admin`, { headers: { 'x-auth-token': token } });
      setApps(res.data);
      setLoading(false);
    } catch (err) { 
        console.error(err);
        setLoading(false); 
    }
  };

  const fetchAgents = async () => {
    try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API_URL}/admin/agents/list`, { headers: { 'x-auth-token': token } });
        setAgents(res.data);
    } catch(e){}
  };

  const handleReassign = async () => {
      // Allow unassigning by selecting empty string
      try {
          const token = localStorage.getItem('adminToken');
          await axios.put(`${API_URL}/applications/reassign/${selectedApp._id}`, 
            { newAgentId: selectedAgent || null }, 
            { headers: { 'x-auth-token': token } }
          );
          alert("Task Reassigned Successfully!");
          setShowAssignModal(false);
          fetchApps(); // Refresh list
      } catch(e) { alert("Error reassigning task"); }
  };

  const handleExport = () => {
      const exportData = apps.map(app => ({
          "Tracking ID": app.trackingId,
          "Customer Name": `${app.userId?.firstName} ${app.userId?.lastName || ''}`,
          "Mobile": app.userId?.mobile,
          "Job Title": app.jobId?.title,
          "Assigned Agent": app.assignedAgentId ? app.assignedAgentId.firstName : "Unassigned",
          "Status": app.status,
          "Date": new Date(app.appliedAt).toLocaleDateString(),
          "Payment Status": app.paymentDetails?.isPaid ? "Paid" : "Unpaid",
          "Total Amount": app.paymentDetails?.totalAmount || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
      XLSX.writeFile(workbook, `SewaOne_Apps_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusColor = (status) => {
    if (status === 'Completed') return '#10b981';
    if (status === 'Rejected') return '#ef4444';
    if (status === 'Pending Verification') return '#f59e0b';
    if (status === 'Processing') return '#3b82f6';
    return '#6b7280';
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <span className="nav-title">All Applications</span>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="header-actions">
          <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
          <div style={{display:'flex', gap:10}}>
            <button onClick={handleExport} className="add-btn" style={{background:'#16a34a'}}>📥 Export Excel</button>
            <button onClick={fetchApps} className="add-btn" style={{background:'#3b82f6'}}>Refresh List</button>
          </div>
        </div>

        <div className="content-card">
          <h2 className="card-title">Incoming Requests ({apps.length})</h2>
          
          {loading ? <p>Loading...</p> : apps.length === 0 ? <p>No applications found.</p> : (
            <div className="table-responsive">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Track ID</th>
                    <th>User</th>
                    <th>Job/Service</th>
                    <th>Agent</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => (
                    <tr key={app._id}>
                      <td style={{fontWeight:'bold', color:'#2563eb'}}>{app.trackingId}</td>
                      <td>
                          <div>{app.userId?.firstName} {app.userId?.lastName}</div>
                          <div style={{fontSize:'12px', color:'#666'}}>{app.userId?.mobile}</div>
                      </td>
                      <td>{app.jobId?.title}</td>
                      <td>
                          {app.assignedAgentId ? (
                              <span style={{color:'green', fontWeight:'bold', fontSize:'13px'}}>
                                  👤 {app.assignedAgentId.firstName}
                              </span>
                          ) : <span style={{color:'red', fontSize:'13px'}}>⚠️ Unassigned</span>}
                          
                          <button 
                            onClick={()=>{setSelectedApp(app); setSelectedAgent(app.assignedAgentId?._id || ''); setShowAssignModal(true);}} 
                            style={{display:'block', marginTop:5, fontSize:11, background:'#e0e7ff', border:'none', padding:'4px 8px', borderRadius:4, cursor:'pointer', color:'#3730a3', fontWeight:'bold'}}
                          >
                             🔄 Change
                          </button>
                      </td>
                      <td>
                        <span style={{
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            backgroundColor: getStatusColor(app.status), 
                            color: '#fff', 
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                        }}>
                            {app.status}
                        </span>
                      </td>
                      <td>
                        <Link 
                          to={`/applications/view/${app._id}`} 
                          className="action-btn edit-btn"
                          style={{textDecoration:'none', display:'inline-block', textAlign:'center', fontSize: 12}}
                        >
                          Process
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* --- REASSIGN MODAL --- */}
      {showAssignModal && (
          <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
              <div style={{background:'#fff', padding:25, borderRadius:12, width:400, maxWidth:'90%', boxShadow:'0 10px 25px rgba(0,0,0,0.2)'}}>
                  <h3 style={{marginTop:0, color:'#1f2937'}}>Assign Task: <span style={{color:'#2563eb'}}>{selectedApp?.trackingId}</span></h3>
                  <p style={{color:'#666', fontSize:14}}>Select an agent to handle this application.</p>
                  
                  <label style={{fontWeight:'bold', fontSize:12, display:'block', marginBottom:5}}>Select Agent:</label>
                  <select 
                    style={{width:'100%', padding:10, margin:'0 0 20px', borderRadius:5, border:'1px solid #ccc'}}
                    value={selectedAgent} onChange={(e)=>setSelectedAgent(e.target.value)}
                  >
                      <option value="">-- Unassign (No Agent) --</option>
                      {agents.map(a => (
                          <option key={a._id} value={a._id}>
                              {a.firstName} ({a.isOnline ? '🟢 Online' : '⚫ Offline'}) - Load: {a.currentLoad}
                          </option>
                      ))}
                  </select>

                  <div style={{display:'flex', justifyContent:'flex-end', gap:10}}>
                      <button onClick={()=>setShowAssignModal(false)} style={{padding:'10px 20px', background:'#fff', border:'1px solid #ccc', borderRadius:6, cursor:'pointer'}}>Cancel</button>
                      <button onClick={handleReassign} style={{padding:'10px 20px', background:'#2563eb', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:'bold'}}>Confirm Assignment</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}


