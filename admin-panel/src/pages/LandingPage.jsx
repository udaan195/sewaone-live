import React from 'react';
import { Link } from 'react-router-dom'; // ✅ Import Link
import { Download, ShieldCheck, Zap, Users } from 'lucide-react';

export default function LandingPage() {
  // Yahan apna APK Link dalein (Google Drive / Expo Link)
  const APK_LINK = "https://expo.dev/accounts/udaan195/projects/sewaone/builds/40966da2-c850-461d-96c4-e1e5e5869b45"; 

  return (
    <div style={{fontFamily: 'sans-serif', color: '#333'}}>
      
      {/* Hero Section */}
      <div style={{background: 'linear-gradient(to right, #1e3c72, #2a5298)', padding: '80px 20px', textAlign: 'center', color: '#fff'}}>
        <h1 style={{fontSize: '3rem', marginBottom: '10px', fontWeight: '800'}}>SewaOne</h1>
        <p style={{fontSize: '1.2rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto'}}>Government Jobs, Citizen Services & Smart Form Filling - All in one App.</p>
        
        <div style={{marginTop: '40px'}}>
            <a href={APK_LINK} style={{background: '#fff', color: '#2563eb', padding: '15px 30px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'transform 0.2s'}}>
                <Download size={24} /> Download Android App
            </a>
            <p style={{marginTop: '15px', fontSize: '0.85rem', opacity: 0.8}}>v1.0.0 • Safe & Secure • Instant Download</p>
        </div>
      </div>

      {/* Features Grid */}
      <div style={{maxWidth: '1000px', margin: '60px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px'}}>
          <FeatureCard icon={<ShieldCheck size={40} color="#16a34a"/>} title="100% Secure" desc="Your data is encrypted and safe with us." />
          <FeatureCard icon={<Zap size={40} color="#ca8a04"/>} title="Super Fast" desc="Apply for jobs and services in minutes." />
          <FeatureCard icon={<Users size={40} color="#2563eb"/>} title="Expert Agents" desc="Verified agents fill your forms correctly." />
      </div>

      {/* Footer */}
      <div style={{textAlign: 'center', padding: '40px', background: '#f8fafc', color: '#64748b', marginTop: '50px', borderTop: '1px solid #e2e8f0'}}>
          <p style={{marginBottom: '10px'}}>&copy; 2025 SewaOne Services. All rights reserved.</p>
          
          {/* ✅ FIXED LINK: Ab ye click karne par Login page kholega */}
          <Link to="/login" style={{color: '#2563eb', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem'}}>
              Admin / Agent Login &rarr;
          </Link>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div style={{textAlign: 'center', padding: '30px 20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)'}}>
            <div style={{marginBottom: '15px'}}>{icon}</div>
            <h3 style={{margin: '0 0 10px', color: '#1e293b'}}>{title}</h3>
            <p style={{color: '#64748b', margin: 0, lineHeight: '1.5'}}>{desc}</p>
        </div>
    );
}


