import React from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';
import './GovtJobDashboard.css';

const menuItems = [
  { name: 'Jobs', icon: 'briefcase', target: '/jobs/manage' }, 
  { name: 'Admit Card', icon: 'file-text', target: '/updates/manage' },
  { name: 'Result', icon: 'award', target: '/updates/manage' },
  { name: 'Answer Key', icon: 'key', target: '/updates/manage' },
  
  // --- YAHAN CHANGE KIYA HAI ---
  // Inhe temporarily null kar diya hai ya alag route de sakte hain
  { name: 'Admission', icon: 'user-plus', target: null }, 
  { name: 'Others', icon: 'more', target: null },
];

export default function GovtJobDashboard({ onLogout }) {
  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <span className="nav-title">Government Services</span>
          <button onClick={onLogout} className="logout-button">Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <Link to="/" className="back-link">&larr; Back to Main Dashboard</Link>

        <div className="content-card" style={{textAlign:'center', padding: '40px 20px'}}>
            <h2 className="page-title">Manage Government Services</h2>
            <p className="page-subtitle">Select a category to add or edit content.</p>

            <div className="job-grid-container">
              {menuItems.map((item) => (
                // Agar target null hai, to Link mat banao, sirf div banao jo alert de
                item.target ? (
                  <Link 
                    to={item.target} 
                    key={item.name} 
                    className="job-grid-card"
                    // State pass kar rahe hain taaki ManageUpdates ko pata chale kaunsa tab kholna hai
                    state={{ defaultTab: item.name }} 
                  >
                    <Icon name={item.icon} />
                    <h3>{item.name}</h3>
                    <p>Manage {item.name}</p>
                  </Link>
                ) : (
                  <div 
                    key={item.name} 
                    className="job-grid-card" 
                    style={{opacity: 0.6, cursor: 'not-allowed'}}
                    onClick={() => alert("This section will be available soon.")}
                  >
                    <Icon name={item.icon} />
                    <h3>{item.name}</h3>
                    <p>Coming Soon</p>
                  </div>
                )
              ))}
            </div>
        </div>
      </main>
    </div>
  );
}

// Icon component same rahega...
const Icon = ({ name }) => {
  // ... (Purana icon code yahan paste karein) ...
  const icons = {
    'briefcase': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
    'file-text': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
    'award': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>,
    'key': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>,
    'user-plus': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="17" y1="11" x2="23" y2="11"></line></svg>,
    'more': <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
  };
  return <div className="card-icon">{icons[name] || icons['more']}</div>;
};


