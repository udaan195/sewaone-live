import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './AdminDashboard.css';
import './ManageJobs.css'; // Styling reuse
import { API_BASE_URL } from '../config';
const API_URL = ${API_BASE_URL}/admin';

export default function ManageAgents({ onLogout }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ 
      firstName: '', 
      mobile: '', 
      password: '',
      specializations: ['ALL'] // Default: All Rounder
  });

  // Report State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Available Skills (Must match your Service Categories)
  const SKILL_OPTIONS = [
      'Government Job', 
      'Citizen Service', 
      'Government Scheme', 
      'PF Service', 
      'Tax Service', 
      'ALL'
  ];

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API_URL}/agents/list`, { headers: { 'x-auth-token': token } });
        setAgents(res.data);
    } catch(e){}
  };

  // --- 1. HANDLE SKILL SELECTION ---
  const handleSkillChange = (e) => {
      const { value, checked } = e.target;
      let newSkills = [...formData.specializations];
      
      if (value === 'ALL') {
          // If ALL is selected, clear others and keep only ALL
          setFormData({ ...formData, specializations: checked ? ['ALL'] : [] });
          return;
      }

      if (checked) {
          // Add skill
          // First remove ALL if it exists (cant be specialist AND all rounder logically, though code permits)
          newSkills = newSkills.filter(s => s !== 'ALL');
          newSkills.push(value);
      } else {
          // Remove skill
          newSkills = newSkills.filter(s => s !== value);
      }
      setFormData({ ...formData, specializations: newSkills });
  };

  // --- 2. CREATE AGENT ---
  const handleCreate = async (e) => {
      e.preventDefault();
      if (formData.specializations.length === 0) return alert("Select at least one skill or 'ALL'");
      
      setLoading(true);
      try {
          const token = localStorage.getItem('adminToken');
          await axios.post(`${API_URL}/create-agent`, formData, { headers: { 'x-auth-token': token } });
          alert("Agent Created Successfully!");
          setFormData({ firstName: '', mobile: '', password: '', specializations: ['ALL'] });
          fetchAgents();
      } catch(e){ alert(e.response?.data?.msg || "Error creating agent"); }
      setLoading(false);
  };

  // --- 3. ACTIONS (Block/Delete) ---
  const toggleBlock = async (agent) => {
      if(!window.confirm(`Are you sure you want to ${agent.isBlocked ? 'Unblock' : 'Block'} ${agent.firstName}?`)) return;
      try {
          const token = localStorage.getItem('adminToken');
          await axios.put(`${API_URL}/agent/update/${agent._id}`, 
            { isBlocked: !agent.isBlocked }, 
            { headers: { 'x-auth-token': token } }
          );
          fetchAgents();
      } catch(e){ alert("Error updating agent"); }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Delete Agent? This cannot be undone.")) return;
      try {
          const token = localStorage.getItem('adminToken');
          await axios.delete(`${API_URL}/agent/${id}`, { headers: { 'x-auth-token': token } });
          fetchAgents();
      } catch(e){ alert("Error deleting agent"); }
  };

  // --- 4. REPORT GENERATION ---
  const generateReport = async () => {
      if(!startDate || !endDate) return alert("Please select Date Range");
      try {
          const token = localStorage.getItem('adminToken');
          const res = await axios.post(`${API_URL}/agent/performance`, 
             { startDate, endDate }, 
             { headers: { 'x-auth-token': token } }
          );
          
          // Excel Download
          const worksheet = XLSX.utils.json_to_sheet(res.data);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Performance");
          XLSX.writeFile(workbook, `Team_Report_${startDate}_to_${endDate}.xlsx`);
          
          alert("Report Downloaded!");
      } catch(e) { alert("Error generating report"); }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
            <span className="nav-title">Team Management</span>
            <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </nav>
      
      <main className="dashboard-main">
        <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
        
        <div style={{display:'flex', gap:20, flexWrap:'wrap', marginBottom: 30}}>
            
            {/* LEFT: CREATE AGENT */}
            <div className="content-card" style={{flex:2, minWidth:300, marginBottom: 0}}>
                <h3 style={{margin:'0 0 15px', color:'#1e3c72'}}>Add Specialized Agent</h3>
                <form onSubmit={handleCreate}>
                    <div style={{display:'flex', gap:15, marginBottom:15}}>
                        <div style={{flex:1}}>
                            <label style={{display:'block', marginBottom:5, fontWeight:'bold'}}>Name</label>
                            <input type="text" value={formData.firstName} onChange={e=>setFormData({...formData, firstName:e.target.value})} style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:4}} required/>
                        </div>
                        <div style={{flex:1}}>
                            <label style={{display:'block', marginBottom:5, fontWeight:'bold'}}>Mobile (Login ID)</label>
                            <input type="tel" maxLength="10" value={formData.mobile} onChange={e=>setFormData({...formData, mobile:e.target.value})} style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:4}} required/>
                        </div>
                        <div style={{flex:1}}>
                            <label style={{display:'block', marginBottom:5, fontWeight:'bold'}}>Password</label>
                            <input type="text" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:4}} required/>
                        </div>
                    </div>

                    <div style={{background:'#f8fafc', padding:15, borderRadius:8, border:'1px solid #e2e8f0'}}>
                        <label style={{display:'block', marginBottom:10, fontWeight:'bold', color:'#2563eb'}}>Assign Skills (Categories)</label>
                        <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                            {SKILL_OPTIONS.map(skill => (
                                <label key={skill} style={{
                                    display:'flex', alignItems:'center', gap:6, cursor:'pointer', 
                                    background:'#fff', padding:'8px 12px', borderRadius:20, border:'1px solid #cbd5e1', fontSize:'0.9rem'
                                }}>
                                    <input 
                                        type="checkbox" 
                                        value={skill} 
                                        checked={formData.specializations.includes(skill)}
                                        onChange={handleSkillChange}
                                    />
                                    {skill}
                                </label>
                            ))}
                        </div>
                        <small style={{color:'#64748b', display:'block', marginTop:5}}>* Select 'ALL' for a General Agent who can handle any task.</small>
                    </div>

                    <button type="submit" disabled={loading} className="add-btn" style={{width:'100%', marginTop:15, background: '#2563eb'}}>{loading?'Creating...':'Create Agent'}</button>
                </form>
            </div>

            {/* RIGHT: REPORT */}
            <div className="content-card" style={{flex:1, minWidth:250, background:'#f0fdf4', border:'1px solid #bbf7d0', marginBottom: 0}}>
                <h3 style={{margin:'0 0 15px', color:'#15803d'}}>📊 Export Report</h3>
                <p style={{fontSize: 13, color: '#166534', marginBottom: 15}}>Download Excel sheet of completed tasks & revenue.</p>
                
                <div style={{marginBottom:10}}>
                    <label style={{display:'block', marginBottom:5, fontWeight:'bold'}}>From</label>
                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:'100%', padding:8, border:'1px solid #ccc', borderRadius:4}} />
                </div>
                <div style={{marginBottom:15}}>
                    <label style={{display:'block', marginBottom:5, fontWeight:'bold'}}>To</label>
                    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{width:'100%', padding:8, border:'1px solid #ccc', borderRadius:4}} />
                </div>
                <button onClick={generateReport} className="add-btn" style={{width:'100%', background:'#16a34a'}}>📥 Download Excel</button>
            </div>
        </div>

        {/* BOTTOM: AGENT LIST */}
        <div className="content-card">
            <h3 style={{margin:'0 0 15px', color:'#1e3c72'}}>Team Members ({agents.length})</h3>
            <div className="table-responsive">
                <table className="jobs-table">
                    <thead><tr><th>Name / Mobile</th><th>Specialization (Skills)</th><th>Status</th><th>Load</th><th>Actions</th></tr></thead>
                    <tbody>
                        {agents.map(agent => (
                            <tr key={agent._id} style={{opacity: agent.isBlocked ? 0.5 : 1, background: agent.isBlocked ? '#fef2f2' : 'transparent'}}>
                                <td>
                                    <div style={{fontWeight:'bold'}}>{agent.firstName} {agent.isBlocked && <span style={{color:'red', fontSize:10}}>(BLOCKED)</span>}</div>
                                    <div style={{fontSize:12, color:'#666'}}>{agent.mobile}</div>
                                </td>
                                <td>
                                    <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
                                        {agent.specializations?.map((s, i) => (
                                            <span key={i} style={{
                                                padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:'bold',
                                                background: s==='ALL'?'#1e293b': s.includes('Govt')?'#dbeafe': s.includes('Citizen')?'#fee2e2':'#f3f4f6',
                                                color: s==='ALL'?'#fff': s.includes('Govt')?'#1e40af': s.includes('Citizen')?'#991b1b':'#333'
                                            }}>
                                                {s}
                                            </span>
                                        ))}
                                        {(!agent.specializations || agent.specializations.length === 0) && <span style={{fontSize:10, color:'red'}}>No Skills</span>}
                                    </div>
                                </td>
                                <td>
                                    <span style={{padding:'4px 8px', borderRadius:4, background: agent.isOnline ? '#dcfce7' : '#f3f4f6', color: agent.isOnline ? 'green' : 'gray', fontSize:11, fontWeight: 'bold'}}>
                                        {agent.isOnline ? '● Online' : '○ Offline'}
                                    </span>
                                </td>
                                <td><strong>{agent.currentLoad}</strong> / {agent.maxCapacity || 5}</td>
                                <td>
                                    <button onClick={()=>toggleBlock(agent)} style={{marginRight:5, padding:'6px 10px', border:'none', borderRadius:4, cursor:'pointer', background: agent.isBlocked ? '#16a34a' : '#f59e0b', color:'white', fontWeight:'bold', fontSize:11}}>
                                        {agent.isBlocked ? 'Unblock' : 'Block'}
                                    </button>
                                    <button onClick={()=>handleDelete(agent._id)} style={{padding:'6px 10px', border:'none', borderRadius:4, cursor:'pointer', background:'#dc2626', color:'white', fontWeight:'bold', fontSize:11}}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {agents.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding: 20, color: '#999'}}>No agents found. Add one above.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
      </main>
    </div>
  );
}


