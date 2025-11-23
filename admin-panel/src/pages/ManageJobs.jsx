import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Link import zaroori hai
import axios from 'axios';
import './AdminDashboard.css';
import './ManageJobs.css';

const API_URL = 'http://localhost:3000/api/jobs';

export default function ManageJobs({ onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/all`);
      setJobs(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching jobs", err);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Kya aap sach mein is job ko delete karna chahte hain?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setJobs(jobs.filter(job => job._id !== id));
      } catch (err) {
        alert("Delete failed. Server error.");
      }
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <span className="nav-title">Manage Jobs</span>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="header-actions">
          <Link to="/government-jobs" className="back-link">&larr; Back to Menu</Link>
          <Link to="/jobs/add" className="add-btn">+ Add New Job</Link>
        </div>

        <div className="content-card">
          <h2 className="card-title">All Posted Jobs</h2>
          
          {loading ? (
            <p className="loading-text">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <p>Abhi koi job post nahi ki gayi hai.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Organization</th>
                    <th>Posted Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job._id}>
                      <td>{job.title}</td>
                      <td>{job.organization}</td>
                      <td>{new Date(job.postedAt).toLocaleDateString()}</td>
                      <td>
                        {/* --- (UPDATE) EDIT BUTTON AB LINK HAI --- */}
                        <Link 
                          to={`/jobs/edit/${job._id}`} // Job ID link mein jayegi
                          className="action-btn edit-btn"
                          style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
                        >
                          Edit
                        </Link>
                        {/* --------------------------------------- */}
                        
                        <button 
                          className="action-btn delete-btn" 
                          onClick={() => handleDelete(job._id)}
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


