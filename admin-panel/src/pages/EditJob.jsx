import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './AddJob.css';
import { API_BASE_URL } from '../config';
const API_URL = ${API_BASE_URL}/jobs';
const ADMIN_API_URL = `${API_BASE_URL}/admin';

const PREDEFINED_SLOTS = [
  "10:00 AM - 12:00 PM",
  "12:00 PM - 02:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
  "06:00 PM - 08:00 PM"
];

export default function EditJob({ onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Master Data States
  const [masterDocs, setMasterDocs] = useState([]);
  const [masterQuestions, setMasterQuestions] = useState([]);
  const [docInput, setDocInput] = useState('');
  const [customSlot, setCustomSlot] = useState("");

  const [formData, setFormData] = useState({
    title: '', organization: '', shortDescription: '', category: 'Government Job',
    applyLink: '', notificationLink: '',
    consentTextEn: "", consentTextHi: "",
    processInstructions: "", requiredDocuments: [], timeSlots: [],
    
    // Arrays
    importantDates: [], applicationFee: [], ageLimit: [],
    
    // New Fields
    serviceCharge: 50,
    feeStructure: [],
    formSchema: [],
    eligibilityDetails: [], 
    vacancyDetails: [], 
    importantLinks: [], 
    eligibilityCriteria: []
  });

  useEffect(() => {
    const init = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = token ? { headers: { 'x-auth-token': token } } : {};
            
            // 1. Load Job Data
            const jobRes = await axios.get(`${API_URL}/${id}`);
            const data = jobRes.data;

            // Safety Checks
            if(!data.eligibilityDetails) data.eligibilityDetails = [];
            if(!data.importantLinks) data.importantLinks = [];
            if(!data.requiredDocuments) data.requiredDocuments = [];
            if(!data.timeSlots) data.timeSlots = [];
            if(!data.feeStructure) data.feeStructure = [];
            if(!data.formSchema) data.formSchema = [];
            if(!data.serviceCharge) data.serviceCharge = 50;

            setFormData(data);

            // 2. Load Master Data
            const docRes = await axios.get(`${ADMIN_API_URL}/master-data/document`, headers);
            setMasterDocs(Array.isArray(docRes.data) ? docRes.data : []);
            const quesRes = await axios.get(`${ADMIN_API_URL}/master-data/question`, headers);
            setMasterQuestions(Array.isArray(quesRes.data) ? quesRes.data : []);
            
            setLoading(false);
        } catch(e) {
            console.error(e);
            alert("Error loading data");
            navigate('/jobs/manage');
        }
    };
    init();
  }, [id, navigate]);

  // --- HANDLERS ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleDynamicChange = (e, index, fieldName, key) => {
    const updatedArray = [...formData[fieldName]];
    if (e.target.type === 'checkbox') {
        updatedArray[index][key] = e.target.checked;
    } else {
        updatedArray[index][key] = e.target.value;
    }
    setFormData({ ...formData, [fieldName]: updatedArray });
  };
  
  const addRow = (fieldName, template) => setFormData({ ...formData, [fieldName]: [...formData[fieldName], template] });
  
  const removeRow = (index, fieldName) => {
    const updatedArray = [...formData[fieldName]];
    updatedArray.splice(index, 1);
    setFormData({ ...formData, [fieldName]: updatedArray });
  };

  // Fee Matrix Handlers
  const addFeeRule = () => setFormData({...formData, feeStructure: [...formData.feeStructure, {category:'', gender:'Any', amount:0}]});
  const updateFeeRule = (i, k, v) => { const u=[...formData.feeStructure]; u[i][k]=v; setFormData({...formData, feeStructure:u}); };
  const removeFeeRule = (i) => { const u=[...formData.feeStructure]; u.splice(i,1); setFormData({...formData, feeStructure:u}); };

  // Form Builder Handlers
  const addField = () => setFormData({...formData, formSchema: [...formData.formSchema, {label:'', type:'text', isRequired:true, options:[]}]});
  const updateField = (i, k, v) => { const u=[...formData.formSchema]; u[i][k]=v; setFormData({...formData, formSchema:u}); };
  const removeField = (i) => { const u=[...formData.formSchema]; u.splice(i,1); setFormData({...formData, formSchema:u}); };
  const addOption = (fi) => { const u=[...formData.formSchema]; u[fi].options.push({label:''}); setFormData({...formData, formSchema:u}); };
  const updateOption = (fi, oi, v) => { const u=[...formData.formSchema]; u[fi].options[oi].label=v; setFormData({...formData, formSchema:u}); };
  const removeOption = (fi, oi) => { const u=[...formData.formSchema]; u[fi].options.splice(oi,1); setFormData({...formData, formSchema:u}); };

  // Smart Logic
  const handleAddDocumentSmart = async () => {
    if (!docInput.trim()) return;
    if (formData.requiredDocuments.includes(docInput)) { setDocInput(''); return; }
    const existsInMaster = masterDocs.find(d => d.label.toLowerCase() === docInput.toLowerCase());
    if (existsInMaster) {
        setFormData({ ...formData, requiredDocuments: [...formData.requiredDocuments, existsInMaster.label] });
    } else {
        if (window.confirm(`"${docInput}" is new. Add to Master List?`)) {
            try {
                const token = localStorage.getItem('adminToken');
                await axios.post(`${ADMIN_API_URL}/master-data/add`, { type: 'document', label: docInput }, { headers: { 'x-auth-token': token } });
                setMasterDocs([...masterDocs, { label: docInput, key: docInput.toLowerCase().replace(/ /g,'_') }]);
                setFormData({ ...formData, requiredDocuments: [...formData.requiredDocuments, docInput] });
            } catch (e) {
                setFormData({ ...formData, requiredDocuments: [...formData.requiredDocuments, docInput] });
            }
        } else {
            setFormData({ ...formData, requiredDocuments: [...formData.requiredDocuments, docInput] });
        }
    }
    setDocInput('');
  };

  const addSlot = (slot) => {
      if (!slot.trim() || formData.timeSlots.includes(slot)) return;
      setFormData({ ...formData, timeSlots: [...formData.timeSlots, slot] });
      setCustomSlot("");
  };
  const removeSlot = (slot) => setFormData({...formData, timeSlots: formData.timeSlots.filter(s => s !== slot)});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_URL}/${id}`, formData);
      alert('Job Updated Successfully!');
      navigate('/jobs/manage');
    } catch (err) {
      console.error(err);
      alert('Error updating job.');
    }
    setSaving(false);
  };

  if (loading) return <div className="dashboard-container"><p style={{padding:20}}>Loading...</p></div>;

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <span className="nav-title">Edit Job</span>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <Link to="/jobs/manage" className="back-link">&larr; Back to List</Link>

        <div className="content-card form-card">
          <h2 className="card-title">Edit Job Details</h2>
          
          <form onSubmit={handleSubmit}>
            
            {/* Basic Info */}
            <div className="form-section">
               <h3>Basic Info</h3>
               <div className="form-group"><label>Title *</label><input name="title" value={formData.title} onChange={handleChange} required /></div>
               <div className="form-group"><label>Organization *</label><input name="organization" value={formData.organization} onChange={handleChange} required /></div>
               <div className="form-group"><label>Short Desc</label><textarea name="shortDescription" value={formData.shortDescription} onChange={handleChange} rows="3"></textarea></div>
            </div>

            {/* Links */}
            <div className="form-section">
               <h3>Primary Links</h3>
               <div className="form-group"><label>Apply Link</label><input name="applyLink" value={formData.applyLink || ''} onChange={handleChange} /></div>
               <div className="form-group"><label>Notification Link</label><input name="notificationLink" value={formData.notificationLink || ''} onChange={handleChange} /></div>
            </div>

            {/* FEE STRUCTURE */}
            <div className="form-section" style={{borderLeft:'4px solid #10b981', paddingLeft:15, background:'#f0fdf4'}}>
               <h3 style={{color:'#047857'}}>Step 1: Fee Structure</h3>
               <div className="form-group">
                   <label>SewaOne Service Charge (₹)</label>
                   <input type="number" value={formData.serviceCharge} onChange={e=>setFormData({...formData, serviceCharge: e.target.value})} style={{fontWeight:'bold', color:'green', width:100, padding:8}} />
               </div>
               <label style={{fontWeight:'bold', display:'block', marginBottom:5}}>Official Fee Rules</label>
               {formData.feeStructure.map((rule, index) => (
                   <div key={index} style={{display:'flex', gap:10, marginBottom:10, background:'#fff', padding:10, borderRadius:6, border:'1px solid #ddd'}}>
                       <input placeholder="Category" value={rule.category} onChange={e=>updateFeeRule(index, 'category', e.target.value)} style={{flex:2, padding:5}} />
                       <select value={rule.gender} onChange={e=>updateFeeRule(index, 'gender', e.target.value)} style={{flex:1, padding:5}}>
                           <option value="Any">Any Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                       </select>
                       <input type="number" placeholder="Fee ₹" value={rule.amount} onChange={e=>updateFeeRule(index, 'amount', e.target.value)} style={{flex:1, padding:5}} />
                       <button type="button" onClick={()=>removeFeeRule(index)} style={{color:'red', border:'none', background:'none'}}>×</button>
                   </div>
               ))}
               <button type="button" onClick={addFeeRule} className="add-btn-small" style={{background:'#10b981'}}>+ Add Rule</button>
            </div>

            {/* FORM BUILDER */}
            <div className="form-section" style={{borderLeft:'4px solid #2563eb', paddingLeft:15, background:'#eff6ff'}}>
               <h3 style={{color:'#1e40af'}}>Step 2: User Application Form</h3>
               {formData.formSchema.map((field, index) => (
                   <div key={index} style={{background:'#fff', padding:15, borderRadius:8, marginBottom:10, border:'1px solid #e2e8f0'}}>
                       <div style={{display:'flex', gap:10, marginBottom:5}}>
                           <input placeholder="Label" value={field.label} onChange={e=>updateField(index, 'label', e.target.value)} style={{flex:2, padding:8}} />
                           <select value={field.type} onChange={e=>updateField(index, 'type', e.target.value)} style={{flex:1, padding:8}}>
                               <option value="text">Text</option><option value="number">Number</option><option value="dropdown">Dropdown</option><option value="date">Date</option>
                           </select>
                           <label style={{display:'flex', alignItems:'center', gap:5}}><input type="checkbox" checked={field.isRequired} onChange={e=>updateField(index, 'isRequired', e.target.checked)}/> Req?</label>
                           <button type="button" onClick={()=>removeField(index)} style={{color:'red', border:'none', background:'none'}}>×</button>
                       </div>
                       {field.type === 'dropdown' && (
                           <div style={{marginLeft:20, padding:5, borderLeft:'2px dashed #ccc'}}>
                               {field.options.map((opt, oi) => (
                                   <div key={oi} style={{display:'flex', gap:5, marginBottom:5}}>
                                       <input placeholder="Option" value={opt.label} onChange={e=>updateOption(index, oi, e.target.value)} style={{padding:5}} />
                                       <button type="button" onClick={()=>removeOption(index, oi)} style={{color:'#666', border:'none'}}>×</button>
                                   </div>
                               ))}
                               <button type="button" onClick={()=>addOption(index)} style={{fontSize:11, color:'blue', background:'none', border:'none'}}>+ Option</button>
                           </div>
                       )}
                   </div>
               ))}
               <button type="button" onClick={addField} className="add-btn-small" style={{background:'#2563eb'}}>+ Add Field</button>
            </div>

            {/* Process & Docs */}
            <div className="form-section">
               <h3>Process & Documents</h3>
               <div className="form-group"><label>Instructions</label><textarea name="processInstructions" value={formData.processInstructions || ''} onChange={handleChange} rows="3"></textarea></div>
               
               <div className="form-group">
                  <label>Required Documents</label>
                  <div className="slots-container">
                      {formData.requiredDocuments.map((d,i)=>(<div key={i} className="slot-tag">{d}<span onClick={()=>setFormData({...formData,requiredDocuments:formData.requiredDocuments.filter(x=>x!==d)})} className="remove-x">×</span></div>))}
                  </div>
                  <div className="slot-input-box"><input list="master-docs" value={docInput} onChange={e=>setDocInput(e.target.value)} style={{flex:1}}/><datalist id="master-docs">{masterDocs.map(d=><option key={d._id} value={d.label}/>)}</datalist><button type="button" className="add-btn-small" onClick={handleAddDocumentSmart}>+ Add</button></div>
               </div>

               <div className="form-group">
                   <label>Time Slots</label>
                   <div className="slots-container">
                      {formData.timeSlots.map((s,i)=>(<div key={i} className="slot-tag">{s}<span onClick={()=>removeSlot(s)} className="remove-x">×</span></div>))}
                   </div>
                   <div className="slot-input-box"><input value={customSlot} onChange={e=>setCustomSlot(e.target.value)} style={{flex:1}}/><button type="button" className="add-btn-small" onClick={()=>addSlot(customSlot)}>+ Add</button></div>
                   <div className="quick-slots"><small>Quick:</small>{PREDEFINED_SLOTS.map(s=><button key={s} type="button" className="preset-btn" onClick={()=>addSlot(s)} disabled={formData.timeSlots.includes(s)}>{s}</button>)}</div>
               </div>
            </div>

            {/* Eligibility Text Details */}
            <div className="form-section">
                <div className="section-header"><h3>Eligibility Details (Text List)</h3><button type="button" className="add-row-btn" onClick={()=>addRow('eligibilityDetails',{detail:''})}>+ Add</button></div>
                {formData.eligibilityDetails.map((item, i) => (
                    <div className="dynamic-row" key={i}>
                        <input value={item.detail} onChange={(e)=>handleDynamicChange(e,i,'eligibilityDetails','detail')} className="full-width"/>
                        <button type="button" className="remove-btn" onClick={()=>removeRow(i,'eligibilityDetails')}>X</button>
                    </div>
                ))}
            </div>

            {/* Smart Criteria */}
            <div className="form-section">
               <div className="section-header"><h3>Smart Eligibility Check</h3><button type="button" className="add-row-btn" onClick={()=>addRow('eligibilityCriteria',{question:'',key:'',expectedValue:'Yes'})}>+ Add</button></div>
               {formData.eligibilityCriteria.map((item, index) => (
                  <div className="dynamic-row" key={index} style={{alignItems:'flex-start'}}>
                     <div style={{flex:2}}>
                         <select value={item.question} onChange={(e)=>{
                             const q=masterQuestions.find(x=>x.label===e.target.value);
                             const u=[...formData.eligibilityCriteria]; 
                             u[index].question=e.target.value; 
                             u[index].key=q?q.key:e.target.value.toLowerCase().replace(/ /g,'_').substring(0,20); 
                             setFormData({...formData,eligibilityCriteria:u})
                         }} style={{padding:'8px',width:'100%'}}>
                             <option value="">Select Question...</option>
                             {masterQuestions.map(q=><option key={q.key} value={q.label}>{q.label}</option>)}
                         </select>
                         <input placeholder="Or Custom..." onChange={(e)=>{
                             const u=[...formData.eligibilityCriteria]; 
                             u[index].question=e.target.value; 
                             u[index].key=e.target.value.toLowerCase().replace(/ /g,'_').substring(0,20); 
                             setFormData({...formData,eligibilityCriteria:u})
                         }} style={{width:'100%',marginTop:5,fontSize:12}}/>
                     </div>
                     <div style={{flex:1}}>
                         <select value={item.expectedValue} onChange={(e)=>handleDynamicChange(e,index,'eligibilityCriteria','expectedValue')} style={{padding:'8px',width:'100%'}}>
                             <option value="Yes">YES</option><option value="No">NO</option>
                         </select>
                     </div>
                     <button type="button" className="remove-btn" onClick={()=>removeRow(index,'eligibilityCriteria')}>X</button>
                  </div>
               ))}
            </div>

            {/* Other Arrays */}
            <div className="form-section">
                 <div className="section-header"><h3>Important Dates</h3><button type="button" className="add-row-btn" onClick={() => addRow('importantDates', {label:'',value:''})}>+ Add</button></div>
                 {formData.importantDates.map((item,i)=>(<div className="dynamic-row" key={i}><input value={item.label} onChange={(e)=>handleDynamicChange(e,i,'importantDates','label')} placeholder="Label"/><input value={item.value} onChange={(e)=>handleDynamicChange(e,i,'importantDates','value')} placeholder="Value"/><button type="button" className="remove-btn" onClick={()=>removeRow(i,'importantDates')}>X</button></div>))}
            </div>

            <div className="form-section">
                 <div className="section-header"><h3>Application Fee (Display Only)</h3><button type="button" className="add-row-btn" onClick={() => addRow('applicationFee', {category:'',amount:''})}>+ Add</button></div>
                 {formData.applicationFee.map((item,i)=>(<div className="dynamic-row" key={i}><input value={item.category} onChange={(e)=>handleDynamicChange(e,i,'applicationFee','category')} placeholder="Cat"/><input value={item.amount} onChange={(e)=>handleDynamicChange(e,i,'applicationFee','amount')} placeholder="Amt"/><button type="button" className="remove-btn" onClick={()=>removeRow(i,'applicationFee')}>X</button></div>))}
            </div>

            <div className="form-section">
                 <div className="section-header"><h3>Age Limit</h3><button type="button" className="add-row-btn" onClick={() => addRow('ageLimit', {detail:''})}>+ Add</button></div>
                 {formData.ageLimit.map((item,i)=>(<div className="dynamic-row" key={i}><input value={item.detail} onChange={(e)=>handleDynamicChange(e,i,'ageLimit','detail')} className="full-width"/><button type="button" className="remove-btn" onClick={()=>removeRow(i,'ageLimit')}>X</button></div>))}
            </div>

            <div className="form-section">
                 <div className="section-header"><h3>Vacancy Details</h3><button type="button" className="add-row-btn" onClick={() => addRow('vacancyDetails', {postName:'',totalPost:'',eligibility:''})}>+ Add</button></div>
                 {formData.vacancyDetails.map((item,i)=>(<div className="dynamic-row" key={i}><input value={item.postName} onChange={(e)=>handleDynamicChange(e,i,'vacancyDetails','postName')} placeholder="Post"/><input value={item.totalPost} onChange={(e)=>handleDynamicChange(e,i,'vacancyDetails','totalPost')} placeholder="Total"/><input value={item.eligibility} onChange={(e)=>handleDynamicChange(e,i,'vacancyDetails','eligibility')} placeholder="Elig"/><button type="button" className="remove-btn" onClick={()=>removeRow(i,'vacancyDetails')}>X</button></div>))}
            </div>

            {/* Custom Links */}
            <div className="form-section">
              <div className="section-header"><h3>Other Links</h3><button type="button" className="add-row-btn" onClick={()=>addRow('importantLinks',{label:'',url:'',isShow:true})}>+ Add</button></div>
              {formData.importantLinks.map((item, index) => (
                <div className="dynamic-row" key={index} style={{alignItems:'center'}}>
                  <input value={item.label} onChange={(e)=>handleDynamicChange(e,index,'importantLinks','label')} placeholder="Label"/>
                  <input value={item.url} onChange={(e)=>handleDynamicChange(e,index,'importantLinks','url')} placeholder="URL"/>
                  <label style={{display:'flex',alignItems:'center',gap:5,background:'#eee',padding:8,borderRadius:4}}>
                      <input type="checkbox" checked={item.isShow !== false} onChange={(e)=>handleDynamicChange(e,index,'importantLinks','isShow')}/>
                      <span style={{fontSize:12}}>Show?</span>
                  </label>
                  <button type="button" className="remove-btn" onClick={()=>removeRow(index,'importantLinks')}>X</button>
                </div>
              ))}
            </div>

            {/* Consent */}
            <div className="form-section">
              <h3>Consent</h3>
              <div className="form-group"><label>English</label><textarea name="consentTextEn" value={formData.consentTextEn || ''} onChange={handleChange} rows="3"></textarea></div>
              <div className="form-group"><label>Hindi</label><textarea name="consentTextHi" value={formData.consentTextHi || ''} onChange={handleChange} rows="3"></textarea></div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={saving}>
                {saving ? 'Updating...' : 'Update Job'}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}


