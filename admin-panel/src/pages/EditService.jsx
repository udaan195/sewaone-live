import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './AddJob.css'; 
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/services`;
const ADMIN_API_URL = `${API_BASE_URL}/admin`;

export default function EditService({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [masterDocs, setMasterDocs] = useState([]);
  const [docInput, setDocInput] = useState('');

  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Citizen Service', subCategory: '',
    officialFee: 0, serviceCharge: 50, instructions: '', requiredDocuments: [], requiredFields: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API_URL}/${id}`, { headers: { 'x-auth-token': token } });
        setFormData(res.data);
        const docRes = await axios.get(`${ADMIN_API_URL}/master-data/document`, { headers: { 'x-auth-token': token } });
        setMasterDocs(Array.isArray(docRes.data) ? docRes.data : []);
        setLoading(false);
      } catch (err) { navigate('/services/manage'); }
    };
    fetchData();
  }, [id, navigate]);

  // --- ✅ UPDATED SUB-CATEGORIES LOGIC ---
  const getSubCategories = () => {
      if (formData.category === 'Citizen Service') {
          return ['Identity Proof', 'Certificates', 'Transport/Driving', 'Police/Legal', 'Others'];
      } else if (formData.category === 'Government Scheme') {
          return ['Farmers', 'Housing', 'Health', 'Students/Youth', 'Pension', 'Women', 'Others'];
      } else if (formData.category === 'Other') {
          return ['PF Service', 'Tax Service', 'Business Service', 'Insurance', 'Licenses', 'General'];
      } else {
          return ['General'];
      }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleAddDocSmart = () => {
    if (!docInput.trim()) return;
    if (!formData.requiredDocuments.includes(docInput)) setFormData({ ...formData, requiredDocuments: [...formData.requiredDocuments, docInput] });
    setDocInput('');
  };
  const removeDoc = (i) => { const u = [...formData.requiredDocuments]; u.splice(i,1); setFormData({...formData, requiredDocuments:u}); };
  const addField = () => setFormData({...formData, requiredFields: [...formData.requiredFields, { label: '', type: 'text', required: true }]});
  const updateField = (i, k, v) => { const u = [...formData.requiredFields]; u[i][k] = v; setFormData({...formData, requiredFields: u}); };
  const removeField = (i) => { const u = [...formData.requiredFields]; u.splice(i, 1); setFormData({...formData, requiredFields: u}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/update/${id}`, formData, { headers: { 'x-auth-token': token } });
      alert('Service Updated Successfully!');
      navigate('/services/manage');
    } catch (err) { alert('Error updating service.'); }
    setSaving(false);
  };

  if(loading) return <div className="dashboard-container"><p style={{padding:20}}>Loading...</p></div>;

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav"><div className="nav-content"><span className="nav-title">Edit Service</span><button onClick={onLogout} className="logout-button">Logout</button></div></nav>
      <main className="dashboard-main">
        <Link to="/services/manage" className="back-link">&larr; Back</Link>
        <div className="content-card form-card">
          <h2 className="card-title">Edit Service</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-section">
               <h3>Basic Details</h3>
               <div className="form-group"><label>Title</label><input name="title" value={formData.title} onChange={handleChange} required /></div>
               <div style={{display:'flex', gap:10}}>
                   <div className="form-group" style={{flex:1}}>
                       <label>Category</label>
                       <select name="category" value={formData.category} onChange={handleChange} style={{width:'100%', padding:10}}>
                           <option value="Citizen Service">Citizen Service</option>
                           <option value="Government Scheme">Government Scheme</option>
                           <option value="Other">Other Services</option>
                       </select>
                   </div>
                   <div className="form-group" style={{flex:1}}>
                       <label>Sub Category</label>
                       <select name="subCategory" value={formData.subCategory} onChange={handleChange} style={{width:'100%', padding:10}}>
                           <option value="">-- Select --</option>
                           {getSubCategories().map(sub => <option key={sub} value={sub}>{sub}</option>)}
                       </select>
                   </div>
               </div>
               <div className="form-group"><label>Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="2" /></div>
            </div>
            {/* Rest of the form remains same (Fees, Docs, Fields) */}
            <div className="form-section" style={{background:'#f0fdf4'}}><div style={{display:'flex', gap:10}}><div className="form-group" style={{flex:1}}><label>Official Fee</label><input type="number" name="officialFee" value={formData.officialFee} onChange={handleChange}/></div><div className="form-group" style={{flex:1}}><label>Service Charge</label><input type="number" name="serviceCharge" value={formData.serviceCharge} onChange={handleChange}/></div></div></div>
            <div className="form-section"><h3>Documents</h3><div className="slot-input-box"><input list="master-docs" value={docInput} onChange={e=>setDocInput(e.target.value)} placeholder="Add..." style={{flex:1}}/><button type="button" className="add-btn-small" onClick={handleAddDocSmart}>+</button></div><div className="slots-container">{formData.requiredDocuments.map((doc, i)=>(<div key={i} className="slot-tag">{doc}<span onClick={()=>removeDoc(i)} className="remove-x">×</span></div>))}</div></div>
            <div className="form-section"><h3>Fields</h3>{formData.requiredFields.map((field, i) => (<div key={i} style={{display:'flex', gap:5, marginBottom:5}}><input value={field.label} onChange={e=>updateField(i,'label',e.target.value)} style={{flex:2, padding:8}}/><select value={field.type} onChange={e=>updateField(i,'type',e.target.value)} style={{flex:1}}><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option></select><button type="button" onClick={()=>removeField(i)} style={{color:'red'}}>×</button></div>))}<button type="button" onClick={addField} className="add-btn-small">+ Add</button></div>
            <div className="form-actions"><button type="submit" className="submit-btn" disabled={saving}>{saving?'Updating...':'Update'}</button></div>
          </form>
        </div>
      </main>
    </div>
  );
}


