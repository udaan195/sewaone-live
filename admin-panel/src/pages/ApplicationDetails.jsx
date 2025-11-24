import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './AgentDashboard.css';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}`;
const CLOUD_NAME = 'dxuurwexl';
const UPLOAD_PRESET = 'edusphere_uploads';

// Quick Replies for Chat
const QUICK_REPLIES = [
  'Please send the OTP received on your mobile.',
  'Your uploaded photo is blurry. Please upload a clear one.',
  'Please make the payment to proceed.',
  'Verification complete. Filling your form now.',
  'Application submitted successfully.',
];

export default function ApplicationDetails({ onLogout }) {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  // Completion
  const [completeMode, setCompleteMode] = useState('link'); // 'link' | 'upload'
  const [manualLink, setManualLink] = useState(''); // text link
  const [uploadedFileUrl, setUploadedFileUrl] = useState(''); // Cloudinary URL
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [status, setStatus] = useState('');

  // Private Notes
  const [agentNotes, setAgentNotes] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Payment Request State
  const [officialFeeInput, setOfficialFeeInput] = useState(0);
  const [serviceFeeInput, setServiceFeeInput] = useState(50);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    fetchDetail();
    const chatInterval = setInterval(fetchMessages, 3000);
    return () => clearInterval(chatInterval);
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Smart Fee Calculator Helper
  const calculateSmartFee = (application, job) => {
    if (application.paymentDetails && application.paymentDetails.officialFee > 0) {
      return application.paymentDetails.officialFee;
    }
    if (!job.feeStructure || job.feeStructure.length === 0) return 0;

    const formData = application.applicationData || {};
    const catKey =
      Object.keys(formData).find((k) =>
        k.toLowerCase().includes('category')
      ) || 'Category';
    const genKey =
      Object.keys(formData).find((k) =>
        k.toLowerCase().includes('gender')
      ) || 'Gender';

    const userCategory = formData[catKey];
    const userGender = formData[genKey];

    if (!userCategory) return 0;

    let rule = job.feeStructure.find(
      (r) => r.category === userCategory && r.gender === userGender
    );
    if (!rule)
      rule = job.feeStructure.find(
        (r) => r.category === userCategory && r.gender === 'Any'
      );
    if (!rule)
      rule = job.feeStructure.find(
        (r) => r.category === 'Any' && r.gender === userGender
      );
    if (!rule)
      rule = job.feeStructure.find(
        (r) => r.category === 'Any' && r.gender === 'Any'
      );

    return rule ? parseInt(rule.amount) : 0;
  };

  const fetchDetail = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/applications/detail/${id}`, {
        headers: { 'x-auth-token': token },
      });
      const data = res.data;

      setApp(data);
      setStatus(data.status);
      setAgentNotes(data.agentNotes || '');

      // Fee Logic
      let offFee = data.paymentDetails?.officialFee || 0;
      let srvFee = data.paymentDetails?.serviceFee || 50;

      if (offFee === 0 && data.jobId) {
        offFee = calculateSmartFee(data, data.jobId);
      }

      setOfficialFeeInput(offFee);
      setServiceFeeInput(srvFee);

      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/chat/${id}`);
      setMessages(res.data);
    } catch (e) {
      // ignore
    }
  };

  // --- 2. ACTION HANDLERS ---

  const handleSendChat = async (msgText = newMessage) => {
    if (typeof msgText !== 'string') msgText = newMessage;
    if (!msgText.trim()) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API_URL}/chat/agent/send`,
        { applicationId: id, message: msgText },
        {
          headers: { 'x-auth-token': token },
        }
      );
      setNewMessage('');
      fetchMessages();
    } catch (e) {
      alert('Message failed');
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API_URL}/applications/update-status/${id}`,
        { agentNotes },
        { headers: { 'x-auth-token': token } }
      );
    } catch (e) {
      alert('Error saving note');
    } finally {
      setSavingNote(false);
    }
  };

  const getDownloadLink = (url) => {
    if (!url) return '#';
    return url.replace('/upload/', '/upload/fl_attachment/');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPdf(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const cloudData = await cloudRes.json();

      if (cloudData.secure_url) {
        setUploadedFileUrl(cloudData.secure_url);
        alert('PDF Uploaded Successfully! Now click Complete.');
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleComplete = async () => {
    if (!app.paymentDetails?.isPaid) {
      return alert('Cannot complete! Payment is pending.');
    }

    let finalPdfLink = '';

    if (completeMode === 'link') {
      if (!manualLink.trim()) {
        return alert('Please enter the PDF Link.');
      }
      finalPdfLink = manualLink.trim();
    } else {
      if (!uploadedFileUrl) {
        return alert('Please upload a PDF file first.');
      }
      finalPdfLink = uploadedFileUrl;
    }

    if (!window.confirm('Are you sure you want to COMPLETE this order?'))
      return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API_URL}/applications/complete`,
        { applicationId: id, pdfUrl: finalPdfLink },
        { headers: { 'x-auth-token': token } }
      );
      alert('✅ Order Completed!');
      fetchDetail();
    } catch (e) {
      alert('Error completing order');
    }
  };

  const handleStatusUpdate = async (newStat) => {
    let reason = '';
    if (newStat === 'Rejected') {
      reason = prompt(
        'Enter rejection reason:',
        'Document mismatch / Not eligible'
      );
      if (reason === null) return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API_URL}/applications/update-status/${id}`,
        { status: newStat, rejectionReason: reason },
        { headers: { 'x-auth-token': token } }
      );
      setStatus(newStat);
      fetchDetail();
    } catch (e) {
      alert('Update failed');
    }
  };

  const handleVerifyPayment = async (decision) => {
    let reason = '';
    if (decision === 'reject') {
      reason = prompt(
        'Why verify failed?',
        'UTR Incorrect / Amount Mismatch'
      );
      if (reason === null) return;
    } else {
      if (!window.confirm('Confirm Payment Approval?')) return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API_URL}/applications/verify-payment/${id}`,
        { decision, rejectionReason: reason },
        { headers: { 'x-auth-token': token } }
      );
      alert(`Payment ${decision}ed!`);
      fetchDetail();
    } catch (e) {
      alert('Error');
    }
  };

  const handleRequestPayment = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API_URL}/applications/request-payment/${id}`,
        { officialFee: officialFeeInput, serviceFee: serviceFeeInput },
        { headers: { 'x-auth-token': token } }
      );
      alert('Payment Request Sent!');
      fetchDetail();
    } catch (e) {
      alert('Error');
    }
  };

  const renderAppData = () => {
    if (!app.applicationData || Object.keys(app.applicationData).length === 0)
      return (
        <p style={{ color: '#999', fontStyle: 'italic' }}>
          No form data filled by user.
        </p>
      );
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          background: '#f8fafc',
          padding: 10,
          borderRadius: 8,
          border: '1px solid #e2e8f0',
        }}
      >
        {Object.entries(app.applicationData).map(([key, value], index) => (
          <div key={index}>
            <span
              style={{
                fontSize: '11px',
                color: '#64748b',
                textTransform: 'uppercase',
                fontWeight: 'bold',
              }}
            >
              {key}
            </span>
            <div
              style={{
                fontSize: '14px',
                color: '#334155',
                fontWeight: '500',
              }}
            >
              {value.toString()}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading)
    return (
      <div className="agent-container">
        <p style={{ padding: 20 }}>Loading...</p>
      </div>
    );

  const isChatActive = app.status !== 'Completed' && app.status !== 'Rejected';
  const isOrderLocked = app.status === 'Completed';

  return (
    <div
      className="agent-container"
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <nav className="agent-nav">
        <div className="agent-brand">
          <span>
            📂 Track ID: <strong>{app.trackingId}</strong>
          </span>
        </div>
        <Link
          to="/"
          className="logout-button"
          style={{ textDecoration: 'none', padding: '5px 15px' }}
        >
          Close
        </Link>
      </nav>

      <main
        className="dashboard-main"
        style={{
          display: 'flex',
          gap: '20px',
          flex: 1,
          overflow: 'hidden',
          padding: '20px',
        }}
      >
        {/* LEFT COLUMN */}
        <div
          style={{
            flex: 2,
            minWidth: '400px',
            overflowY: 'auto',
            paddingRight: '10px',
          }}
        >
          {/* Rejection Alert */}
          {app.status === 'Rejected' && (
            <div
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                padding: 15,
                borderRadius: 8,
                marginBottom: 15,
                border: '1px solid #fca5a5',
              }}
            >
              <strong>❌ Application Rejected:</strong>{' '}
              {app.rejectionReason || 'No reason provided.'}
            </div>
          )}

          {/* Private Note */}
          <div
            className="task-card"
            style={{ display: 'block', background: '#fffbeb', borderColor: '#fcd34d' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 5,
              }}
            >
              <h4 style={{ margin: 0, color: '#b45309' }}>
                📒 Private Note (Staff Only)
              </h4>
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  cursor: 'pointer',
                }}
              >
                {savingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
            <textarea
              value={agentNotes}
              onChange={(e) => setAgentNotes(e.target.value)}
              placeholder="Write internal notes here..."
              style={{
                width: '100%',
                border: '1px solid #fed7aa',
                borderRadius: 4,
                padding: 5,
                fontSize: 12,
                minHeight: 40,
              }}
            />
          </div>

          {/* Customer Info */}
          <div className="task-card" style={{ display: 'block' }}>
            <h3
              style={{
                color: '#1e3c72',
                marginBottom: 15,
                borderBottom: '1px solid #eee',
                paddingBottom: 10,
              }}
            >
              📋 Customer Info
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <div>
                <p style={{ margin: '5px 0', color: '#666' }}>Name</p>
                <strong>
                  {app.userId?.firstName} {app.userId?.lastName}
                </strong>
              </div>
              <div>
                <p style={{ margin: '5px 0', color: '#666' }}>Mobile</p>
                <strong>
                  <a href={`tel:${app.userId?.mobile}`}>
                    {app.userId?.mobile}
                  </a>
                </strong>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <p style={{ margin: '5px 0', color: '#666' }}>Applying For</p>
                <strong style={{ color: '#dc2626' }}>
                  {app.jobId?.title}
                </strong>
              </div>
              {app.selectedSlot && (
                <div
                  style={{
                    gridColumn: '1/-1',
                    background: '#fff7ed',
                    padding: 5,
                    borderRadius: 4,
                    border: '1px solid #fed7aa',
                  }}
                >
                  🕒 Slot:{' '}
                  <strong>
                    {app.selectedSlot.date} @ {app.selectedSlot.time}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Form Data */}
          <div className="task-card" style={{ display: 'block' }}>
            <h3
              style={{
                color: '#1e3c72',
                marginBottom: 15,
                borderBottom: '1px solid #eee',
                paddingBottom: 10,
              }}
            >
              📝 Form Data
            </h3>
            {renderAppData()}
          </div>

          {/* Fees & Payment */}
          <div
            className="task-card"
            style={{
              display: 'block',
              background: '#f0fdf4',
              borderColor: '#bbf7d0',
            }}
          >
            <h3
              style={{
                color: '#166534',
                marginBottom: 15,
                borderBottom: '1px solid #bbf7d0',
                paddingBottom: 10,
              }}
            >
              💰 Fees & Payment
            </h3>

            {app.paymentDetails?.isPaid ? (
              <div style={{ textAlign: 'center', color: 'green' }}>
                <h2>✅ PAID & VERIFIED</h2>
                <p>Total: ₹{app.paymentDetails.totalAmount}</p>
                <small>UTR: {app.paymentDetails.transactionId}</small>
              </div>
            ) : app.status === 'Payment Verification Pending' ? (
              <div
                style={{
                  background: '#fff',
                  padding: 15,
                  borderRadius: 8,
                  border: '2px solid #f97316',
                }}
              >
                <h4 style={{ margin: '0 0 10px', color: '#c2410c' }}>
                  ⚠️ Verify Payment
                </h4>
                <p>
                  <strong>UTR:</strong> {app.paymentDetails.transactionId}
                </p>
                <p>
                  <strong>Amount:</strong> ₹{app.paymentDetails.totalAmount}
                </p>

                {app.paymentDetails.paymentScreenshot && (
                  <div style={{ margin: '10px 0' }}>
                    <a
                      href={app.paymentDetails.paymentScreenshot}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'blue',
                        textDecoration: 'underline',
                      }}
                    >
                      View Screenshot
                    </a>
                  </div>
                )}

                <div
                  style={{ display: 'flex', gap: 10, marginTop: 15 }}
                >
                  <button
                    onClick={() => handleVerifyPayment('approve')}
                    style={{
                      flex: 1,
                      padding: 10,
                      background: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 5,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleVerifyPayment('reject')}
                    style={{
                      flex: 1,
                      padding: 10,
                      background: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 5,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ) : isOrderLocked ? (
              <div style={{ textAlign: 'center', color: '#666' }}>
                Order Locked. Payment settled.
              </div>
            ) : (
              <div>
                {app.paymentRejectionReason && (
                  <div
                    style={{
                      background: '#fee2e2',
                      color: '#b91c1c',
                      padding: 10,
                      borderRadius: 5,
                      marginBottom: 10,
                      fontSize: 12,
                    }}
                  >
                    <strong>Last Payment Rejected:</strong>{' '}
                    {app.paymentRejectionReason}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      Official Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={officialFeeInput}
                      onChange={(e) =>
                        setOfficialFeeInput(e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: 8,
                        borderRadius: 4,
                        border: '1px solid #ccc',
                        fontWeight: 'bold',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      Service Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={serviceFeeInput}
                      onChange={(e) =>
                        setServiceFeeInput(e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: 8,
                        borderRadius: 4,
                        border: '1px solid #ccc',
                        fontWeight: 'bold',
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleRequestPayment}
                  style={{
                    width: '100%',
                    background: '#f97316',
                    color: '#fff',
                    border: 'none',
                    padding: 10,
                    borderRadius: 6,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Send Payment Request (₹{' '}
                  {parseInt(officialFeeInput || 0) +
                    parseInt(serviceFeeInput || 0)}
                  )
                </button>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="task-card" style={{ display: 'block' }}>
            <h3
              style={{
                color: '#1e3c72',
                marginBottom: 15,
                borderBottom: '1px solid #eee',
                paddingBottom: 10,
              }}
            >
              📎 Documents
            </h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {app.uploadedDocuments.map((doc, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: 8,
                    overflow: 'hidden',
                    width: '120px',
                    background: '#fff',
                  }}
                >
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'block',
                      height: '80px',
                      background: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      fontSize: '24px',
                    }}
                  >
                    📄
                  </a>
                  <div style={{ padding: 5, textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        marginBottom: 4,
                      }}
                    >
                      {doc.docName}
                    </div>
                    <a
                      href={getDownloadLink(doc.url)}
                      download
                      className="action-btn-main"
                      style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        display: 'inline-block',
                      }}
                    >
                      ⬇ Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final Actions */}
          <div
            className="task-card"
            style={{
              display: 'block',
              opacity: isOrderLocked ? 0.8 : 1,
            }}
          >
            <h3 style={{ color: '#1e3c72', marginBottom: 15 }}>
              ⚙️ Final Actions
            </h3>

            {isOrderLocked ? (
              <div style={{ textAlign: 'center', color: '#166534' }}>
                <h2>✅ Order Completed</h2>
                <a
                  href={app.finalResult?.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#2563eb' }}
                >
                  View Sent PDF
                </a>
              </div>
            ) : (
              <>
                <div
                  style={{ marginBottom: 20, display: 'flex', gap: 5 }}
                >
                  <button
                    onClick={() => handleStatusUpdate('Processing')}
                    style={{
                      padding: '8px',
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 5,
                      flex: 1,
                      cursor: 'pointer',
                    }}
                  >
                    Processing
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('Action Required')}
                    style={{
                      padding: '8px',
                      background: '#f59e0b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 5,
                      flex: 1,
                      cursor: 'pointer',
                    }}
                  >
                    Need Info
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('Rejected')}
                    style={{
                      padding: '8px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 5,
                      flex: 1,
                      cursor: 'pointer',
                    }}
                  >
                    Reject
                  </button>
                </div>

                {app.paymentDetails?.isPaid ? (
                  <div
                    style={{
                      paddingTop: 20,
                      borderTop: '2px dashed #ccc',
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontWeight: 'bold',
                        marginBottom: 10,
                        color: '#15803d',
                      }}
                    >
                      Complete Order & Send Result
                    </label>

                    {/* Mode Toggle */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 15,
                        marginBottom: 15,
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="mode"
                          checked={completeMode === 'link'}
                          onChange={() => setCompleteMode('link')}
                        />
                        Enter Link
                      </label>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="mode"
                          checked={completeMode === 'upload'}
                          onChange={() => setCompleteMode('upload')}
                        />
                        Upload File
                      </label>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                      }}
                    >
                      {completeMode === 'link' ? (
                        <input
                          type="text"
                          placeholder="Paste Drive/PDF Link here..."
                          value={manualLink}
                          onChange={(e) =>
                            setManualLink(e.target.value)
                          }
                          style={{
                            flex: 1,
                            padding: 10,
                            border: '1px solid #ccc',
                            borderRadius: 5,
                          }}
                        />
                      ) : (
                        <div style={{ flex: 1 }}>
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={handleFileUpload}
                          />
                          {uploadedFileUrl && (
                            <span
                              style={{
                                fontSize: 11,
                                color: 'green',
                                display: 'block',
                                marginTop: 5,
                              }}
                            >
                              ✅ Uploaded
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleComplete}
                        disabled={uploadingPdf}
                        style={{
                          padding: '10px 20px',
                          background: '#15803d',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 5,
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        {uploadingPdf ? 'Wait...' : 'Complete'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 10,
                      background: '#fee2e2',
                      color: '#dc2626',
                      borderRadius: 5,
                      border: '1px solid #fca5a5',
                    }}
                  >
                    🔒 <strong>Locked:</strong> Complete payment
                    verification first.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CHAT */}
        <div
          style={{
            flex: 1,
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            background: '#fff',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: 15,
              background: '#1e3c72',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <h4 style={{ margin: 0 }}>💬 Chat</h4>
            <span
              style={{
                fontSize: '0.8rem',
                background: isChatActive ? '#22c55e' : '#ef4444',
                padding: '2px 8px',
                borderRadius: 10,
              }}
            >
              {isChatActive ? 'Live' : 'Closed'}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              background: '#f1f5f9',
              padding: 15,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf:
                    msg.sender === 'Agent'
                      ? 'flex-end'
                      : 'flex-start',
                  background:
                    msg.sender === 'Agent' ? '#dcfce7' : '#fff',
                  padding: '8px 12px',
                  borderRadius: 8,
                  maxWidth: '85%',
                }}
              >
                <span style={{ fontSize: 10, color: '#666' }}>
                  {msg.sender}
                </span>
                <br />
                {msg.message}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Replies */}
          {isChatActive && (
            <div
              style={{
                padding: '5px 10px',
                background: '#fff',
                borderTop: '1px solid #eee',
                display: 'flex',
                gap: 5,
                overflowX: 'auto',
              }}
            >
              {QUICK_REPLIES.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleSendChat(reply)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 15,
                    border: '1px solid #ddd',
                    background: '#f9fafb',
                    fontSize: 11,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {reply.substring(0, 20)}...
                </button>
              ))}
            </div>
          )}

          {/* Chat Input */}
          {isChatActive && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              style={{
                padding: 10,
                background: '#fff',
                display: 'flex',
                gap: 10,
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type..."
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: 20,
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#1e3c72',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  cursor: 'pointer',
                }}
              >
                ➤
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}