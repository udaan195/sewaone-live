import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './ManageJobs.css';
import './AddJob.css';
import { API_BASE_URL } from '../config';
const API_URL = `${API_BASE_URL}`;

export default function ManageUpdates({ onLogout }) {
  const location = useLocation();
  // Default tab agar pichle page se aaya ho (e.g. 'Admit Card')
  const initialTab = location.state?.defaultTab || 'Admit Card';
  
  const categories = ['Admit Card', 'Results', 'Answer Key'];
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [updates, setUpdates] = useState([]);
  const [jobs, setJobs] = useState([]); 
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
      title: '',
      linkedJobId: '',
      isCustomTitle: false, // New Toggle
      sendToAll: false,     // New Toggle for notifications
      customFields: [{ label: '', value: '' }],
      actionButtons: [{ label: 'Download', url: '' }]
  });

  useEffect(() => {
    fetchUpdates();
    fetchJobs();
  }, [activeTab]);

  const fetchUpdates = async () => {
    try {
      const res = await axios.get(`${API_URL}/updates/get/${activeTab}`);
      setUpdates(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchJobs = async () => {
      try { 
          const token = localStorage.getItem('adminToken');
          const res = await axios.get(`${API_URL}/updates/job-list`, { headers: {'x-auth-token': token} });
          setJobs(res.data);
      } catch(e) {}
  };

  const handleFieldChange = (i, key, val) => {
      const list = [...formData.customFields]; list[i][key] = val; setFormData({...formData, customFields: list});
  };
  const handleBtnChange = (i, key, val) => {
      const list = [...formData.actionButtons]; list[i][key] = val; setFormData({...formData, actionButtons: list});
  };
  const addField = () => setFormData({...formData, customFields: [...formData.customFields, {label:'', value:''}]});
  const addBtn = () => setFormData({...formData, actionButtons: [...formData.actionButtons, {label:'', url:''}]});
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Agar Custom Title hai, to linkedJobId empty bhejein
      const payload = {
          ...formData,
          linkedJobId: formData.isCustomTitle ? null : formData.linkedJobId,
          category: activeTab
      };

      await axios.post(`${API_URL}/updates/add`, payload, { 
          headers: { 'x-auth-token': token } 
      });
      
      alert("Update Published Successfully!");
      setFormData({ 
          title: '', linkedJobId: '', isCustomTitle: false, sendToAll: false,
          customFields: [{label:'', value:''}], actionButtons: [{label:'', url:''}] 
      });
      fetchUpdates();
    } catch (e) { 
        alert("Error posting update"); 
        console.error(e);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Delete this update?")) return;
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`${API_URL}/updates/${id}`, { headers: { 'x-auth-token': token } });
        fetchUpdates();
      } catch(e) { alert("Error"); }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content"><span className="nav-title">Quick Updates</span><button onClick={onLogout} className="logout-button">Logout</button></div>
      </nav>

      <main className="dashboard-main">
        <div className="header-actions"><Link to="/government-jobs" className="back-link">&larr; Back</Link></div>

        <div className="content-card">
           {/* TABS */}
           <div style={{display:'flex', gap:10, marginBottom:20}}>
               {categories.map(cat => (
                   <button key={cat} onClick={()=>setActiveTab(cat)} style={{padding:'8px 16px', borderRadius:20, border:'none', background: activeTab===cat ? '#2563eb' : '#e5e7eb', color: activeTab===cat ? '#fff' : '#374151', cursor:'pointer', fontWeight:'bold'}}>{cat}</button>
               ))}
           </div>

           <h2 className="card-title">Post New {activeTab}</h2>
           
           <form onSubmit={handleSubmit} style={{background:'#f9fafb', padding:20, borderRadius:8, marginBottom:30, border:'1px solid #ddd'}}>
               
               {/* --- TITLE SELECTION LOGIC --- */}
               <div className="form-group" style={{marginBottom: 15}}>
                   <div style={{display:'flex', justifyContent:'space-between', marginBottom:5}}>
                       <label>Select Title Source:</label>
                       <label style={{cursor:'pointer', color:'#2563eb'}}>
                           <input 
                                type="checkbox" 
                                checked={formData.isCustomTitle} 
                                onChange={e => setFormData({...formData, isCustomTitle: e.target.checked, title: '', linkedJobId: ''})}
                           /> Enter Custom Title
                       </label>
                   </div>

                   {!formData.isCustomTitle ? (
                       <select 
                            style={{width:'100%', padding:10, borderRadius:5, border:'1px solid #ccc'}} 
                            value={formData.linkedJobId} 
                            onChange={e => {
                                const selectedText = e.target.options[e.target.selectedIndex].text;
                                setFormData({
                                    ...formData, 
                                    linkedJobId: e.target.value, 
                                    title: selectedText !== "-- Select Job --" ? selectedText + " " + activeTab : ""
                                });
                            }}
                       >
                           <option value="">-- Select Job from Database --</option>
                           {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
                       </select>
                   ) : (
                       <input 
                            type="text" 
                            placeholder={`Enter Title (e.g. SSC CGL ${activeTab})`} 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                            style={{width:'100%', padding:10, borderRadius:5, border:'1px solid #ccc'}} 
                            required 
                       />
                   )}
               </div>

               {/* --- NOTIFICATION LOGIC --- */}
               <div style={{marginBottom: 20, padding: 10, background: '#fff', border: '1px solid #eee', borderRadius: 5}}>
                   {!formData.isCustomTitle && formData.linkedJobId ? (
                       <p style={{margin:0, fontSize: 14, color: 'green'}}>
                           ✅ Notification will be sent to users who applied for this job.
                       </p>
                   ) : (
                       <label style={{cursor:'pointer', display:'flex', alignItems:'center', gap: 8}}>
                           <input 
                                type="checkbox" 
                                checked={formData.sendToAll} 
                                onChange={e => setFormData({...formData, sendToAll: e.target.checked})} 
                           />
                           <span style={{fontWeight:'bold'}}>Send Notification to ALL Users?</span>
                       </label>
                   )}
               </div>

               {/* Dynamic Fields */}
               <div style={{marginBottom:15}}>
                   <label style={{fontWeight:'bold'}}>Info Fields (e.g. Exam Date)</label>
                   {formData.customFields.map((f, i) => (
                       <div key={i} style={{display:'flex', gap:10, marginBottom:5}}>
                           <input placeholder="Label" value={f.label} onChange={e=>handleFieldChange(i,'label',e.target.value)} style={{flex:1, padding:8}}/>
                           <input placeholder="Value" value={f.value} onChange={e=>handleFieldChange(i,'value',e.target.value)} style={{flex:1, padding:8}}/>
                       </div>
                   ))}
                   <button type="button" onClick={addField} style={{fontSize:12, color:'blue', background:'none', border:'none', cursor:'pointer'}}>+ Add Field</button>
               </div>

               {/* Dynamic Buttons */}
               <div style={{marginBottom:20}}>
                   <label style={{fontWeight:'bold'}}>Action Buttons (e.g. Download Link)</label>
                   {formData.actionButtons.map((b, i) => (
                       <div key={i} style={{display:'flex', gap:10, marginBottom:5}}>
                           <input placeholder="Button Label" value={b.label} onChange={e=>handleBtnChange(i,'label',e.target.value)} style={{flex:1, padding:8}}/>
                           <input placeholder="URL" value={b.url} onChange={e=>handleBtnChange(i,'url',e.target.value)} style={{flex:2, padding:8}}/>
                       </div>
                   ))}
                   <button type="button" onClick={addBtn} style={{fontSize:12, color:'blue', background:'none', border:'none', cursor:'pointer'}}>+ Add Button</button>
               </div>

               <button type="submit" disabled={loading} className="add-btn" style={{width:'100%'}}>{loading ? 'Posting...' : 'Publish Update'}</button>
           </form>

           {/* List */}
           <div className="table-responsive">
              <table className="jobs-table">
                 <thead><tr><th>Title</th><th>Source</th><th>Date</th><th>Action</th></tr></thead>
                 <tbody>
                    {updates.map(u => (
                        <tr key={u._id}>
                            <td style={{fontWeight:'bold'}}>{u.title}</td>
                            <td>{u.linkedJobId ? 'Linked Job' : 'Custom'}</td>
                            <td style={{fontSize:12, color:'#666'}}>{new Date(u.postedAt).toLocaleDateString()}</td>
                            <td><button onClick={()=>handleDelete(u._id)} className="action-btn delete-btn">Delete</button></td>
                        </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </main>
    </div>
  );
}


