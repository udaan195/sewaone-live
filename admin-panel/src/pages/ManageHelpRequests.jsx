import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css'; // Navbar styles
import './ManageHelpRequests.css'; // New custom styles
import { API_BASE_URL } from '../config';
const API_URL = ${API_BASE_URL}';

export default function ManageHelpRequests({ onLogout }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]); 

  // Stats State
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0 });

  // Filters State
  const [searchId, setSearchId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterAgent, setFilterAgent] = useState('');

  // Modal State
  const [selectedTicket, setSelectedTicket] = useState(null); // Jo ticket resolve ho raha hai
  const [replyText, setReplyText] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchData();
    loadAgents();
  }, [searchId, filterDate, filterAgent]);

  const loadAgents = async () => {
    try {
        const token = localStorage.getItem('adminToken');
        // Live agents API reuse kar rahe hain for dropdown list
        const res = await axios.get(`${API_URL}/admin/live-agents`, { headers: { 'x-auth-token': token } });
        setAgents(res.data);
    } catch(e) {}
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if(searchId) params.append('trackingId', searchId);
      if(filterDate) params.append('date', filterDate);
      if(filterAgent) params.append('agentId', filterAgent);

      const res = await axios.get(`${API_URL}/help/all-admin?${params.toString()}`, {
         headers: { 'x-auth-token': token }
      });
      
      const data = res.data;
      setRequests(data);
      
      // Calculate Stats
      const openCount = data.filter(r => r.status === 'Open').length;
      setStats({
          total: data.length,
          open: openCount,
          resolved: data.length - openCount
      });
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Open Modal
  const openResolveModal = (ticket) => {
      setSelectedTicket(ticket);
      setReplyText('');
  };

  // Submit Resolution
  const handleResolveSubmit = async () => {
      if(!replyText.trim()) return alert("Please write a response.");
      setResolving(true);
      
      try {
          const token = localStorage.getItem('adminToken');
          await axios.put(`${API_URL}/help/resolve/${selectedTicket._id}`, { adminResponse: replyText }, {
              headers: { 'x-auth-token': token }
          });
          alert("Ticket Resolved Successfully!");
          setSelectedTicket(null); // Close modal
          fetchData(); // Refresh UI
      } catch(e) { 
          alert("Error resolving ticket"); 
      } finally {
          setResolving(false);
      }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
            <span className="nav-title">Help Desk & Support</span>
            <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="header-actions"><Link to="/" className="back-link">&larr; Dashboard</Link></div>

        {/* --- 1. STATS CARDS --- */}
        <div className="help-stats">
            <div className="help-stat-card stat-total">
                <div>
                    <h3>{stats.total}</h3>
                    <p>Total Tickets</p>
                </div>
                <div style={{fontSize:'30px'}}>📂</div>
            </div>
            <div className="help-stat-card stat-open">
                <div>
                    <h3>{stats.open}</h3>
                    <p>Open Issues</p>
                </div>
                <div style={{fontSize:'30px'}}>🔥</div>
            </div>
            <div className="help-stat-card stat-resolved">
                <div>
                    <h3>{stats.resolved}</h3>
                    <p>Resolved</p>
                </div>
                <div style={{fontSize:'30px'}}>✅</div>
            </div>
        </div>

        {/* --- 2. FILTERS --- */}
        <div className="filter-bar">
             <input 
                type="text" className="filter-input" placeholder="Search Tracking ID..." 
                value={searchId} onChange={(e)=>setSearchId(e.target.value)}
             />
             <input 
                type="date" className="filter-input"
                value={filterDate} onChange={(e)=>setFilterDate(e.target.value)}
             />
             <select 
                className="filter-input"
                value={filterAgent} onChange={(e)=>setFilterAgent(e.target.value)}
             >
                 <option value="">Filter by Agent</option>
                 {agents.map(a => <option key={a._id} value={a._id}>{a.firstName}</option>)}
             </select>
             <button 
                onClick={()=>{setSearchId('');setFilterDate('');setFilterAgent('');}} 
                className="add-btn" style={{background:'#6b7280', padding:'10px 20px'}}
             >
                Clear Filters
             </button>
        </div>

        {/* --- 3. TICKET LIST --- */}
        <div className="tickets-container">
            {loading ? <p style={{textAlign:'center'}}>Loading tickets...</p> : requests.length === 0 ? (
                <div style={{textAlign:'center', padding:40, background:'#fff', borderRadius:12}}>
                    <h3>No Tickets Found 🎉</h3>
                    <p style={{color:'#666'}}>Great job! All issues are resolved or none exist.</p>
                </div>
            ) : (
                requests.map((req) => (
                    <div key={req._id} className="ticket-card">
                        {/* Header */}
                        <div className="ticket-header">
                            <div>
                                <div className="ticket-id">{req.trackingId}</div>
                                <div className="ticket-meta">
                                    User: {req.userId?.firstName} | {new Date(req.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <span className={`status-badge ${req.status === 'Open' ? 'status-open' : 'status-resolved'}`}>
                                {req.status}
                            </span>
                        </div>

                        {/* Body */}
                        <div className="ticket-body">
                            <div className="ticket-info">
                                <div className="info-label">Issue Category</div>
                                <div className="info-value">{req.issueCategory}</div>
                            </div>
                            <div className="ticket-info" style={{flex: 2}}>
                                <div className="info-label">Description</div>
                                <div className="info-value">{req.description}</div>
                            </div>
                            <div className="ticket-info">
                                <div className="info-label">Assigned Agent</div>
                                <div className="info-value">
                                    {req.assignedAgentId ? req.assignedAgentId.firstName : <span style={{color:'#ccc'}}>Unassigned</span>}
                                </div>
                            </div>
                        </div>

                        {/* Admin Response (If Resolved) */}
                        {req.status === 'Resolved' && (
                            <div style={{marginTop:15, padding:15, background:'#f0fdf4', borderRadius:8, border:'1px solid #bbf7d0'}}>
                                <div className="info-label" style={{color:'#166534'}}>Admin Response:</div>
                                <div style={{color:'#14532d'}}>{req.adminResponse}</div>
                            </div>
                        )}

                        {/* Actions */}
                        {req.status === 'Open' && (
                            <div className="ticket-actions">
                                {req.linkedApplicationId && (
                                    <Link to={`/applications/view/${req.linkedApplicationId}`} style={{marginRight:15, color:'#2563eb', textDecoration:'underline', alignSelf:'center'}}>
                                        View Application
                                    </Link>
                                )}
                                <button onClick={()=>openResolveModal(req)} className="resolve-btn">
                                    Reply & Resolve
                                </button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
      </main>

      {/* --- RESOLVE MODAL --- */}
      {selectedTicket && (
        <div className="modal-overlay">
            <div className="modal-box">
                <h2 style={{margin:0, marginBottom:10, color:'#1f2937'}}>Resolve Issue</h2>
                <p style={{color:'#666', marginBottom:20}}>
                    Replying to Ticket <strong>{selectedTicket.trackingId}</strong>
                </p>
                
                <label style={{fontWeight:'bold', fontSize:'0.9rem'}}>Your Response:</label>
                <textarea 
                    className="modal-textarea"
                    placeholder="Write solution here (e.g. Payment refunded, Application corrected...)"
                    value={replyText}
                    onChange={(e)=>setReplyText(e.target.value)}
                ></textarea>

                <div style={{display:'flex', justifyContent:'flex-end', gap:10}}>
                    <button 
                        onClick={()=>setSelectedTicket(null)}
                        style={{padding:'10px 20px', border:'1px solid #ccc', background:'white', borderRadius:6, cursor:'pointer'}}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleResolveSubmit}
                        disabled={resolving}
                        style={{padding:'10px 20px', background:'#10b981', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontWeight:'bold'}}
                    >
                        {resolving ? 'Saving...' : 'Mark Resolved'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}


