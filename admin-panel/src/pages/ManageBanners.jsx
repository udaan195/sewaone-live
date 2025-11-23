import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './ManageJobs.css'; // Hum table/form styling re-use kar rahe hain
import { API_BASE_URL } from '../config';
const API_URL = `${API_BASE_URL}/admin`;

// --- CLOUDINARY CONFIG ---
// Yahan apni details dalein
const CLOUD_NAME = "dxuurwexl"; 
const UPLOAD_PRESET = "edusphere_uploads"; 

export default function ManageBanners({ onLogout }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 1. Load Banners
  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      // Public route hai ya admin auth chahiye, depend karta hai aapne kaise banaya
      // Hum safe side ke liye token bhejte hain
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/banners`, {
         headers: { 'x-auth-token': token }
      });
      setBanners(res.data);
      setLoading(false);
    } catch (e) {
      console.error("Error fetching banners", e);
      setLoading(false);
    }
  };

  // 2. Upload Logic
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select an image file.");

    setUploading(true);
    try {
      // A. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const cloudData = await cloudRes.json();
      
      if (cloudData.error) throw new Error(cloudData.error.message);
      
      const imageUrl = cloudData.secure_url;

      // B. Save to Backend
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/banners/add`, { imageUrl, title }, {
        headers: { 'x-auth-token': token }
      });

      alert("Banner Published Successfully!");
      setTitle(''); 
      setFile(null);
      // Input file ko clear karne ke liye (Optional hack)
      document.getElementById('fileInput').value = ""; 
      
      fetchBanners(); // Refresh List

    } catch (err) {
      alert("Upload Failed: " + err.message);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // 3. Delete Banner
  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this banner?")) return;
    try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`${API_URL}/banners/${id}`, { headers: { 'x-auth-token': token } });
        fetchBanners();
    } catch(e) { alert("Error deleting banner"); }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
            <span className="nav-title">App Banners Manager</span>
            <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <Link to="/" className="back-link">&larr; Back to Dashboard</Link>

        <div className="content-card">
           <h2 className="card-title">Upload New Banner</h2>
           <p className="card-subtitle">This image will appear on the user's home screen slider.</p>
           
           {/* --- UPLOAD FORM --- */}
           <form onSubmit={handleUpload} style={{marginBottom: 30, background:'#f9fafb', padding:20, borderRadius:8, border:'1px solid #e5e7eb'}}>
              <div style={{marginBottom:15}}>
                  <label style={{fontWeight:'bold', display:'block', marginBottom:5, color:'#374151'}}>Banner Title (Optional)</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e)=>setTitle(e.target.value)} 
                    placeholder="Ex: Diwali Offer 50% Off" 
                    style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:6}} 
                  />
              </div>
              
              <div style={{marginBottom:20}}>
                  <label style={{fontWeight:'bold', display:'block', marginBottom:5, color:'#374151'}}>Select Image (Landscape Recommended)</label>
                  <input 
                    id="fileInput"
                    type="file" 
                    accept="image/*" 
                    onChange={(e)=>setFile(e.target.files[0])} 
                    style={{display:'block', marginTop:5}} 
                  />
                  <small style={{color:'#666'}}>Recommended Size: 1200x600 pixels</small>
              </div>
              
              <button 
                type="submit" 
                disabled={uploading} 
                className="add-btn"
                style={{width:'100%', padding:12, fontSize:16}}
              >
                  {uploading ? 'Uploading to Cloud...' : 'Upload & Publish Banner'}
              </button>
           </form>

           {/* --- ACTIVE BANNERS LIST --- */}
           <h3 style={{borderBottom:'2px solid #f3f4f6', paddingBottom:10, marginTop:40, color:'#1e3c72'}}>Active Banners</h3>
           
           {loading ? <p>Loading banners...</p> : banners.length === 0 ? <p style={{color:'#999', padding:20, textAlign:'center'}}>No banners active. Upload one above.</p> : (
               <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20, marginTop:20}}>
                   {banners.map(banner => (
                       <div key={banner._id} style={{border:'1px solid #ddd', borderRadius:12, overflow:'hidden', position:'relative', background:'#fff', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                           {/* Image Preview */}
                           <div style={{height:'160px', overflow:'hidden', backgroundColor:'#f3f4f6'}}>
                               <img src={banner.imageUrl} alt="Banner" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                           </div>
                           
                           {/* Details & Action */}
                           <div style={{padding:15}}>
                               <div style={{fontWeight:'bold', fontSize:16, marginBottom:5, color:'#1f2937'}}>{banner.title || "Untitled Banner"}</div>
                               <div style={{fontSize:12, color:'#6b7280', marginBottom:15}}>Posted: {new Date(banner.createdAt).toLocaleDateString()}</div>
                               
                               <button 
                                onClick={()=>handleDelete(banner._id)} 
                                style={{width:'100%', background:'#fee2e2', color:'#dc2626', border:'1px solid #fca5a5', padding:'8px', borderRadius:6, cursor:'pointer', fontWeight:'bold'}}
                               >
                                   Delete Banner
                               </button>
                           </div>
                       </div>
                   ))}
               </div>
           )}
        </div>
      </main>
    </div>
  );
}


