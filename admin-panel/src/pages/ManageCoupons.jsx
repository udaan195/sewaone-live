import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './ManageJobs.css'; // Reuse table styles
import { API_BASE_URL } from '../config';
const API_URL = ${API_BASE_URL}/coupons';

export default function ManageCoupons({ onLogout }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Coupon Form State
  const [form, setForm] = useState({
      code: '', 
      type: 'FLAT', 
      value: 0, 
      usageLimitPerUser: 1, 
      minOrderValue: 0,
      description: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
      try {
          const token = localStorage.getItem('adminToken');
          const res = await axios.get(`${API_URL}/all`, { headers: { 'x-auth-token': token } });
          setCoupons(res.data);
          setLoading(false);
      } catch(e) {
          console.error(e);
          setLoading(false);
      }
  };

  const handleCreate = async (e) => {
      e.preventDefault();
      if(!form.code || !form.value) return alert("Code and Value are required");
      
      setCreating(true);
      try {
          const token = localStorage.getItem('adminToken');
          await axios.post(`${API_URL}/create`, form, { headers: { 'x-auth-token': token } });
          alert("Coupon Created Successfully!");
          // Reset Form
          setForm({ code: '', type: 'FLAT', value: 0, usageLimitPerUser: 1, minOrderValue: 0, description: '' });
          fetchCoupons();
      } catch(e) { 
          alert("Error creating coupon. Code might be duplicate."); 
      } finally {
          setCreating(false);
      }
  };
  
  const handleDelete = async (id) => {
      if(!window.confirm("Are you sure you want to delete this coupon?")) return;
      try {
          const token = localStorage.getItem('adminToken');
          await axios.delete(`${API_URL}/${id}`, { headers: { 'x-auth-token': token } });
          fetchCoupons();
      } catch(e){ alert("Error deleting"); }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <span className="nav-title">Coupon Manager</span>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="header-actions">
            <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
        </div>

        <div className="content-card">
           <h2 className="card-title">Create Discount Coupon</h2>
           <p className="card-subtitle">Manage promo codes for users.</p>

           {/* --- CREATE FORM --- */}
           <form onSubmit={handleCreate} style={{background:'#f9fafb', padding:20, borderRadius:8, marginBottom:30, border:'1px solid #e5e7eb'}}>
               <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:15, marginBottom:15}}>
                   
                   <div>
                       <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Coupon Code</label>
                       <input 
                         type="text" 
                         value={form.code} 
                         onChange={e=>setForm({...form, code:e.target.value.toUpperCase()})} 
                         placeholder="Ex: WELCOME50" 
                         style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5, textTransform:'uppercase'}} 
                         required
                       />
                   </div>

                   <div>
                       <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Description</label>
                       <input 
                         type="text" 
                         value={form.description} 
                         onChange={e=>setForm({...form, description:e.target.value})} 
                         placeholder="Ex: Flat ₹50 off on first order" 
                         style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}}
                       />
                   </div>

                   <div>
                       <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Discount Type</label>
                       <select 
                         value={form.type} 
                         onChange={e=>setForm({...form, type:e.target.value})} 
                         style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}}
                       >
                           <option value="FLAT">Flat Amount (₹)</option>
                           <option value="PERCENT">Percentage (%)</option>
                       </select>
                   </div>

                   <div>
                       <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Value</label>
                       <input 
                         type="number" 
                         value={form.value} 
                         onChange={e=>setForm({...form, value:e.target.value})} 
                         placeholder={form.type==='FLAT'?'Amount (₹)':'Percent (%)'} 
                         style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}} 
                         required
                       />
                   </div>

                   <div>
                       <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Usage Limit (Per User)</label>
                       <input 
                         type="number" 
                         value={form.usageLimitPerUser} 
                         onChange={e=>setForm({...form, usageLimitPerUser:e.target.value})} 
                         style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}}
                       />
                   </div>

                   <div>
                       <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Min Order Value (₹)</label>
                       <input 
                         type="number" 
                         value={form.minOrderValue} 
                         onChange={e=>setForm({...form, minOrderValue:e.target.value})} 
                         style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}}
                       />
                   </div>
               </div>

               <button 
                 type="submit" 
                 disabled={creating} 
                 className="add-btn"
                 style={{width:'100%', padding:12, fontSize:16}}
               >
                   {creating ? 'Creating...' : '+ Create Coupon'}
               </button>
           </form>

           {/* --- COUPON LIST --- */}
           <h3 style={{borderBottom:'2px solid #f3f4f6', paddingBottom:10, marginTop:40, color:'#1e3c72'}}>Active Coupons</h3>
           
           {loading ? <p>Loading coupons...</p> : coupons.length === 0 ? <p style={{color:'#999', padding:20, textAlign:'center'}}>No active coupons found.</p> : (
               <div className="table-responsive">
                  <table className="jobs-table">
                     <thead>
                        <tr>
                            <th>Code</th>
                            <th>Discount</th>
                            <th>Condition</th>
                            <th>Limit/User</th>
                            <th>Action</th>
                        </tr>
                     </thead>
                     <tbody>
                        {coupons.map(c => (
                            <tr key={c._id}>
                                <td style={{fontWeight:'bold', color:'#166534', fontFamily:'monospace', fontSize:16}}>{c.code}</td>
                                <td>
                                    <span style={{background: c.type==='FLAT'?'#dcfce7':'#e0e7ff', padding:'4px 8px', borderRadius:4, color: c.type==='FLAT'?'#166534':'#3730a3', fontWeight:'bold'}}>
                                        {c.type === 'FLAT' ? `₹${c.value} OFF` : `${c.value}% OFF`}
                                    </span>
                                </td>
                                <td>{c.minOrderValue > 0 ? `Min Order: ₹${c.minOrderValue}` : 'No Min Order'}</td>
                                <td>{c.usageLimitPerUser} time(s)</td>
                                <td>
                                    <button 
                                        onClick={()=>handleDelete(c._id)} 
                                        className="action-btn delete-btn"
                                        style={{padding:'6px 12px'}}
                                    >
                                        Delete
                                    </button>
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


