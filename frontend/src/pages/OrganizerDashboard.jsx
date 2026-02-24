import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrganizerNavbar from '../components/OrganizerNavbar';
import api from '../utils/api';

const OrganizerDashboard = () => {
  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get('tab') || 'all';
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    draftEvents: 0,
    publishedEvents: 0,
    ongoingEvents: 0,
    completedEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0
  });
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events/organizer/my-events');
      // Backend returns events directly as array, not wrapped in {events: [...]}
      const eventsData = Array.isArray(response.data) ? response.data : (response.data.events || []);
      setEvents(eventsData);
      calculateStats(eventsData);
      setError('');
    } catch (err) {
      setError('Failed to load events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (eventsData) => {
    const now = new Date();
    const stats = {
      totalEvents: eventsData.length,
      draftEvents: eventsData.filter(e => e.status === 'Draft').length,
      publishedEvents: eventsData.filter(e => e.status === 'Published').length,
      ongoingEvents: eventsData.filter(e => {
        const start = new Date(e.eventStartDate);
        const end = new Date(e.eventEndDate);
        return now >= start && now <= end && e.status === 'Published';
      }).length,
      completedEvents: eventsData.filter(e => {
        const end = new Date(e.eventEndDate);
        return now > end && e.status === 'Published';
      }).length,
      totalRegistrations: eventsData.reduce((sum, e) => sum + (e.registrationCount || 0), 0),
      totalRevenue: eventsData.reduce((sum, e) => sum + (e.revenue || 0), 0)
    };
    setStats(stats);
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const start = new Date(event.eventStartDate);
    const end = new Date(event.eventEndDate);

    if (event.status === 'Draft') return 'Draft';
    if (now < start) return 'Published';
    if (now >= start && now <= end) return 'Ongoing';
    if (now > end) return 'Completed';
    return event.status;
  };

  const getFilteredEvents = () => {
    if (activeTab === 'all') return events;

    const now = new Date();
    return events.filter(event => {
      const status = getEventStatus(event);
      if (activeTab === 'draft') return status === 'Draft';
      if (activeTab === 'published') return status === 'Published';
      if (activeTab === 'ongoing') return status === 'Ongoing';
      if (activeTab === 'completed') return status === 'Completed';
      return true;
    });
  };

  const getStatusStyle = (event) => {
    const status = getEventStatus(event);
    const styles = {
      'Draft': { bg: '#FEF3C7', color: '#92400E' },
      'Published': { bg: '#DBEAFE', color: '#1E40AF' },
      'Ongoing': { bg: '#D1FAE5', color: '#065F46' },
      'Completed': { bg: '#E5E7EB', color: '#374151' }
    };
    return styles[status] || styles.Draft;
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <OrganizerNavbar />
      <div style={{ padding: '30px 50px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: '700', color: '#1F2937' }}>
              Organizer Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: '16px', color: '#6B7280' }}>
              Manage your events and track performance
            </p>
          </div>
          <button
            onClick={() => navigate('/organizer/create-event')}
            style={{
              padding: '14px 28px',
              backgroundColor: '#6B46C1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(107,70,193,0.2)',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#553C9A'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#6B46C1'}
          >
            + Create New Event
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
              Total Events
            </p>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#1F2937' }}>
              {stats.totalEvents}
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
              Draft
            </p>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#F59E0B' }}>
              {stats.draftEvents}
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
              Published
            </p>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#3B82F6' }}>
              {stats.publishedEvents}
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
              Ongoing
            </p>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#10B981' }}>
              {stats.ongoingEvents}
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
              Total Registrations
            </p>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#8B5CF6' }}>
              {stats.totalRegistrations}
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
              Total Revenue
            </p>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#6B46C1' }}>
              ₹{stats.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #E5E7EB',
            overflowX: 'auto'
          }}>
            {[
              { key: 'all', label: 'All Events' },
              { key: 'draft', label: 'Draft' },
              { key: 'published', label: 'Published' },
              { key: 'ongoing', label: 'Ongoing' },
              { key: 'completed', label: 'Completed' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '16px 28px',
                  backgroundColor: activeTab === tab.key ? '#6B46C1' : 'transparent',
                  color: activeTab === tab.key ? 'white' : '#6B7280',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  borderBottom: activeTab === tab.key ? '3px solid #6B46C1' : '3px solid transparent',
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Events List */}
          <div style={{ padding: '25px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
                Loading events...
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#DC2626' }}>
                {error}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
                <p style={{ fontSize: '16px', marginBottom: '20px' }}>
                  {activeTab === 'all' ? 'No events created yet' : `No ${activeTab} events`}
                </p>
                <button
                  onClick={() => navigate('/organizer/create-event')}
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
                  Create Your First Event
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '20px'
              }}>
                {filteredEvents.map(event => {
                  const statusStyle = getStatusStyle(event);
                  const status = getEventStatus(event);
                  return (
                    <div
                      key={event._id}
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      onClick={() => navigate(`/organizer/events/${event._id}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1F2937', flex: 1 }}>
                          {event.eventName}
                        </h3>
                        <span style={{
                          padding: '4px 10px',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginLeft: '10px'
                        }}>
                          {status}
                        </span>
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          backgroundColor: event.eventType === 'Normal' ? '#DBEAFE' : '#FCE7F3',
                          color: event.eventType === 'Normal' ? '#1E40AF' : '#BE185D',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {event.eventType}
                        </span>
                      </div>

                      <p style={{
                        margin: '0 0 15px 0',
                        fontSize: '14px',
                        color: '#6B7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {event.eventDescription}
                      </p>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        fontSize: '13px',
                        color: '#4B5563'
                      }}>
                        <div>
                          <strong>Start:</strong> {new Date(event.eventStartDate).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>End:</strong> {new Date(event.eventEndDate).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Registrations:</strong> {event.registrationCount || 0}
                        </div>
                        <div>
                          <strong>Fee:</strong> ₹{event.registrationFee || 0}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
