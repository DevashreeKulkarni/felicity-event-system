import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrganizerNavbar from '../components/OrganizerNavbar';
import EventForum from '../components/EventForum';
import api from '../utils/api';

const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const OrganizerEventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [feedback, setFeedback] = useState({ feedbacks: [], avgRating: null, total: 0 });
  const [attendance, setAttendance] = useState({ registrations: [], total: 0, scanned: 0 });
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchEventDetails();
    fetchRegistrations();
  }, [id]);

  const fetchFeedback = async () => {
    try {
      const res = await api.get(`/events/${id}/feedback`);
      setFeedback(res.data);
    } catch (err) {
      console.error('Feedback fetch error:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.get(`/events/${id}/attendance`);
      setAttendance(res.data);
    } catch (err) {
      console.error('Attendance fetch error:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await api.get(`/events/${id}/payments`);
      setPayments(res.data);
    } catch (err) {
      console.error('Payments fetch error:', err);
    }
  };

  const handleToggleAttendance = async (regId) => {
    try {
      await api.put(`/registrations/${regId}/toggle-attendance`);
      fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle attendance');
    }
  };

  const handleApprovePayment = async (regId) => {
    try {
      await api.put(`/registrations/${regId}/approve-payment`);
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve payment');
    }
  };

  const handleRejectPayment = async (regId) => {
    try {
      await api.put(`/registrations/${regId}/reject-payment`);
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject payment');
    }
  };

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load event details');
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await api.get(`/events/${id}/participants`);
      const registrationsData = Array.isArray(response.data) ? response.data : [];
      setRegistrations(registrationsData);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setRegistrations([]);
    }
  };

  const handleExportCSV = async () => {
    try {
      if (!registrations || registrations.length === 0) {
        alert('No registrations to export');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${BASE_URL}/api/organizers/event/${id}/export`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const text = await response.text();
        let msg = 'Export failed';
        try { msg = JSON.parse(text).message || msg; } catch { }
        throw new Error(msg);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.eventName.replace(/\s+/g, '_')}_participants_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert(err.message || 'Failed to export CSV. Please try again.');
    }
  };


  const handlePublish = async () => {
    if (!window.confirm('Are you sure you want to publish this event?')) return;

    try {
      const response = await api.put(`/events/${id}`, { status: 'Published' });
      console.log('Publish response:', response.data);
      alert('Event published successfully!');
      fetchEventDetails();
    } catch (err) {
      console.error('Publish error:', err.response?.data || err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to publish event';
      alert(`Failed to publish event: ${errorMessage}`);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

    try {
      await api.delete(`/events/${id}`);
      alert('Event deleted successfully');
      navigate('/organizer/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const getEventStatus = () => {
    if (!event) return 'Unknown';
    const now = new Date();
    const start = new Date(event.eventStartDate);
    const end = new Date(event.eventEndDate);

    if (event.status === 'Draft') return 'Draft';
    if (now < start) return 'Published';
    if (now >= start && now <= end) return 'Ongoing';
    if (now > end) return 'Completed';
    return event.status;
  };

  const getStatusStyle = () => {
    const status = getEventStatus();
    const styles = {
      'Draft': { bg: '#FEF3C7', color: '#92400E' },
      'Published': { bg: '#DBEAFE', color: '#1E40AF' },
      'Ongoing': { bg: '#D1FAE5', color: '#065F46' },
      'Completed': { bg: '#E5E7EB', color: '#374151' }
    };
    return styles[status] || styles.Draft;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
        <OrganizerNavbar />
        <div style={{ padding: '30px 50px', textAlign: 'center', color: '#6B7280' }}>
          Loading event details...
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
        <OrganizerNavbar />
        <div style={{ padding: '30px 50px', textAlign: 'center', color: '#DC2626' }}>
          {error || 'Event not found'}
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle();
  const status = getEventStatus();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <OrganizerNavbar />
      <div style={{ padding: '30px 50px' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={() => navigate('/organizer/dashboard')}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#6B46C1',
              border: '1px solid #6B46C1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '15px'
            }}
          >
            ← Back to Dashboard
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: '700', color: '#1F2937' }}>
                {event.eventName}
              </h1>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.color,
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  {status}
                </span>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: event.eventType === 'Normal' ? '#DBEAFE' : '#FCE7F3',
                  color: event.eventType === 'Normal' ? '#1E40AF' : '#BE185D',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  {event.eventType}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {event.status === 'Draft' && (
                <button
                  onClick={handlePublish}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Publish Event
                </button>
              )}
              <button
                onClick={() => navigate(`/organizer/events/${id}/edit`)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6B46C1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Edit Event
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #E5E7EB', flexWrap: 'wrap' }}>
            {['details', 'registrations', 'analytics', 'attendance', 'payments', 'feedback', 'forum'].map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === 'feedback') fetchFeedback();
                  if (tab === 'attendance') fetchAttendance();
                  if (tab === 'payments') fetchPayments();
                }}
                style={{
                  padding: '12px 20px',
                  backgroundColor: activeTab === tab ? '#6B46C1' : 'transparent',
                  color: activeTab === tab ? 'white' : '#6B7280',
                  border: 'none',
                  borderBottom: activeTab === tab ? '3px solid #6B46C1' : '3px solid transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'grid', gap: '25px' }}>
              <div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600', color: '#6B7280' }}>Description</h3>
                <p style={{ margin: 0, fontSize: '15px', color: '#1F2937', lineHeight: '1.6' }}>{event.eventDescription}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>Start Date</h3>
                  <p style={{ margin: 0, fontSize: '15px', color: '#1F2937' }}>
                    {new Date(event.eventStartDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>End Date</h3>
                  <p style={{ margin: 0, fontSize: '15px', color: '#1F2937' }}>
                    {new Date(event.eventEndDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>Registration Deadline</h3>
                  <p style={{ margin: 0, fontSize: '15px', color: '#1F2937' }}>
                    {new Date(event.registrationDeadline).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>Venue</h3>
                  <p style={{ margin: 0, fontSize: '15px', color: '#1F2937' }}>{event.venue}</p>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>Eligibility</h3>
                  <p style={{ margin: 0, fontSize: '15px', color: '#1F2937' }}>{event.eligibility}</p>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>Registration Fee</h3>
                  <p style={{ margin: 0, fontSize: '15px', color: '#1F2937' }}>₹{event.registrationFee || 0}</p>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>Max Participants</h3>
                  <p style={{ margin: 0, fontSize: '15px', color: '#1F2937' }}>
                    {event.maxParticipants || 'Unlimited'}
                  </p>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>Current Registrations</h3>
                  <p style={{ margin: 0, fontSize: '15px', color: '#1F2937' }}>{registrations.length}</p>
                </div>
              </div>

              {event.tags && event.tags.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>Tags</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: '#F3F4F6',
                          color: '#4B5563',
                          borderRadius: '12px',
                          fontSize: '13px'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {event.customForm && event.customForm.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                    Custom Registration Form ({event.customForm.length} fields)
                  </h3>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {event.customForm.map((field, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '12px',
                          backgroundColor: '#F9FAFB',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px'
                        }}
                      >
                        <strong>{field.fieldName}</strong>
                        <span style={{ margin: '0 8px', color: '#6B7280' }}>•</span>
                        <span style={{ color: '#6B7280' }}>{field.fieldType}</span>
                        {field.isRequired && (
                          <>
                            <span style={{ margin: '0 8px', color: '#6B7280' }}>•</span>
                            <span style={{ color: '#DC2626' }}>Required</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>
                Registrations ({registrations.length})
              </h2>
              {registrations.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                >
                  <span>📥</span>
                  Download CSV
                </button>
              )}
            </div>

            {registrations.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                No registrations yet
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                        Ticket ID
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                        Participant
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                        Email
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                        Registered On
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1F2937', fontFamily: 'monospace' }}>
                          {reg.ticketId}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#1F2937' }}>
                          {reg.userId?.firstName} {reg.userId?.lastName}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#6B7280' }}>
                          {reg.userId?.email}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#6B7280' }}>
                          {new Date(reg.registrationDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            backgroundColor: reg.status === 'Registered' ? '#D1FAE5' : '#FEE2E2',
                            color: reg.status === 'Registered' ? '#065F46' : '#991B1B',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {reg.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>
              Event Analytics
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Total Registrations
                </p>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#6B46C1' }}>
                  {registrations.length}
                </p>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Confirmed
                </p>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#10B981' }}>
                  {registrations.filter(r => r.status === 'Confirmed').length}
                </p>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Total Revenue
                </p>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#6B46C1' }}>
                  ₹{(registrations.filter(r => r.status === 'Confirmed').length * (event.registrationFee || 0)).toLocaleString()}
                </p>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                  Capacity Used
                </p>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#3B82F6' }}>
                  {event.maxParticipants
                    ? `${Math.round((registrations.length / event.maxParticipants) * 100)}%`
                    : '∞'}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>Anonymous Feedback</h2>
            {feedback.total === 0 ? (
              <p style={{ color: '#6B7280', textAlign: 'center', padding: '30px' }}>No feedback submitted yet.</p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                  <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center', minWidth: '120px' }}>
                    <p style={{ margin: '0 0 4px', color: '#6B7280', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Avg Rating</p>
                    <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: '#f59e0b' }}>{feedback.avgRating} ★</p>
                  </div>
                  <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center', minWidth: '120px' }}>
                    <p style={{ margin: '0 0 4px', color: '#6B7280', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Responses</p>
                    <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: '#6B46C1' }}>{feedback.total}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {feedback.feedbacks.map((fb, i) => (
                    <div key={fb._id} style={{ padding: '14px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                        {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: fb.rating >= s ? '#f59e0b' : '#d1d5db', fontSize: '18px' }}>★</span>)}
                        <span style={{ marginLeft: '8px', color: '#6B7280', fontSize: '13px' }}>{new Date(fb.createdAt).toLocaleDateString()}</span>
                      </div>
                      {fb.comment && <p style={{ margin: 0, color: '#374151', fontSize: '14px' }}>{fb.comment}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>Attendance</h2>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
                  {attendance.scanned} / {attendance.total} checked in
                </p>
              </div>
              <button onClick={() => navigate(`/organizer/events/${id}/scanner`)} style={{
                padding: '10px 18px', backgroundColor: '#6B46C1', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px'
              }}>
                📷 Open QR Scanner
              </button>
            </div>

            {attendance.registrations.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>No registrations yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Participant</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Ticket ID</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Time</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.registrations.map(reg => (
                      <tr key={reg._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '12px', fontSize: '14px' }}>
                          {reg.userId?.firstName} {reg.userId?.lastName}
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>{reg.userId?.email}</div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', fontFamily: 'monospace', color: '#6B7280' }}>{reg.ticketId}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                            backgroundColor: reg.attendance?.marked ? '#D1FAE5' : '#FEF3C7',
                            color: reg.attendance?.marked ? '#065F46' : '#92400E'
                          }}>
                            {reg.attendance?.marked ? '✅ Present' : '⏳ Not Scanned'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#6B7280' }}>
                          {reg.attendance?.timestamp ? new Date(reg.attendance.timestamp).toLocaleTimeString() : '—'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button onClick={() => handleToggleAttendance(reg._id)} style={{
                            padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            backgroundColor: reg.attendance?.marked ? '#FEE2E2' : '#D1FAE5',
                            color: reg.attendance?.marked ? '#991B1B' : '#065F46',
                            border: 'none', borderRadius: '6px'
                          }}>
                            {reg.attendance?.marked ? 'Mark Absent' : 'Mark Present'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab (Merchandise only) */}
        {activeTab === 'payments' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>Payment Approvals</h2>
            {event?.eventType !== 'Merchandise' ? (
              <p style={{ color: '#6B7280', textAlign: 'center', padding: '30px' }}>This tab is only for Merchandise events.</p>
            ) : payments.length === 0 ? (
              <p style={{ color: '#6B7280', textAlign: 'center', padding: '30px' }}>No payment submissions yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                {payments.map(reg => (
                  <div key={reg._id} style={{
                    padding: '16px', border: '1px solid #E5E7EB',
                    borderRadius: '10px', display: 'flex', alignItems: 'center',
                    gap: '16px', flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '15px', color: '#1F2937' }}>
                        {reg.userId?.firstName} {reg.userId?.lastName}
                      </p>
                      <p style={{ margin: '0 0 2px', fontSize: '13px', color: '#6B7280' }}>{reg.userId?.email}</p>
                      <p style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', color: '#9CA3AF' }}>{reg.ticketId}</p>
                    </div>
                    <div>
                      <span style={{
                        padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                        backgroundColor:
                          reg.paymentStatus === 'Paid' ? '#D1FAE5' :
                            reg.paymentStatus === 'Rejected' ? '#FEE2E2' :
                              reg.paymentStatus === 'PendingVerification' ? '#DBEAFE' : '#FEF3C7',
                        color:
                          reg.paymentStatus === 'Paid' ? '#065F46' :
                            reg.paymentStatus === 'Rejected' ? '#991B1B' :
                              reg.paymentStatus === 'PendingVerification' ? '#1E40AF' : '#92400E'
                      }}>
                        {reg.paymentStatus}
                      </span>
                    </div>
                    {reg.paymentProof?.url && (
                      <a href={`${BASE_URL}${reg.paymentProof.url}`} target="_blank" rel="noreferrer" style={{
                        padding: '6px 14px', backgroundColor: '#F3F4F6', color: '#1F2937',
                        borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none'
                      }}>
                        📄 View Proof
                      </a>
                    )}
                    {reg.paymentStatus === 'PendingVerification' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleApprovePayment(reg._id)} style={{
                          padding: '8px 16px', backgroundColor: '#10B981', color: 'white',
                          border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px'
                        }}>Approve</button>
                        <button onClick={() => handleRejectPayment(reg._id)} style={{
                          padding: '8px 16px', backgroundColor: '#DC2626', color: 'white',
                          border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px'
                        }}>Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Forum Tab */}
        {activeTab === 'forum' && (
          <EventForum eventId={id} isOrganizer={true} />
        )}
      </div>
    </div>
  );
};

export default OrganizerEventDetails;
