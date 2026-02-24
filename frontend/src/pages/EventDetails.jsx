import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ParticipantNavbar from '../components/ParticipantNavbar';
import EventForum from '../components/EventForum';
import api from '../utils/api';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);

      // Initialize form data with custom form fields
      if (response.data.customForm) {
        const initialData = {};
        response.data.customForm.forEach(field => {
          initialData[field.fieldName] = '';
        });
        setFormData(initialData);
      }

      setError('');
    } catch (err) {
      setError('Failed to load event details');
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validate registration is open
    if (!isRegistrationOpen()) {
      alert('Registration is closed for this event');
      return;
    }

    // Validate registration limit
    if (event.currentRegistrations >= event.registrationLimit) {
      alert('Event is full. Registration limit reached.');
      return;
    }

    setRegistering(true);
    try {
      const response = await api.post('/registrations', {
        eventId: event._id,
        formData: formData
      });

      alert(`Registration successful! Your ticket ID is: ${response.data.ticketId}`);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
      console.error('Registration error:', err);
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isRegistrationOpen = () => {
    if (!event) return false;
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    return now < deadline && event.status === 'Published';
  };

  const spotsLeft = () => {
    return event.registrationLimit - event.currentRegistrations;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
        <ParticipantNavbar />
        <div style={{ padding: '50px', textAlign: 'center', color: '#6B7280' }}>
          Loading event details...
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
        <ParticipantNavbar />
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <p style={{ color: '#DC2626', fontSize: '18px', marginBottom: '20px' }}>{error || 'Event not found'}</p>
          <button
            onClick={() => navigate('/events')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6B46C1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600'
            }}
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <ParticipantNavbar />
      <div style={{ padding: '30px 50px' }}>
        <button
          onClick={() => navigate('/events')}
          style={{
            padding: '10px 20px',
            backgroundColor: 'white',
            color: '#6B46C1',
            border: '2px solid #6B46C1',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '20px'
          }}
        >
          ← Back to Events
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          {/* Left Column - Event Details */}
          <div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '40px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {/* Header */}
              <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: event.eventType === 'Merchandise' ? '#FEF3C7' : '#DBEAFE',
                    color: event.eventType === 'Merchandise' ? '#92400E' : '#1E40AF'
                  }}>
                    {event.eventType}
                  </span>
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: event.status === 'Published' ? '#D1FAE5' : '#FEE2E2',
                    color: event.status === 'Published' ? '#065F46' : '#991B1B'
                  }}>
                    {event.status}
                  </span>
                </div>

                <h1 style={{ margin: '0 0 15px 0', fontSize: '36px', fontWeight: '700', color: '#1F2937' }}>
                  {event.eventName}
                </h1>

                <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.7', color: '#4B5563' }}>
                  {event.eventDescription}
                </p>
              </div>

              {/* Event Information Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '30px'
              }}>
                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                    Event Start
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                    {formatDate(event.eventStartDate)}
                  </p>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                    Event End
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                    {formatDate(event.eventEndDate)}
                  </p>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                    Venue
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                    {event.venue}
                  </p>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                    Registration Fee
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                    ₹{event.registrationFee}
                  </p>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                    Eligibility
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                    {event.eligibility}
                  </p>
                </div>

                <div style={{ padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                    Registration Deadline
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                    {formatDate(event.registrationDeadline)}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {event.eventTags && event.eventTags.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600', color: '#1F2937' }}>
                    Tags
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {event.eventTags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#EDE9FE',
                          color: '#6B46C1',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Merchandise Details */}
              {event.eventType === 'Merchandise' && event.merchandiseDetails && (
                <div style={{
                  padding: '25px',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '12px',
                  marginBottom: '30px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600', color: '#92400E' }}>
                    Merchandise Details
                  </h3>
                  <div style={{ color: '#78350F', fontSize: '15px', lineHeight: '1.6' }}>
                    <p style={{ margin: '0 0 8px 0' }}><strong>Item:</strong> {event.merchandiseDetails.itemName}</p>
                    <p style={{ margin: '0 0 8px 0' }}><strong>Description:</strong> {event.merchandiseDetails.itemDescription}</p>
                    <p style={{ margin: 0 }}><strong>Price:</strong> ₹{event.merchandiseDetails.price}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Registration Form */}
          <div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '30px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              position: 'sticky',
              top: '20px'
            }}>
              <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700', color: '#1F2937' }}>
                Registration
              </h2>

              {/* Availability Status */}
              <div style={{
                padding: '20px',
                backgroundColor: isRegistrationOpen() ? '#D1FAE5' : '#FEE2E2',
                borderRadius: '12px',
                marginBottom: '25px',
                textAlign: 'center'
              }}>
                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: isRegistrationOpen() ? '#065F46' : '#991B1B'
                }}>
                  {isRegistrationOpen() ? 'Registration Open' : 'Registration Closed'}
                </p>
                {isRegistrationOpen() && (
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#065F46'
                  }}>
                    {spotsLeft()} spot{spotsLeft() !== 1 ? 's' : ''} left of {event.registrationLimit}
                  </p>
                )}
              </div>

              {isRegistrationOpen() && spotsLeft() > 0 ? (
                <form onSubmit={handleRegister}>
                  {/* Custom Form Fields */}
                  {event.customForm && event.customForm.length > 0 ? (
                    <>
                      <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6B7280' }}>
                        Please fill in the following details:
                      </p>

                      {event.customForm.map((field, index) => (
                        <div key={index} style={{ marginBottom: '20px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            {field.fieldName}
                            {field.isRequired && <span style={{ color: '#DC2626' }}> *</span>}
                          </label>

                          {field.fieldType === 'Text' && (
                            <input
                              type="text"
                              value={formData[field.fieldName] || ''}
                              onChange={(e) => handleFormChange(field.fieldName, e.target.value)}
                              required={field.isRequired}
                              style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '2px solid #D1D5DB',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                              }}
                            />
                          )}

                          {field.fieldType === 'Number' && (
                            <input
                              type="number"
                              value={formData[field.fieldName] || ''}
                              onChange={(e) => handleFormChange(field.fieldName, e.target.value)}
                              required={field.isRequired}
                              style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '2px solid #D1D5DB',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                              }}
                            />
                          )}

                          {field.fieldType === 'Dropdown' && (
                            <select
                              value={formData[field.fieldName] || ''}
                              onChange={(e) => handleFormChange(field.fieldName, e.target.value)}
                              required={field.isRequired}
                              style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '2px solid #D1D5DB',
                                fontSize: '14px',
                                backgroundColor: 'white',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">Select...</option>
                              {field.options?.map((option, idx) => (
                                <option key={idx} value={option}>{option}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6B7280' }}>
                      Click the button below to register for this event.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={registering}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: '#6B46C1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: registering ? 'not-allowed' : 'pointer',
                      fontSize: '17px',
                      fontWeight: '600',
                      transition: 'background-color 0.3s',
                      opacity: registering ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => !registering && (e.target.style.backgroundColor = '#553C9A')}
                    onMouseLeave={(e) => !registering && (e.target.style.backgroundColor = '#6B46C1')}
                  >
                    {registering ? 'Registering...' : `Register Now - ₹${event.registrationFee}`}
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
                  <p style={{ margin: 0, fontSize: '15px' }}>
                    {isRegistrationOpen()
                      ? 'Event is full'
                      : 'Registration has closed for this event'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-Time Discussion Forum */}
        <EventForum eventId={id} isOrganizer={false} />
      </div>
    </div>
  );
};

export default EventDetails;
