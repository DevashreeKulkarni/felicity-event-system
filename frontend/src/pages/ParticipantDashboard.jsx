import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import ParticipantNavbar from '../components/ParticipantNavbar';
import api from '../utils/api';

const ParticipantDashboard = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [feedbackState, setFeedbackState] = useState({}); // { [regId]: { rating, comment, submitted } }
  const [uploadState, setUploadState] = useState({}); // { [regId]: { uploading, done } }
  const navigate = useNavigate();

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await api.get('/registrations/my-registrations');
      setRegistrations(response.data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = registrations.filter(reg =>
    reg.status === 'Registered' && new Date(reg.eventId.eventStartDate) > new Date()
  );

  const completedEvents = registrations.filter(reg =>
    reg.status === 'Completed' || new Date(reg.eventId.eventStartDate) < new Date()
  );

  const cancelledEvents = registrations.filter(reg =>
    reg.status === 'Cancelled'
  );

  const normalEvents = registrations.filter(reg =>
    reg.eventId.eventType === 'Normal'
  );

  const merchandiseEvents = registrations.filter(reg =>
    reg.eventId.eventType === 'Merchandise'
  );

  const handleFeedbackSubmit = async (eventId, regId) => {
    const fb = feedbackState[regId] || {};
    if (!fb.rating) return alert('Please select a rating.');
    try {
      await api.post(`/events/${eventId}/feedback`, { rating: fb.rating, comment: fb.comment || '' });
      setFeedbackState(prev => ({ ...prev, [regId]: { ...prev[regId], submitted: true } }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const handlePaymentProofUpload = async (regId, file) => {
    if (!file) return;
    setUploadState(prev => ({ ...prev, [regId]: { uploading: true } }));
    try {
      const formData = new FormData();
      formData.append('paymentProof', file);
      await api.post(`/registrations/${regId}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadState(prev => ({ ...prev, [regId]: { uploading: false, done: true } }));
      fetchRegistrations();
    } catch (err) {
      setUploadState(prev => ({ ...prev, [regId]: { uploading: false, error: err.response?.data?.message || 'Upload failed' } }));
    }
  };

  const renderEventCard = (reg) => {
    const isCompleted = reg.eventId?.status === 'Completed';
    const fb = feedbackState[reg._id] || {};
    return (
      <div key={reg._id} style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '15px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.3s'
      }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <h3
              onClick={() => navigate(`/events/${reg.eventId._id}`)}
              style={{
                margin: '0 0 10px 0',
                color: '#6B46C1',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              {reg.eventId.eventName}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px', color: '#666' }}>
              <div><strong>Type:</strong> {reg.eventId.eventType}</div>
              <div><strong>Date:</strong> {new Date(reg.eventId.eventStartDate).toLocaleDateString()}</div>
              <div><strong>Payment:</strong> {reg.paymentStatus}</div>
              <div>
                <strong>Ticket ID:</strong> <code style={{ backgroundColor: '#f4f4f4', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>{reg.ticketId}</code>
              </div>
            </div>
            <span style={{
              display: 'inline-block',
              marginTop: '10px',
              padding: '5px 15px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: reg.status === 'Registered' ? '#e7f5e7' : reg.status === 'Cancelled' ? '#fde7e7' : '#f0f0f0',
              color: reg.status === 'Registered' ? '#2d7a2d' : reg.status === 'Cancelled' ? '#c73636' : '#666'
            }}>
              {reg.status}
            </span>

            {/* Feedback section for completed events */}
            {isCompleted && (
              <div style={{ marginTop: '16px', padding: '14px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                {fb.submitted ? (
                  <p style={{ margin: 0, color: '#16a34a', fontWeight: 600 }}>✅ Feedback submitted anonymously. Thank you!</p>
                ) : (
                  <>
                    <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#374151', fontSize: '14px' }}>📝 Leave anonymous feedback:</p>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setFeedbackState(prev => ({ ...prev, [reg._id]: { ...prev[reg._id], rating: star } }))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: (fb.rating || 0) >= star ? '#f59e0b' : '#d1d5db' }}>
                          ★
                        </button>
                      ))}
                      {fb.rating && <span style={{ lineHeight: '28px', marginLeft: '4px', fontSize: '13px', color: '#6b7280' }}>{fb.rating}/5</span>}
                    </div>
                    <textarea
                      placeholder="Share your experience (optional)"
                      value={fb.comment || ''}
                      onChange={e => setFeedbackState(prev => ({ ...prev, [reg._id]: { ...prev[reg._id], comment: e.target.value } }))}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', resize: 'vertical', minHeight: '60px', boxSizing: 'border-box' }}
                    />
                    <button onClick={() => handleFeedbackSubmit(reg.eventId._id, reg._id)}
                      style={{ marginTop: '8px', padding: '8px 20px', backgroundColor: '#6B46C1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                      Submit Feedback
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            {reg.eventId.eventType === 'Merchandise' ? (
              // For merchandise: show upload proof OR payment status
              <div style={{ minWidth: '120px' }}>
                {reg.paymentStatus === 'Free' || reg.paymentStatus === 'Pending' ? (
                  <div style={{ padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: '#92400E' }}>💳 Upload Payment Proof</p>
                    <label style={{
                      display: 'block', padding: '6px 12px', backgroundColor: '#6B46C1', color: 'white',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600
                    }}>
                      {uploadState[reg._id]?.uploading ? 'Uploading...' : 'Choose File'}
                      <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                        onChange={e => handlePaymentProofUpload(reg._id, e.target.files[0])}
                        disabled={uploadState[reg._id]?.uploading}
                      />
                    </label>
                    {uploadState[reg._id]?.error && <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#DC2626' }}>{uploadState[reg._id].error}</p>}
                  </div>
                ) : reg.paymentStatus === 'PendingVerification' ? (
                  <div style={{ padding: '12px', backgroundColor: '#DBEAFE', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#1E40AF' }}>⏳ Awaiting organizer verification</p>
                  </div>
                ) : reg.paymentStatus === 'Rejected' ? (
                  <div style={{ padding: '12px', backgroundColor: '#FEE2E2', borderRadius: '8px', border: '1px solid #FECACA' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 600, color: '#991B1B' }}>❌ Payment rejected</p>
                    <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#7F1D1D' }}>Please re-upload a valid proof</p>
                    <label style={{
                      display: 'block', padding: '6px 12px', backgroundColor: '#6B46C1', color: 'white',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600
                    }}>
                      Re-upload
                      <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                        onChange={e => handlePaymentProofUpload(reg._id, e.target.files[0])}
                      />
                    </label>
                  </div>
                ) : reg.paymentStatus === 'Paid' ? (
                  // Only show QR after payment approved
                  <>
                    <QRCodeSVG value={reg.ticketId} size={100} />
                    <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#888' }}>Scan for entry</p>
                  </>
                ) : null}
              </div>
            ) : (
              // Normal event: always show QR
              <>
                <QRCodeSVG value={reg.ticketId} size={100} />
                <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#888' }}>Scan for entry</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <ParticipantNavbar />
      <div style={{ padding: '30px 50px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: '#1F2937', fontSize: '28px', fontWeight: '600' }}>My Events Dashboard</h2>
          <button
            onClick={() => navigate('/events')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6B46C1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#553C9A'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#6B46C1'}
          >
            + Browse Events
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
            <p>Loading your events...</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{
              marginBottom: '20px',
              display: 'flex',
              gap: '0',
              borderBottom: '2px solid #e0e0e0',
              overflowX: 'auto'
            }}>
              <button
                onClick={() => setActiveTab('upcoming')}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: activeTab === 'upcoming' ? '#6B46C1' : '#6B7280',
                  border: 'none',
                  borderBottom: activeTab === 'upcoming' ? '3px solid #6B46C1' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'upcoming' ? '600' : '400',
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap'
                }}
              >
                Upcoming ({upcomingEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('normal')}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: activeTab === 'normal' ? '#6B46C1' : '#6B7280',
                  border: 'none',
                  borderBottom: activeTab === 'normal' ? '3px solid #6B46C1' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'normal' ? '600' : '400',
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap'
                }}
              >
                Normal ({normalEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('merchandise')}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: activeTab === 'merchandise' ? '#6B46C1' : '#6B7280',
                  border: 'none',
                  borderBottom: activeTab === 'merchandise' ? '3px solid #6B46C1' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'merchandise' ? '600' : '400',
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap'
                }}
              >
                Merchandise ({merchandiseEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: activeTab === 'completed' ? '#6B46C1' : '#6B7280',
                  border: 'none',
                  borderBottom: activeTab === 'completed' ? '3px solid #6B46C1' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'completed' ? '600' : '400',
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap'
                }}
              >
                Completed ({completedEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('cancelled')}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: activeTab === 'cancelled' ? '#6B46C1' : '#6B7280',
                  border: 'none',
                  borderBottom: activeTab === 'cancelled' ? '3px solid #6B46C1' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'cancelled' ? '600' : '400',
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap'
                }}
              >
                Cancelled ({cancelledEvents.length})
              </button>
            </div>

            <div style={{ marginTop: '20px' }}>
              {activeTab === 'upcoming' && (
                upcomingEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>No upcoming events. <a href="/events" style={{ color: '#007bff', textDecoration: 'none' }}>Browse events</a> to register!</p>
                  </div>
                ) : (
                  upcomingEvents.map(renderEventCard)
                )
              )}
              {activeTab === 'normal' && (
                normalEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>No normal events registered.</p>
                  </div>
                ) : (
                  normalEvents.map(renderEventCard)
                )
              )}
              {activeTab === 'merchandise' && (
                merchandiseEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>No merchandise events registered.</p>
                  </div>
                ) : (
                  merchandiseEvents.map(renderEventCard)
                )
              )}
              {activeTab === 'completed' && (
                completedEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>No completed events.</p>
                  </div>
                ) : (
                  completedEvents.map(renderEventCard)
                )
              )}
              {activeTab === 'cancelled' && (
                cancelledEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>No cancelled events.</p>
                  </div>
                ) : (
                  cancelledEvents.map(renderEventCard)
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantDashboard;
