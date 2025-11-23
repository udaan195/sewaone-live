import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './ManageJobs.css';
import { API_BASE_URL } from '../config';
const API_URL = ${API_BASE_URL}/wallet';

export default function ManageWallet({ onLogout }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/admin/pending`, {
         headers: { 'x-auth-token': token }
      });
      console.log("Wallet Requests:", res.data); // Debug Log
      setRequests(res.data);
    } catch (err) { 
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
      if(!window.confirm(`Confirm ${action}?`)) return;
      try {
          const token = localStorage.getItem('adminToken');
          await axios.put(`${API_URL}/admin/action/${id}`, { action }, {
              headers: { 'x-auth-token': token }
          });
          alert("Done!");
          fetchRequests();
      } catch(e) { alert("Error"); }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav"><div className="nav-content"><span className="nav-title">Wallet Manager</span><button onClick={onLogout} className="logout-button">Logout</button></div></nav>
      <main className="dashboard-main">
        <div className="header-actions">
            <Link to="/" className="back-link">&larr; Dashboard</Link>
            <button onClick={fetchRequests} className="add-btn" style={{background:'#3b82f6'}}>Refresh List</button>
        </div>

        <div className="content-card">
            <h2 className="card-title">Pending Top-up Requests ({requests.length})</h2>
            
            {loading ? <p style={{textAlign:'center', padding:20}}>Loading requests...</p> : requests.length === 0 ? (
                <div style={{textAlign:'center', padding:40, background:'#f9fafb', borderRadius:8}}>
                    <h3>No Pending Requests</h3>
                    <p style={{color:'#666'}}>Users haven't requested any wallet top-ups yet.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="jobs-table">
                        <thead><tr><th>User</th><th>Amount</th><th>UTR / Ref</th><th>Date</th><th>Action</th></tr></thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req._id}>
                                    <td>
                                        <div style={{fontWeight:'bold'}}>{req.userId?.firstName || "Unknown"}</div>
                                        <div style={{fontSize:12, color:'#666'}}>{req.userId?.mobile}</div>
                                    </td>
                                    <td style={{color:'green', fontWeight:'bold', fontSize:16}}>+ ₹{req.amount}</td>
                                    <td style={{fontFamily:'monospace', background:'#eff6ff', padding:'2px 5px', borderRadius:4}}>{req.utr}</td>
                                    <td>{new Date(req.date).toLocaleDateString()}</td>
                                    <td>
                                        <button onClick={()=>handleAction(req._id, 'approve')} style={{marginRight:5, background:'#16a34a', color:'#fff', border:'none', padding:'6px 12px', borderRadius:4, cursor:'pointer', fontWeight:'bold'}}>Approve</button>
                                        <button onClick={()=>handleAction(req._id, 'reject')} style={{background:'#dc2626', color:'#fff', border:'none', padding:'6px 12px', borderRadius:4, cursor:'pointer', fontWeight:'bold'}}>Reject</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}


