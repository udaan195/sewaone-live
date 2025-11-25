import React from 'react';
import { Download, ShieldCheck, Zap, Users } from 'lucide-react';

export default function LandingPage() {
  // Yahan apna APK ka Direct Link dalein (Google Drive / GitHub Release)
  const APK_LINK = "YOUR_GOOGLE_DRIVE_DIRECT_LINK_HERE";

  return (
    <div style={{fontFamily: 'sans-serif', color: '#333'}}>
      
      {/* Hero Section */}
      <div style={{background: 'linear-gradient(to right, #1e3c72, #2a5298)', padding: '60px 20px', textAlign: 'center', color: '#fff'}}>
        <h1 style={{fontSize: '3rem', marginBottom: '10px'}}>SewaOne</h1>
        <p style={{fontSize: '1.2rem', opacity: 0.9}}>Government Jobs & Citizen Services at your fingertips.</p>
        
        <div style={{marginTop: '30px'}}>
            <a href={APK_LINK} style={{background: '#fff', color: '#2563eb', padding: '15px 30px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'}}>
                <Download size={24} /> Download App
            </a>
            <p style={{marginTop: '10px', fontSize: '0.8rem', opacity: 0.8}}>v1.0.0 • Safe & Secure</p>
        </div>
      </div>

      {/* Features */}
      <div style={{maxWidth: '1000px', margin: '50px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px'}}>
          <FeatureCard icon={<ShieldCheck size={40} color="#16a34a"/>} title="100% Secure" desc="Your data is safe with bank-grade security." />
          <FeatureCard icon={<Zap size={40} color="#ca8a04"/>} title="Super Fast" desc="Apply for jobs and services in minutes." />
          <FeatureCard icon={<Users size={40} color="#2563eb"/>} title="Expert Agents" desc="Our experts fill forms for you correctly." />
      </div>

      {/* Footer */}
      <div style={{textAlign: 'center', padding: '40px', background: '#f8fafc', color: '#64748b', marginTop: '50px'}}>
          <p>&copy; 2025 SewaOne Services. All rights reserved.</p>
          <a href="/login" style={{color: '#2563eb', textDecoration: 'none'}}>Admin Login</a>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div style={{textAlign: 'center', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '10px'}}>
            <div style={{marginBottom: '15px'}}>{icon}</div>
            <h3 style={{margin: '0 0 10px'}}>{title}</h3>
            <p style={{color: '#666', margin: 0}}>{desc}</p>
        </div>
    );
}

