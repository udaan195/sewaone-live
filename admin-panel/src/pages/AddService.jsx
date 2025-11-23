import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './AddJob.css'; 
import { API_BASE_URL } from '../config';
const API_URL = `${API_BASE_URL}/services`;
const ADMIN_API_URL = `${API_BASE_URL}/admin`;
const FORM_API_URL = `${API_BASE_URL}/forms`;

export default function AddService({ onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Data States
  const [masterDocs, setMasterDocs] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]); 
  const [docInput, setDocInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Citizen Service',
    subCategory: '', 
    officialFee: 0,
    serviceCharge: 50,
    instructions: 'Please upload clear documents.',
    requiredDocuments: [],
    linkedFormId: '' // Template ID
  });

  // Load Master Data & Templates
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const headers = { headers: { 'x-auth-token': token } };
        
        // Docs
        const docRes = await axios.get(`${ADMIN_API_URL}/master-data/document`, headers);
        setMasterDocs(Array.isArray(docRes.data) ? docRes.data : []);
        
        // Templates
        const formRes = await axios.get(`${FORM_API_URL}/list`, headers);
        setFormTemplates(Array.isArray(formRes.data) ? formRes.data : []);
      } catch(e) {}
    };
    loadData();
  }, []);

  const getSubCategories = () => {
      if (formData.category === 'Citizen Service') return ['Identity Proof', 'Certificates', 'Transport/Driving', 'Police/Legal', 'Others'];
      if (formData.category === 'Government Scheme') return ['Farmers', 'Housing', 'Health', 'Students/Youth', 'Pension', 'Women', 'Others'];
      return ['General', 'Other'];
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Smart Doc Logic
  const handleAddDocSmart = async () => {
    if (!docInput.trim()) return;
    if (formData.requiredDocuments.includes(docInput)) { setDocInput(''); return; }
    const exists = masterDocs.find(d => d.label.toLowerCase() === docInput.toLowerCase());
    if (exists) {
        setFormData({ ...formData, requiredDocuments: [...formData.requiredDocuments, exists.label] });
    } else {
        if (window.confirm(`"${docInput}" is new. Add to Master List?`)) {
            try {
                const token = localStorage.getItem('adminToken');
                await axios.post(`${ADMIN_API_URL}/master-data/add`, { type: 'document', label: docInput }, { headers: { 'x-auth-token': token } });
                setMasterDocs([...masterDocs, { label: docInput, key: docInput.toLowerCase().replace(/ /g,'_') }]);
                setFormData({ ...formData, requiredDocuments: [...formData.requiredDocuments, docInput] });
            } catch (e) { setFormData({ ...formData, requiredDocuments: [...formData.requiredDocuments, docInput] }); }
        } else {
            setFormData({ ...formData, requiredDocuments: [...formData.requiredDocuments, docInput] });
        }
    }
    setDocInput('');
  };
  const removeDoc = (i) => { const u=[...formData.requiredDocuments]; u.splice(i,1); setFormData({...formData, requiredDocuments:u}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/add`, formData, { headers: { 'x-auth-token': token } });
      alert('Service Published!');
      navigate('/services/manage');
    } catch (err) { alert('Error adding service.'); }
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav"><div className="nav-content"><span className="nav-title">Add Service</span><button onClick={onLogout} className="logout-button">Logout</button></div></nav>
      <main className="dashboard-main">
        <Link to="/" className="back-link">&larr; Dashboard</Link>
        <div className="content-card form-card">
          <h2 className="card-title">New Service Entry</h2>
          <form onSubmit={handleSubmit}>
            
            <div className="form-section">
               <h3>Basic Details</h3>
               <div className="form-group"><label>Title</label><input name="title" value={formData.title} onChange={handleChange} required placeholder="Ex: New PAN Card" /></div>
               <div style={{display:'flex', gap:10}}>
                   <div className="form-group" style={{flex:1}}>
                       <label style={{color:'#2563eb', fontWeight:'bold'}}>Category</label>
                       <select name="category" value={formData.category} onChange={handleChange} style={{width:'100%', padding:10, borderRadius:5, border:'1px solid #ccc'}}>
                           <option value="Citizen Service">Citizen Service</option><option value="Government Scheme">Government Scheme</option><option value="Other">Other</option>
                       </select>
                   </div>
                   <div className="form-group" style={{flex:1}}>
                       <label style={{color:'#166534', fontWeight:'bold'}}>Sub Category</label>
                       <select name="subCategory" value={formData.subCategory} onChange={handleChange} style={{width:'100%', padding:10, borderRadius:5, border:'1px solid #ccc'}}>
                           <option value="">-- Select Folder --</option>
                           {getSubCategories().map(sub => <option key={sub} value={sub}>{sub}</option>)}
                       </select>
                   </div>
               </div>
               <div className="form-group"><label>Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="2" /></div>
            </div>

            <div className="form-section" style={{background:'#f0fdf4', borderLeft:'4px solid #16a34a'}}>
               <h3>Fees Structure</h3>
               <div style={{display:'flex', gap:10}}>
                   <div className="form-group" style={{flex:1}}><label>Official Fee (₹)</label><input type="number" name="officialFee" value={formData.officialFee} onChange={handleChange} /></div>
                   <div className="form-group" style={{flex:1}}><label>Service Charge (₹)</label><input type="number" name="serviceCharge" value={formData.serviceCharge} onChange={handleChange} style={{fontWeight:'bold', color:'green'}} /></div>
               </div>
            </div>

            <div className="form-section">
               <h3>Required Documents</h3>
               <div className="slot-input-box">
                   <input list="master-docs" value={docInput} onChange={e=>setDocInput(e.target.value)} placeholder="Type or Select..." style={{flex:1}}/>
                   <datalist id="master-docs">{masterDocs.map(d=><option key={d._id} value={d.label}/>)}</datalist>
                   <button type="button" className="add-btn-small" onClick={handleAddDocSmart}>+ Add</button>
               </div>
               <div className="slots-container">{formData.requiredDocuments.map((doc, i)=>(<div key={i} className="slot-tag">{doc}<span onClick={()=>removeDoc(i)} className="remove-x">×</span></div>))}</div>
            </div>

            {/* --- TEMPLATE SELECTOR --- */}
            <div className="form-section" style={{borderLeft:'4px solid #8b5cf6', paddingLeft:15, background:'#f5f3ff'}}>
               <h3 style={{color:'#5b21b6'}}>Application Form</h3>
               <p style={{fontSize:12, color:'#666', marginBottom:10}}>Link a reusable form template (e.g. KYC Form).</p>
               
               <div className="form-group">
                   <label style={{fontWeight:'bold'}}>Select Template:</label>
                   <select name="linkedFormId" value={formData.linkedFormId} onChange={handleChange} style={{width:'100%', padding:12, borderRadius:6, border:'2px solid #8b5cf6', fontSize:16}}>
                       <option value="">-- No Form (Docs Only) --</option>
                       {formTemplates.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                   </select>
                   <div style={{marginTop:10}}><Link to="/forms/builder" target="_blank" style={{color:'#2563eb', fontSize:12, textDecoration:'underline'}}>+ Create New Template</Link></div>
               </div>
            </div>

            <div className="form-group"><label>Instructions</label><textarea name="instructions" value={formData.instructions} onChange={handleChange} rows="2" /></div>
            <div className="form-actions"><button type="submit" className="submit-btn" disabled={loading}>{loading?'Saving...':'Publish Service'}</button></div>
          </form>
        </div>
      </main>
    </div>
  );
}


