import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Token decode karne ke liye

// Apni Custom CSS import karein
import './AdminLogin.css';

// Backend API URL
const API_URL = 'http://localhost:3000/api/admin';

export default function AdminLogin({ onLoginSuccess }) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. API Call
      const response = await axios.post(`${API_URL}/login`, {
        mobile,
        password,
      });

      const { token } = response.data;
      
      // 2. Token Decode karein
      const decodedToken = jwtDecode(token);

      // 3. Check karein ki ye Admin/Agent hai ya nahi
      if (decodedToken.admin && decodedToken.admin.role) {
        // Token save karein
        localStorage.setItem('adminToken', token);
        
        // 4. IMPORTANT: App.jsx ko ROLE bhejein
        // Taaki wo sahi Dashboard (SuperAdmin vs Agent) dikha sake
        onLoginSuccess(decodedToken.admin.role);
      } else {
        setError('Access denied. You are not an admin/agent.');
      }

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.msg || 'Login failed. Server error.'
      );
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">
          SewaOne Panel
        </h1>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mobile">Mobile Number</label>
            <input
              id="mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter registered mobile"
              required
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}


