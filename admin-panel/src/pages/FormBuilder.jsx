import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './AddJob.css';
import { API_BASE_URL } from '../config';
const API_URL = `${API_BASE_URL}/forms`;
const ADMIN_API_URL = `${API_BASE_URL}/admin`;

export default function FormBuilder({ onLogout }) {
  const [loading, setLoading] = useState(false);
  
  // Master Data
  const [masterDocs, setMasterDocs] = useState([]);
  const [docInput, setDocInput] = useState('');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [officialFee, setOfficialFee] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(50);
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [sections, setSections] = useState([{ heading: 'Personal Details', fields: [] }]);
  
  // Editing State
  const [editingId, setEditingId] = useState(null);
  const [templatesList, setTemplatesList] = useState([]);

  // Initial Load
  useEffect(() => {
    loadMasterDocs();
    fetchTemplates();
  }, []);

  const loadMasterDocs = async () => {
      try {
          const token = localStorage.getItem('adminToken');
          const res = await axios.get(`${ADMIN_API_URL}/master-data/document`, { headers: { 'x-auth-token': token } });
          setMasterDocs(res.data);
      } catch(e){}
  };

  const fetchTemplates = async () => {
      try {
          const token = localStorage.getItem('adminToken');
          const res = await axios.get(`${API_URL}/list`, { headers: { 'x-auth-token': token } });
          setTemplatesList(res.data);
      } catch(e){}
  };

  // --- HANDLERS (Same logic) ---
  const addDoc = () => { if(docInput.trim() && !requiredDocuments.includes(docInput)) setRequiredDocuments([...requiredDocuments, docInput]); setDocInput(''); };
  const removeDoc = (i) => { const u=[...requiredDocuments]; u.splice(i,1); setRequiredDocuments(u); };

  const addSection = () => setSections([...sections, { heading: '', fields: [] }]);
  const removeSection = (i) => { const u=[...sections]; u.splice(i,1); setSections(u); };
  const updateHeading = (i, v) => { const u=[...sections]; u[i].heading=v; setSections(u); };
  
  const addField = (si) => { const u=[...sections]; u[si].fields.push({label:'',type:'text',isRequired:true,options:[],fileConfig:{allowedTypes:'all'}}); setSections(u); };
  const removeField = (si, fi) => { const u=[...sections]; u[si].fields.splice(fi,1); setSections(u); };
  const updateField = (si, fi, k, v) => { 
      const u=[...sections]; 
      if(k.includes('.')) { const [p,c]=k.split('.'); u[si].fields[fi][p][c]=v; } 
      else u[si].fields[fi][k]=v; 
      setSections(u); 
  };
  const addOpt = (si,fi) => { const u=[...sections]; u[si].fields[fi].options.push({label:''}); setSections(u); };
  const updateOpt = (si,fi,oi,v) => { const u=[...sections]; u[si].fields[fi].options[oi].label=v; setSections(u); };
  const removeOpt = (si,fi,oi) => { const u=[...sections]; u[si].fields[fi].options.splice(oi,1); setSections(u); };

  // --- SAVE / UPDATE ---
  const handleSave = async () => {
      if (!formTitle) return alert("Enter Form Title");
      setLoading(true);
      try {
          const token = localStorage.getItem('adminToken');
          const payload = { title: formTitle, officialFee, serviceCharge, requiredDocuments, sections };
          
          if (editingId) {
              // UPDATE
              await axios.put(`${API_URL}/update/${editingId}`, payload, { headers: { 'x-auth-token': token } });
              alert("Template Updated!");
          } else {
              // CREATE
              await axios.post(`${API_URL}/create`, payload, { headers: { 'x-auth-token': token } });
              alert("Template Created!");
          }
          
          resetForm();
          fetchTemplates();
      } catch (e) { alert("Error saving form"); }
      finally { setLoading(false); }
  };

  // --- EDIT / DELETE ACTIONS ---
  const handleEdit = async (id) => {
      setLoading(true);
      try {
          const res = await axios.get(`${API_URL}/${id}`);
          const data = res.data;
          setFormTitle(data.title);
          setOfficialFee(data.officialFee || 0);
          setServiceCharge(data.serviceCharge || 50);
          setRequiredDocuments(data.requiredDocuments || []);
          setSections(data.sections || []);
          setEditingId(data._id);
          window.scrollTo(0, 0); // Scroll to top
      } catch(e) { alert("Error loading template"); }
      finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Delete this template?")) return;
      try {
          const token = localStorage.getItem('adminToken');
          await axios.delete(`${API_URL}/${id}`, { headers: { 'x-auth-token': token } });
          fetchTemplates();
      } catch(e) { alert("Error deleting"); }
  };

  const resetForm = () => {
      setEditingId(null);
      setFormTitle('');
      setOfficialFee(0);
      setServiceCharge(50);
      setRequiredDocuments([]);
      setSections([{ heading: 'Personal Details', fields: [] }]);
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav"><div className="nav-content"><span className="nav-title">Form Builder</span><button onClick={onLogout} className="logout-button">Logout</button></div></nav>
      <main className="dashboard-main">
        <Link to="/" className="back-link">&larr; Dashboard</Link>
        
        <div className="content-card form-card" style={{maxWidth: '900px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2 className="card-title">{editingId ? 'Edit Template' : 'Create Template'}</h2>
                {editingId && <button onClick={resetForm} style={{background:'#ccc', border:'none', padding:'5px 10px', borderRadius:4, cursor:'pointer'}}>Cancel Edit</button>}
            </div>
            
            {/* 1. SETTINGS */}
            <div className="form-section" style={{background: editingId ? '#fffbeb' : '#f0fdf4', borderLeft: editingId ? '4px solid #f59e0b' : '4px solid #16a34a'}}>
                <h3>Configuration</h3>
                <div className="form-group"><label>Template Name</label><input value={formTitle} onChange={e=>setFormTitle(e.target.value)} placeholder="Ex: Standard PAN Form" style={{fontWeight:'bold'}}/></div>
                <div style={{display:'flex', gap:10}}>
                    <div className="form-group" style={{flex:1}}><label>Official Fee (₹)</label><input type="number" value={officialFee} onChange={e=>setOfficialFee(e.target.value)}/></div>
                    <div className="form-group" style={{flex:1}}><label>Service Charge (₹)</label><input type="number" value={serviceCharge} onChange={e=>setServiceCharge(e.target.value)}/></div>
                </div>
                <div className="form-group"><label>Required Documents</label><div className="slot-input-box"><input list="master-docs" value={docInput} onChange={e=>setDocInput(e.target.value)} placeholder="Add Doc..." style={{flex:1}}/><datalist id="master-docs">{masterDocs.map(d=><option key={d._id} value={d.label}/>)}</datalist><button onClick={addDoc} className="add-btn-small">+ Add</button></div><div className="slots-container">{requiredDocuments.map((d,i)=><div key={i} className="slot-tag">{d}<span onClick={()=>removeDoc(i)} className="remove-x">×</span></div>)}</div></div>
            </div>

            {/* 2. BUILDER */}
            {sections.map((sec, si) => (
                <div key={si} style={{border:'2px solid #3b82f6', borderRadius:10, padding:20, marginBottom:20, backgroundColor:'#eff6ff'}}>
                    <div style={{display:'flex', gap:10, marginBottom:15}}><input value={sec.heading} onChange={e=>updateHeading(si, e.target.value)} placeholder="Section Heading" style={{flex:1, fontWeight:'bold', color:'#1e3c72'}}/><button onClick={()=>removeSection(si)} style={{color:'red', border:'none', background:'none'}}>Delete Section</button></div>
                    {sec.fields.map((f, fi) => (
                        <div key={fi} style={{background:'#fff', padding:10, borderRadius:5, marginBottom:10, border:'1px solid #ddd'}}>
                            <div style={{display:'flex', gap:5, alignItems:'center'}}>
                                <input value={f.label} onChange={e=>updateField(si,fi,'label',e.target.value)} placeholder="Field Label" style={{flex:2}}/>
                                <select value={f.type} onChange={e=>updateField(si,fi,'type',e.target.value)} style={{flex:1}}><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="dropdown">Dropdown</option><option value="file">File Upload</option></select>
                                <label><input type="checkbox" checked={f.isRequired} onChange={e=>updateField(si,fi,'isRequired',e.target.checked)}/> Req?</label>
                                <button onClick={()=>removeField(si,fi)} style={{color:'red', border:'none', background:'none', fontSize:20, cursor:'pointer', marginLeft:'auto'}}>×</button>
                            </div>
                            {f.type === 'dropdown' && (<div style={{marginTop:5, paddingLeft:10, borderLeft:'2px solid #ccc'}}>{f.options.map((o, oi)=><div key={oi} style={{display:'flex',gap:5,marginTop:2}}><input value={o.label} onChange={e=>updateOpt(si,fi,oi,e.target.value)} placeholder="Option" style={{padding:2}}/><button onClick={()=>removeOpt(si,fi,oi)}>×</button></div>)}<button onClick={()=>addOpt(si,fi)} style={{fontSize:10, color:'blue', border:'none', marginTop:2}}>+ Option</button></div>)}
                        </div>
                    ))}
                    <button onClick={()=>addField(si)} style={{width:'100%', background:'#dbeafe', color:'#1e40af', border:'1px dashed #3730a3', padding:'8px 15px', borderRadius:5, cursor:'pointer', width:'100%', marginTop:10}}>+ Add Field</button>
                </div>
            ))}
            <button onClick={addSection} style={{width:'100%', padding:12, background:'#333', color:'#fff', borderRadius:8, marginBottom:20}}>+ Add Section</button>
            <button onClick={handleSave} className="submit-btn" disabled={loading} style={{background: editingId ? '#f59e0b' : '#2563eb'}}>{loading ? 'Saving...' : editingId ? 'Update Template' : 'Save New Template'}</button>
        </div>

        {/* --- EXISTING TEMPLATES LIST --- */}
        <div className="content-card" style={{marginTop: 30}}>
            <h3 style={{color:'#1e3c72', marginBottom: 15}}>Saved Templates</h3>
            <div className="table-responsive">
                <table className="jobs-table">
                    <thead><tr><th>Template Name</th><th>Fees (Off+Srv)</th><th>Created</th><th>Actions</th></tr></thead>
                    <tbody>
                        {templatesList.map(t => (
                            <tr key={t._id} style={{background: editingId === t._id ? '#fffbeb' : 'transparent'}}>
                                <td style={{fontWeight:'bold'}}>{t.title}</td>
                                <td>₹{(t.officialFee || 0) + (t.serviceCharge || 0)}</td>
                                <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button onClick={()=>handleEdit(t._id)} className="action-btn edit-btn">Edit</button>
                                    <button onClick={()=>handleDelete(t._id)} className="action-btn delete-btn">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {templatesList.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:20}}>No templates found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>

      </main>
    </div>
  );
}


