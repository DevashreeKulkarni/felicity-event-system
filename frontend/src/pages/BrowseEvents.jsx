import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticipantNavbar from '../components/ParticipantNavbar';
import api from '../utils/api';

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [eventType, setEventType] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [followedOnly, setFollowedOnly] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchTrendingEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, eventType, eligibility, followedOnly, events]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      // Backend returns array directly, not wrapped in {events: [...]}
      const eventsData = Array.isArray(response.data) ? response.data : (response.data.events || []);
      setEvents(eventsData);
      setError('');
    } catch (err) {
      setError('Failed to load events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingEvents = async () => {
    try {
      setTrendingLoading(true);
      const response = await api.get('/participants/trending');
      const trendingData = Array.isArray(response.data) ? response.data : [];
      setTrendingEvents(trendingData);
    } catch (err) {
      console.error('Error fetching trending events:', err);
      setTrendingEvents([]);
    } finally {
      setTrendingLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.eventDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.eventTags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Event type filter
    if (eventType) {
      filtered = filtered.filter(event => event.eventType === eventType);
    }

    // Eligibility filter
    if (eligibility) {
      filtered = filtered.filter(event => event.eligibility === eligibility);
    }

    // Only show published events
    filtered = filtered.filter(event => event.status === 'Published');

    setFilteredEvents(filtered);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isRegistrationOpen = (event) => {
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    return now < deadline && event.status === 'Published';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <ParticipantNavbar />
      <div style={{ padding: '30px 50px' }}>
        <h1 style={{ margin: '0 0 30px 0', fontSize: '32px', fontWeight: '700', color: '#1F2937' }}>
          Browse Events
        </h1>

        {/* Trending Events Section */}
        {!trendingLoading && trendingEvents.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🔥</span>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1F2937' }}>
                Trending Now
              </h2>
              <span style={{
                marginLeft: '12px',
                padding: '4px 12px',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                Top {trendingEvents.length} in last 24h
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px',
              marginBottom: '10px'
            }}>
              {trendingEvents.map(event => (
                <div
                  key={event._id}
                  onClick={() => navigate(`/events/${event._id}`)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 4px 6px rgba(234, 88, 12, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: '2px solid #FED7AA',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(234, 88, 12, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#FB923C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(234, 88, 12, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#FED7AA';
                  }}
                >
                  {/* Trending Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#DC2626',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🔥 {event.recentRegistrations || 0} registrations
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#1F2937', paddingRight: '100px' }}>
                      {event.eventName}
                    </h3>

                    <p style={{
                      margin: '8px 0',
                      fontSize: '13px',
                      color: '#6B7280',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {event.eventDescription}
                    </p>

                    <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: event.eventType === 'Merchandise' ? '#FEF3C7' : '#DBEAFE',
                        color: event.eventType === 'Merchandise' ? '#92400E' : '#1E40AF'
                      }}>
                        {event.eventType}
                      </span>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        📅 {formatDate(event.eventStartDate)}
                      </span>
                      {event.registrationFee > 0 && (
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#059669' }}>
                          ₹{event.registrationFee}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '2px solid #F3F4F6'
            }} />
          </div>
        )}

        {/* Filters */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {/* Search */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Search Events
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, description, or tags..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Event Type */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Types</option>
                <option value="Normal">Normal</option>
                <option value="Merchandise">Merchandise</option>
              </select>
            </div>

            {/* Eligibility */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Eligibility
              </label>
              <select
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">All</option>
                <option value="IIIT Students Only">IIIT Students Only</option>
                <option value="IIIT Community">IIIT Community</option>
                <option value="Open to All">Open to All</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || eventType || eligibility) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setEventType('');
                setEligibility('');
              }}
              style={{
                marginTop: '15px',
                padding: '8px 16px',
                backgroundColor: '#F3F4F6',
                color: '#6B7280',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div style={{ marginBottom: '20px', color: '#6B7280', fontSize: '15px' }}>
          Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
            Loading events...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#DC2626' }}>
            {error}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'white',
            borderRadius: '12px',
            color: '#6B7280'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>No events found</p>
            <p style={{ fontSize: '14px' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '25px'
          }}>
            {filteredEvents.map(event => (
              <div
                key={event._id}
                onClick={() => navigate(`/events/${event._id}`)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '25px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(107, 70, 193, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#6B46C1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                {/* Event Header */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>
                      {event.eventName}
                    </h3>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: event.eventType === 'Merchandise' ? '#FEF3C7' : '#DBEAFE',
                      color: event.eventType === 'Merchandise' ? '#92400E' : '#1E40AF'
                    }}>
                      {event.eventType}
                    </span>
                  </div>

                  <p style={{
                    margin: '10px 0 0 0',
                    fontSize: '14px',
                    color: '#6B7280',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {event.eventDescription}
                  </p>
                </div>

                {/* Event Details */}
                <div style={{ marginBottom: '15px', fontSize: '14px', color: '#4B5563' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', minWidth: '100px' }}>Start Date:</span>
                    <span>{formatDate(event.eventStartDate)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', minWidth: '100px' }}>Venue:</span>
                    <span>{event.venue}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', minWidth: '100px' }}>Fee:</span>
                    <span>₹{event.registrationFee}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', minWidth: '100px' }}>Eligibility:</span>
                    <span style={{ fontSize: '13px' }}>{event.eligibility}</span>
                  </div>
                </div>

                {/* Tags */}
                {event.eventTags && event.eventTags.length > 0 && (
                  <div style={{ marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {event.eventTags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#F3F4F6',
                          color: '#6B7280',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {event.eventTags.length > 3 && (
                      <span style={{ fontSize: '12px', color: '#6B7280', padding: '4px' }}>
                        +{event.eventTags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Registration Status */}
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: isRegistrationOpen(event) ? '#D1FAE5' : '#FEE2E2',
                  textAlign: 'center'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isRegistrationOpen(event) ? '#065F46' : '#991B1B'
                  }}>
                    {isRegistrationOpen(event)
                      ? `Register by ${formatDate(event.registrationDeadline)}`
                      : 'Registration Closed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseEvents;
