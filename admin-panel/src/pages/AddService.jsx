import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './AddJob.css';
import { API_BASE_URL } from '../config'; 

const API_URL = `${API_BASE_URL}/services`;
const ADMIN_API_URL = `${API_BASE_URL}/admin`;

export default function AddService({ onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [masterDocs, setMasterDocs] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]); // ✅ NEW: Store Templates
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
    requiredFields: [],
    formTemplateId: '' // ✅ NEW: Link to Form Builder
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        
        // 1. Load Master Docs
        const docRes = await axios.get(`${ADMIN_API_URL}/master-data/document`, { headers: { 'x-auth-token': token } });
        setMasterDocs(Array.isArray(docRes.data) ? docRes.data : []);

        // 2. ✅ Load Form Templates (Jisse aap Form select kar payein)
        const formRes = await axios.get(`${API_BASE_URL}/forms`, { headers: { 'x-auth-token': token } });
        setFormTemplates(Array.isArray(formRes.data) ? formRes.data : []);

      } catch(e) {
        console.error("Error loading data", e);
      }
    };
    loadData();
  }, []);

  // --- Sub-Categories Logic ---
  const getSubCategories = () => {
      if (formData.category === 'Citizen Service') {
          return ['Identity Proof', 'Certificates', 'Transport/Driving', 'Police/Legal', 'Others'];
      } 
      else if (formData.category === 'Government Scheme') {
          return ['Farmers', 'Housing', 'Health', 'Students/Youth', 'Pension', 'Women', 'Others'];
      } 
      else if (formData.category === 'Other') {
          return ['PF Service', 'Tax Service', 'Business Service', 'Insurance', 'Licenses', 'General'];
      }
      else {
          return ['General'];
      }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddDocSmart = async () => {
    if (!docInput.trim()) return;
    if (formData.requiredDocuments.includes(docInput)) { setDocInput(''); return; }
    setFormData({ ...formData, requiredDocuments: [...formData.requiredDocuments, docInput] });
    setDocInput('');
  };
  
  const removeDoc = (i) => { const u=[...formData.requiredDocuments]; u.splice(i,1); setFormData({...formData, requiredDocuments:u}); };

  const addField = () => setFormData({...formData, requiredFields: [...formData.requiredFields, { label: '', type: 'text', required: true }]});
  const updateField = (i, k, v) => { const u = [...formData.requiredFields]; u[i][k] = v; setFormData({...formData, requiredFields: u}); };
  const removeField = (i) => { const u = [...formData.requiredFields]; u.splice(i, 1); setFormData({...formData, requiredFields: u}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      // Ensure fees are numbers
      const payload = {
        ...formData,
        officialFee: Number(formData.officialFee),
        serviceCharge: Number(formData.serviceCharge)
      };

      await axios.post(`${API_URL}/add`, payload, { headers: { 'x-auth-token': token } });
      alert('Service Published Successfully!');
      navigate('/services/manage');
    } catch (err) { 
      console.error(err);
      alert('Error adding service.'); 
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
          <div className="nav-content">
              <span className="nav-title">Add Service</span>
              <button onClick={onLogout} className="logout-button">Logout</button>
          </div>
      </nav>
      
      <main className="dashboard-main">
        <Link to="/services/manage" className="back-link">&larr; Back to Services</Link>
        
        <div className="content-card form-card">
          <h2 className="card-title">New Service Entry</h2>
          <form onSubmit={handleSubmit}>
            
            {/* 1. Basic Details */}
            <div className="form-section">
               <h3>Basic Details</h3>
               <div className="form-group">
                   <label>Title</label>
                   <input name="title" value={formData.title} onChange={handleChange} required placeholder="Ex: PF Withdrawal" />
               </div>
               
               <div style={{display:'flex', gap:10}}>
                   <div className="form-group" style={{flex:1}}>
                       <label style={{color:'#2563eb', fontWeight:'bold'}}>Category</label>
                       <select name="category" value={formData.category} onChange={handleChange} style={{width:'100%', padding:10, borderRadius:5, border:'1px solid #ccc'}}>
                           <option value="Citizen Service">Citizen Service</option>
                           <option value="Government Scheme">Government Scheme</option>
                           <option value="Other">Other Services</option>
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
               
               <div className="form-group">
                   <label>Description</label>
                   <textarea name="description" value={formData.description} onChange={handleChange} rows="2" />
               </div>
            </div>

            {/* 2. Fees */}
            <div className="form-section" style={{background:'#f0fdf4'}}>
               <h3>Fees Structure</h3>
               <div style={{display:'flex', gap:10}}>
                   <div className="form-group" style={{flex:1}}>
                       <label>Official Fee (₹)</label>
                       <input type="number" name="officialFee" value={formData.officialFee} onChange={handleChange} />
                   </div>
                   <div className="form-group" style={{flex:1}}>
                       <label>Service Charge (₹)</label>
                       <input type="number" name="serviceCharge" value={formData.serviceCharge} onChange={handleChange} />
                   </div>
               </div>
            </div>

            {/* ✅ 3. FORM BUILDER SELECTION (NEW) */}
            <div className="form-section" style={{background:'#eff6ff', border:'1px solid #bfdbfe'}}>
               <h3 style={{color:'#1e40af'}}>Link Custom Form (Optional)</h3>
               <p style={{fontSize:'12px', color:'#666', marginBottom:'8px'}}>
                   Select a form you created in "Form Builder". If selected, the user will see that form instead of the default fields.
               </p>
               <select 
                  name="formTemplateId" 
                  value={formData.formTemplateId} 
                  onChange={handleChange}
                  style={{width:'100%', padding:10, borderRadius:5, border:'1px solid #93c5fd'}}
               >
                   <option value="">-- Use Default / Manual Fields Below --</option>
                   {formTemplates.map(tmpl => (
                       <option key={tmpl._id} value={tmpl._id}>
                           {tmpl.title} (Fields: {tmpl.fields?.length || 0})
                       </option>
                   ))}
               </select>
            </div>

            {/* 4. Documents */}
            <div className="form-section">
               <h3>Documents Required</h3>
               <div className="slot-input-box">
                   <input list="master-docs" value={docInput} onChange={e=>setDocInput(e.target.value)} placeholder="Type or select document..." style={{flex:1}}/>
                   <datalist id="master-docs">{masterDocs.map(d=><option key={d._id} value={d.label}/>)}</datalist>
                   <button type="button" className="add-btn-small" onClick={handleAddDocSmart}>+ Add</button>
               </div>
               <div className="slots-container">
                   {formData.requiredDocuments.map((doc, i)=>(
                       <div key={i} className="slot-tag">{doc}<span onClick={()=>removeDoc(i)} className="remove-x">×</span></div>
                   ))}
               </div>
            </div>

            {/* 5. Manual Fields (Fallback) */}
            <div className="form-section">
               <h3>Extra Manual Fields (If no template selected)</h3>
               {formData.requiredFields.map((field, i) => (
                   <div key={i} style={{display:'flex', gap:5, marginBottom:5}}>
                       <input placeholder="Label (e.g. Father Name)" value={field.label} onChange={e=>updateField(i,'label',e.target.value)} style={{flex:2, padding:8}}/>
                       <select value={field.type} onChange={e=>updateField(i,'type',e.target.value)} style={{flex:1, padding:8}}>
                           <option value="text">Text</option>
                           <option value="number">Number</option>
                           <option value="date">Date</option>
                       </select>
                       <button type="button" onClick={()=>removeField(i)} style={{color:'red', border:'none', background:'none', fontSize:'20px'}}>×</button>
                   </div>
               ))}
               <button type="button" onClick={addField} className="add-btn-small">+ Add Field</button>
            </div>

            <div className="form-group">
                <label>Instructions</label>
                <textarea name="instructions" value={formData.instructions} onChange={handleChange} />
            </div>
            
            <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Publishing...' : 'Publish Service'}
                </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}


