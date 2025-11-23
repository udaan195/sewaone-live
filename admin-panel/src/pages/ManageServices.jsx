import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './ManageJobs.css';

const API_URL = 'http://localhost:3000/api/services';

export default function ManageServices({ onLogout }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('Citizen Service');
  const [isLaunched, setIsLaunched] = useState(false);

  // Categories list (For filter dropdown on Admin side)
  const categories = ['Citizen Service', 'Government Scheme', 'Other']; 

  useEffect(() => {
    fetchServices();
  }, [currentCategory]);

  // Status check (Launches if any service exists, but should check the flag)
  const checkLaunchStatus = async (category) => {
      try {
          const statusRes = await axios.get(`${API_URL}/status/${encodeURIComponent(category)}`);
          setIsLaunched(statusRes.data.isReady);
      } catch(e) {
          setIsLaunched(false); // Default false if API fails
      }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
        const res = await axios.get(`${API_URL}/category/${encodeURIComponent(currentCategory)}`);
        setServices(res.data);
        await checkLaunchStatus(currentCategory); // Check status after fetching list
    } catch(e) {
        setServices([]); // Handle 404/error gracefully
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Delete this service?")) return;
      try {
        const token = localStorage.getItem('adminToken');
        await axios.delete(`${API_URL}/${id}`, { headers: { 'x-auth-token': token } });
        fetchServices();
      } catch(e) { alert("Error deleting service."); }
  };

  const handleLaunchToggle = async (isReady) => {
      try {
          const token = localStorage.getItem('adminToken');
          await axios.put(`${API_URL}/launch-status/${encodeURIComponent(currentCategory)}`, 
            { isReady }, 
            { headers: { 'x-auth-token': token } }
          );
          setIsLaunched(isReady);
          alert(`Module set to ${isReady ? 'LAUNCHED' : 'MAINTENANCE'}!`);
      } catch(e) {
          alert("Error updating launch status.");
      }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <span className="nav-title">Manage Services</span>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="header-actions">
            <Link to="/" className="back-link">&larr; Dashboard</Link>
            <Link to="/services/add" className="add-btn">+ Add Service</Link>
        </div>
        
        {/* Category & Launch Control */}
        <div className="content-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', marginBottom:20}}>
            <div style={{display:'flex', gap:10, alignItems:'center'}}>
                <h3 style={{margin:0}}>Category:</h3>
                 <select value={currentCategory} onChange={e=>setCurrentCategory(e.target.value)} style={{padding:8, borderRadius:6, border:'1px solid #ccc', fontWeight:'bold'}}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>

            {/* Launch Toggle */}
            <div style={{display:'flex', alignItems:'center', gap:10, padding:8, background: isLaunched ? '#dcfce7' : '#fef2f2', borderRadius:8}}>
                <span style={{fontWeight:'bold', color: isLaunched ? '#166534' : '#dc2626'}}>
                    Status: {isLaunched ? '✅ LAUNCHED' : '❌ MAINTENANCE'}
                </span>
                <button 
                  onClick={() => handleLaunchToggle(!isLaunched)}
                  className="add-btn"
                  style={{background: isLaunched ? '#dc2626' : '#16a34a'}}
                >
                    {isLaunched ? 'Set to Maintenance' : 'Launch Module'}
                </button>
            </div>
        </div>

        <div className="content-card">
            <h2 className="card-title">Services in "{currentCategory}" ({services.length})</h2>
            
            {loading ? <p>Loading...</p> : (
                <div className="table-responsive">
                    <table className="jobs-table">
                        <thead><tr><th>Title</th><th>Form</th><th>Fees</th><th>Launch Status</th><th>Action</th></tr></thead>
                        <tbody>
                            {services.map(s => (
                                <tr key={s._id}>
                                    <td style={{fontWeight:'bold'}}>{s.title}</td>
                                    <td>{s.linkedFormId ? 'Template Linked' : 'Manual/Basic'}</td>
                                    <td>₹{s.officialFee} + ₹{s.serviceCharge}</td>
                                    <td>{s.isReadyForLaunch ? 'Ready' : 'Not Ready'}</td>
                                    <td>
                                        <Link to={`/services/edit/${s._id}`} className="action-btn edit-btn">Edit</Link>
                                        <button onClick={()=>handleDelete(s._id)} className="action-btn delete-btn">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {services.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:20}}>No services found in this category.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

