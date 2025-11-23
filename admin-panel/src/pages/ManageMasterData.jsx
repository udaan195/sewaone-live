import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './ManageJobs.css'; // Styles reuse kar rahe hain
import { API_BASE_URL } from '../config';
const API_URL = `${API_BASE_URL}/admin`;

export default function ManageMasterData({ onLogout }) {
  const [type, setType] = useState('document'); // 'document' ya 'question'
  const [list, setList] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);

  // Type badalne par data fetch karein
  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/master-data/${type}`);
      setList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/master-data/add`, { type, label: newItem }, {
        headers: { 'x-auth-token': token }
      });
      
      setNewItem('');
      fetchData(); // List refresh
      alert(`${type === 'document' ? 'Document' : 'Question'} added successfully!`);
    } catch (err) {
      alert(err.response?.data?.msg || "Error adding item");
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <span className="nav-title">Master Data Manager</span>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="header-actions">
           <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
           
           {/* Switch Buttons */}
           <div style={{display:'flex', gap:10}}>
              <button 
                onClick={()=>setType('document')} 
                className="add-btn" 
                style={{background: type==='document' ? '#2563eb' : '#e5e7eb', color: type==='document'?'#fff':'#374151'}}
              >
                Documents
              </button>
              <button 
                onClick={()=>setType('question')} 
                className="add-btn" 
                style={{background: type==='question' ? '#2563eb' : '#e5e7eb', color: type==='question'?'#fff':'#374151'}}
              >
                Questions
              </button>
           </div>
        </div>

        <div className="content-card">
           <h2 className="card-title">
             Manage {type === 'document' ? 'Document Types' : 'Eligibility Questions'}
           </h2>
           <p className="card-subtitle">
             Add standard {type}s here to show in dropdowns.
           </p>
           
           {/* Add Form */}
           <form onSubmit={handleAdd} style={{display:'flex', gap:10, marginBottom:20, marginTop: 20, background:'#f9fafb', padding:15, borderRadius:8, border:'1px solid #e5e7eb'}}>
              <input 
                type="text" 
                value={newItem} 
                onChange={(e)=>setNewItem(e.target.value)} 
                placeholder={type === 'document' ? "Ex: Pan Card" : "Ex: Are you 12th Pass?"} 
                style={{flex:1, padding:10, border:'1px solid #ccc', borderRadius:5}} 
                required 
              />
              <button type="submit" disabled={loading} className="add-btn">
                {loading ? 'Adding...' : '+ Add to List'}
              </button>
           </form>

           {/* List Table */}
           <div className="table-responsive">
              <table className="jobs-table">
                 <thead>
                    <tr>
                        <th style={{width: '50px'}}>#</th>
                        <th>Label Name (Visible)</th>
                        <th>System Key (Internal)</th>
                    </tr>
                 </thead>
                 <tbody>
                    {list.map((item, index) => (
                        <tr key={item._id}>
                            <td>{index + 1}</td>
                            <td style={{fontWeight:'bold', color:'#1f2937'}}>{item.label}</td>
                            <td style={{color:'#6b7280', fontFamily:'monospace', background:'#f3f4f6', padding:'2px 6px', borderRadius:4, display:'inline-block'}}>{item.key}</td>
                        </tr>
                    ))}
                    {list.length === 0 && (
                        <tr><td colSpan="3" style={{textAlign:'center', padding:20, color:'#999'}}>No items found. Add one above.</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </main>
    </div>
  );
}


