import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrganizers, setSelectedOrganizers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingOrganizers, setFetchingOrganizers] = useState(true);

  const interestOptions = [
    'Technical',
    'Cultural', 
    'Sports',
    'Literary',
    'Arts',
    'Music',
    'Dance',
    'Drama',
    'Photography',
    'Gaming'
  ];

  useEffect(() => {
    // Only show onboarding for participants
    if (user?.role !== 'participant') {
      navigate('/dashboard');
      return;
    }
    fetchOrganizers();
  }, [user, navigate]);

  const fetchOrganizers = async () => {
    try {
      setFetchingOrganizers(true);
      const response = await api.get('/participants/organizers');
      setOrganizers(response.data.organizers || []);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    } finally {
      setFetchingOrganizers(false);
    }
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleOrganizer = (organizerId) => {
    setSelectedOrganizers(prev =>
      prev.includes(organizerId)
        ? prev.filter(id => id !== organizerId)
        : [...prev, organizerId]
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await api.put('/auth/profile', {
        interests: selectedInterests,
        followedOrganizers: selectedOrganizers
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. You can update them later from your profile.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#F3F4F6',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{ 
            fontSize: '32px',
            fontWeight: '700',
            color: '#1F2937',
            margin: '0 0 10px 0'
          }}>
            Welcome to Felicity! 🎉
          </h1>
          <p style={{ 
            fontSize: '16px',
            color: '#6B7280',
            margin: 0
          }}>
            Let's personalize your experience. You can always change these later in your profile.
          </p>
        </div>

        {/* Interests Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ 
            fontSize: '20px',
            fontWeight: '600',
            color: '#1F2937',
            margin: '0 0 20px 0'
          }}>
            What are you interested in?
          </h2>
          <p style={{ 
            fontSize: '14px',
            color: '#6B7280',
            margin: '0 0 20px 0'
          }}>
            Select your areas of interest (multiple selections allowed)
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            {interestOptions.map(interest => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                style={{
                  padding: '12px 16px',
                  border: `2px solid ${selectedInterests.includes(interest) ? '#6B46C1' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  backgroundColor: selectedInterests.includes(interest) ? '#F3F0FF' : 'white',
                  color: selectedInterests.includes(interest) ? '#6B46C1' : '#374151',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!selectedInterests.includes(interest)) {
                    e.target.style.borderColor = '#6B46C1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedInterests.includes(interest)) {
                    e.target.style.borderColor = '#E5E7EB';
                  }
                }}
              >
                {interest}
              </button>
            ))}
          </div>

          {selectedInterests.length > 0 && (
            <p style={{
              marginTop: '15px',
              fontSize: '14px',
              color: '#6B46C1',
              fontWeight: '500'
            }}>
              ✓ {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Organizers Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ 
            fontSize: '20px',
            fontWeight: '600',
            color: '#1F2937',
            margin: '0 0 20px 0'
          }}>
            Follow Clubs & Organizers
          </h2>
          <p style={{ 
            fontSize: '14px',
            color: '#6B7280',
            margin: '0 0 20px 0'
          }}>
            Stay updated with events from your favorite clubs
          </p>

          {fetchingOrganizers ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
              Loading clubs...
            </div>
          ) : organizers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
              No organizers available yet
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '12px',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '10px'
            }}>
              {organizers.map(org => (
                <div
                  key={org._id}
                  onClick={() => toggleOrganizer(org._id)}
                  style={{
                    padding: '16px',
                    border: `2px solid ${selectedOrganizers.includes(org._id) ? '#6B46C1' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    backgroundColor: selectedOrganizers.includes(org._id) ? '#F3F0FF' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(107,70,193,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: '0 0 5px 0',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1F2937'
                      }}>
                        {org.organizerName}
                      </h3>
                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '13px',
                        color: '#6B46C1',
                        fontWeight: '500'
                      }}>
                        {org.category}
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#6B7280',
                        lineHeight: '1.4'
                      }}>
                        {org.description?.substring(0, 100)}{org.description?.length > 100 ? '...' : ''}
                      </p>
                    </div>
                    {selectedOrganizers.includes(org._id) && (
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#6B46C1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginLeft: '10px',
                        flexShrink: 0
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedOrganizers.length > 0 && (
            <p style={{
              marginTop: '15px',
              fontSize: '14px',
              color: '#6B46C1',
              fontWeight: '500'
            }}>
              ✓ Following {selectedOrganizers.length} club{selectedOrganizers.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center'
        }}>
          <button
            onClick={handleSkip}
            disabled={loading}
            style={{
              padding: '14px 32px',
              backgroundColor: 'white',
              color: '#6B7280',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.borderColor = '#6B7280';
                e.target.style.color = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.borderColor = '#E5E7EB';
                e.target.style.color = '#6B7280';
              }
            }}
          >
            Skip for Now
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '14px 32px',
              backgroundColor: '#6B46C1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              boxShadow: '0 2px 4px rgba(107,70,193,0.2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.backgroundColor = '#553C9A';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.backgroundColor = '#6B46C1';
            }}
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
