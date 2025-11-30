import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './AddJob.css';
import { API_BASE_URL } from '../config'; // Config se import

const API_URL = `${API_BASE_URL}/services`;
const ADMIN_API_URL = `${API_BASE_URL}/admin`;
const FORMS_API_URL = `${API_BASE_URL}/forms`; // 🔹 Form templates ke liye

export default function AddService({ onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 🔹 MASTER DOCS (same as before)
  const [masterDocs, setMasterDocs] = useState([]);
  const [docInput, setDocInput] = useState('');

  // 🔹 FORM TEMPLATES STATE
  const [templatesList, setTemplatesList] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Citizen Service',
    subCategory: '',
    officialFee: 0,
    serviceCharge: 50,
    instructions: 'Please upload clear documents.',
    requiredDocuments: [],
    requiredFields: []
  });

  // 🔹 INITIAL LOAD: master docs + templates
  React.useEffect(() => {
    const loadMaster = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${ADMIN_API_URL}/master-data/document`, {
          headers: { 'x-auth-token': token }
        });
        setMasterDocs(Array.isArray(res.data) ? res.data : []);
      } catch (e) {}
    };

    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${FORMS_API_URL}/list`, {
          headers: { 'x-auth-token': token }
        });
        setTemplatesList(Array.isArray(res.data) ? res.data : []);
      } catch (e) {}
    };

    loadMaster();
    fetchTemplates();
  }, []);

  // --- ✅ SUB-CATEGORIES LOGIC ---
  const getSubCategories = () => {
    if (formData.category === 'Citizen Service') {
      return ['Identity Proof', 'Certificates', 'Transport/Driving', 'Police/Legal', 'Others'];
    } else if (formData.category === 'Government Scheme') {
      return ['Farmers', 'Housing', 'Health', 'Students/Youth', 'Pension', 'Women', 'Others'];
    } else if (formData.category === 'Other') {
      return ['PF Service', 'Tax Service', 'Business Service', 'Insurance', 'Licenses', 'General'];
    } else {
      return ['General'];
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // 🔹 TEMPLATE CHANGE HANDLER
  const handleTemplateChange = (e) => {
    const id = e.target.value;
    setSelectedTemplateId(id);

    if (!id) return;

    const template = templatesList.find((t) => t._id === id);
    if (!template) return;

    // sections -> flat requiredFields
    const flatFields = [];
    (template.sections || []).forEach((sec) => {
      (sec.fields || []).forEach((f) => {
        flatFields.push({
          label: f.label || '',
          // dropdown/file ko bhi text bana diya (kyunki yahan sirf text/number/date hi allowed hain)
          type: ['text', 'number', 'date'].includes(f.type) ? f.type : 'text',
          required: f.isRequired ?? true
        });
      });
    });

    setFormData((prev) => ({
      ...prev,
      // Template se jo-fill karna hai:
      title: template.title || prev.title,
      officialFee: template.officialFee ?? prev.officialFee,
      serviceCharge: template.serviceCharge ?? prev.serviceCharge,
      requiredDocuments: template.requiredDocuments || [],
      requiredFields: flatFields
      // description, category, subCategory, instructions waise hi rahenge
    }));
  };

  const handleAddDocSmart = async () => {
    if (!docInput.trim()) return;
    if (formData.requiredDocuments.includes(docInput)) {
      setDocInput('');
      return;
    }
    setFormData({
      ...formData,
      requiredDocuments: [...formData.requiredDocuments, docInput]
    });
    setDocInput('');
  };

  const removeDoc = (i) => {
    const u = [...formData.requiredDocuments];
    u.splice(i, 1);
    setFormData({ ...formData, requiredDocuments: u });
  };

  const addField = () =>
    setFormData({
      ...formData,
      requiredFields: [
        ...formData.requiredFields,
        { label: '', type: 'text', required: true }
      ]
    });

  const updateField = (i, k, v) => {
    const u = [...formData.requiredFields];
    u[i][k] = v;
    setFormData({ ...formData, requiredFields: u });
  };

  const removeField = (i) => {
    const u = [...formData.requiredFields];
    u.splice(i, 1);
    setFormData({ ...formData, requiredFields: u });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API_URL}/add`, formData, {
        headers: { 'x-auth-token': token }
      });
      alert('Service Published!');
      navigate('/services/manage');
    } catch (err) {
      alert('Error adding service.');
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-content">
          <span className="nav-title">Add Service</span>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </nav>
      <main className="dashboard-main">
        <Link to="/" className="back-link">
          &larr; Dashboard
        </Link>
        <div className="content-card form-card">
          <h2 className="card-title">New Service Entry</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Basic Details</h3>

              {/* 🔹 TEMPLATE SELECT FIELD (jo pehle tha uska replacement) */}
              <div className="form-group">
                <label style={{ color: '#7c3aed', fontWeight: 'bold' }}>
                  Load From Form Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={handleTemplateChange}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 5,
                    border: '1px solid #ccc'
                  }}
                >
                  <option value="">-- Select Template --</option>
                  {templatesList.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title}
                    </option>
                  ))}
                </select>
                <small>
                  Template choose karne par <b>title, fees, documents</b> aur{' '}
                  <b>form fields</b> automatically aa jaayenge.
                </small>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Ex: PF Withdrawal"
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ color: '#2563eb', fontWeight: 'bold' }}>
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 5,
                      border: '1px solid #ccc'
                    }}
                  >
                    <option value="Citizen Service">Citizen Service</option>
                    <option value="Government Scheme">Government Scheme</option>
                    <option value="Other">Other Services</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ color: '#166534', fontWeight: 'bold' }}>
                    Sub Category
                  </label>
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 5,
                      border: '1px solid #ccc'
                    }}
                  >
                    <option value="">-- Select Folder --</option>
                    {getSubCategories().map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                />
              </div>
            </div>

            <div className="form-section" style={{ background: '#f0fdf4' }}>
              <h3>Fees Structure</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Official Fee (₹)</label>
                  <input
                    type="number"
                    name="officialFee"
                    value={formData.officialFee}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Service Charge (₹)</label>
                  <input
                    type="number"
                    name="serviceCharge"
                    value={formData.serviceCharge}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Documents</h3>
              <div className="slot-input-box">
                <input
                  list="master-docs"
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  placeholder="Add Document..."
                  style={{ flex: 1 }}
                />
                <datalist id="master-docs">
                  {masterDocs.map((d) => (
                    <option key={d._id} value={d.label} />
                  ))}
                </datalist>
                <button
                  type="button"
                  className="add-btn-small"
                  onClick={handleAddDocSmart}
                >
                  + Add
                </button>
              </div>
              <div className="slots-container">
                {formData.requiredDocuments.map((doc, i) => (
                  <div key={i} className="slot-tag">
                    {doc}
                    <span
                      onClick={() => removeDoc(i)}
                      className="remove-x"
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h3>Form Fields</h3>
              {formData.requiredFields.map((field, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 5,
                    marginBottom: 5
                  }}
                >
                  <input
                    placeholder="Label"
                    value={field.label}
                    onChange={(e) =>
                      updateField(i, 'label', e.target.value)
                    }
                    style={{ flex: 2, padding: 8 }}
                  />
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(i, 'type', e.target.value)
                    }
                    style={{ flex: 1, padding: 8 }}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeField(i)}
                    style={{ color: 'red' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addField}
                className="add-btn-small"
              >
                + Add Field
              </button>
            </div>

            <div className="form-group">
              <label>Instructions</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}