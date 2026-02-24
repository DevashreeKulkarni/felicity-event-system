import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticipantNavbar from '../components/ParticipantNavbar';
import api from '../utils/api';

const ClubsListing = () => {
  const navigate = useNavigate();
  const [organizers, setOrganizers] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchOrganizers();
    fetchFollowedOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/participants/organizers');
      setOrganizers(response.data.organizers || []);
      setError('');
    } catch (err) {
      setError('Failed to load clubs');
      console.error('Error fetching organizers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowedOrganizers = async () => {
    try {
      const response = await api.get('/participants/followed-organizers');
      const followed = response.data.organizers || [];
      setFollowedOrganizers(followed.map(org => org._id));
    } catch (err) {
      console.error('Error fetching followed organizers:', err);
    }
  };

  const handleFollow = async (organizerId) => {
    try {
      await api.post(`/participants/follow/${organizerId}`);
      setFollowedOrganizers(prev => [...prev, organizerId]);
      alert('Followed successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to follow');
    }
  };

  const handleUnfollow = async (organizerId) => {
    try {
      await api.post(`/participants/unfollow/${organizerId}`);
      setFollowedOrganizers(prev => prev.filter(id => id !== organizerId));
      alert('Unfollowed successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unfollow');
    }
  };

  const isFollowing = (organizerId) => {
    return followedOrganizers.includes(organizerId);
  };

  const getFilteredOrganizers = () => {
    return organizers.filter(org => {
      const matchesSearch = org.organizerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           org.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || org.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Literary', 'Arts'];
  const filteredOrganizers = getFilteredOrganizers();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <ParticipantNavbar />
      <div style={{ padding: '30px 50px' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: '700', color: '#1F2937' }}>
            Clubs & Organizers
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#6B7280' }}>
            Discover and follow clubs to stay updated with their events
          </p>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Search Clubs
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or description..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {(searchTerm || selectedCategory !== 'All') && (
            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                Found {filteredOrganizers.length} {filteredOrganizers.length === 1 ? 'club' : 'clubs'}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Clubs Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
            Loading clubs...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#DC2626' }}>
            {error}
          </div>
        ) : filteredOrganizers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280' }}>
            <p style={{ fontSize: '16px' }}>No clubs found matching your criteria</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '25px'
          }}>
            {filteredOrganizers.map(org => {
              const following = isFollowing(org._id);
              return (
                <div
                  key={org._id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '25px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s',
                    border: '1px solid #E5E7EB'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
                  <div style={{ marginBottom: '15px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>
                      {org.organizerName}
                    </h3>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#DBEAFE',
                      color: '#1E40AF',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {org.category}
                    </span>
                  </div>

                  <p style={{
                    margin: '0 0 15px 0',
                    fontSize: '14px',
                    color: '#6B7280',
                    lineHeight: '1.5',
                    minHeight: '42px'
                  }}>
                    {org.description || 'No description available'}
                  </p>

                  <div style={{ marginBottom: '15px', fontSize: '13px', color: '#6B7280' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Email:</strong> {org.contactEmail}
                    </div>
                    <div>
                      <strong>Contact:</strong> {org.contactNumber}
                    </div>
                  </div>

                  <button
                    onClick={() => following ? handleUnfollow(org._id) : handleFollow(org._id)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: following ? 'white' : '#6B46C1',
                      color: following ? '#6B46C1' : 'white',
                      border: following ? '2px solid #6B46C1' : 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      if (following) {
                        e.target.style.backgroundColor = '#FEE2E2';
                        e.target.style.borderColor = '#DC2626';
                        e.target.style.color = '#DC2626';
                        e.target.textContent = 'Unfollow';
                      } else {
                        e.target.style.backgroundColor = '#553C9A';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (following) {
                        e.target.style.backgroundColor = 'white';
                        e.target.style.borderColor = '#6B46C1';
                        e.target.style.color = '#6B46C1';
                        e.target.textContent = 'Following';
                      } else {
                        e.target.style.backgroundColor = '#6B46C1';
                      }
                    }}
                  >
                    {following ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubsListing;
