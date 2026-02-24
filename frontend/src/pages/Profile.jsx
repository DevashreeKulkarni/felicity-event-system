import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ParticipantNavbar from '../components/ParticipantNavbar';
import OrganizerNavbar from '../components/OrganizerNavbar';
import AdminNavbar from '../components/AdminNavbar';
import api from '../utils/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [resetRequests, setResetRequests] = useState([]);

  // Profile form data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    collegeName: '',
    contactNumber: '',
    areasOfInterest: []
  });

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [followedOrganizers, setFollowedOrganizers] = useState([]);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        collegeName: user.collegeName || '',
        contactNumber: user.contactNumber || '',
        areasOfInterest: user.areasOfInterest || []
      });
      if (user.role === 'participant') fetchFollowedOrganizers();
      if (user.role === 'organizer') fetchResetRequests();
    }
  }, [user]);

  const fetchFollowedOrganizers = async () => {
    try {
      const response = await api.get('/participants/followed-organizers');
      setFollowedOrganizers(response.data.organizers || []);
    } catch (err) {
      console.error('Error fetching followed organizers:', err);
    }
  };

  const fetchResetRequests = async () => {
    try {
      const response = await api.get('/admin/reset-requests');
      const all = response.data.requests || [];
      setResetRequests(all.filter(r => r.organizerId?._id === user?._id || r.organizerId === user?._id));
    } catch {
      // non-admin cannot see all, that's fine — we only want the organizer's own
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/organizers/reset-request', { reason: resetReason });
      alert('Reset request submitted. Admin will contact you with new credentials.');
      setResetReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleInterestsChange = (interest) => {
    setProfileData(prev => ({
      ...prev,
      areasOfInterest: prev.areasOfInterest.includes(interest)
        ? prev.areasOfInterest.filter(i => i !== interest)
        : [...prev.areasOfInterest, interest]
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put('/auth/profile', profileData);
      updateUser(response.data);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await api.put('/participants/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      alert('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (organizerId) => {
    try {
      await api.post(`/participants/unfollow/${organizerId}`);
      fetchFollowedOrganizers();
      alert('Unfollowed successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unfollow');
    }
  };

  const getNavbar = () => {
    if (user?.role === 'participant' || user?.role === 'admin') return <ParticipantNavbar />;
    if (user?.role === 'organizer') return <OrganizerNavbar />;
    return <AdminNavbar />;
  };

  const interestOptions = ['Technical', 'Cultural', 'Sports', 'Literary', 'Arts', 'Music'];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      {getNavbar()}
      <div style={{ padding: '30px 50px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: '700', color: '#1F2937' }}>
            My Profile
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#6B7280' }}>
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #E5E7EB' }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '12px 24px',
                backgroundColor: activeTab === 'profile' ? '#6B46C1' : 'transparent',
                color: activeTab === 'profile' ? 'white' : '#6B7280',
                border: 'none',
                borderBottom: activeTab === 'profile' ? '3px solid #6B46C1' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600'
              }}
            >
              Edit Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              style={{
                padding: '12px 24px',
                backgroundColor: activeTab === 'password' ? '#6B46C1' : 'transparent',
                color: activeTab === 'password' ? 'white' : '#6B7280',
                border: 'none',
                borderBottom: activeTab === 'password' ? '3px solid #6B46C1' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600'
              }}
            >
              Change Password
            </button>
            {user?.role === 'participant' && (
              <button
                onClick={() => setActiveTab('following')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: activeTab === 'following' ? '#6B46C1' : 'transparent',
                  color: activeTab === 'following' ? 'white' : '#6B7280',
                  border: 'none',
                  borderBottom: activeTab === 'following' ? '3px solid #6B46C1' : '3px solid transparent',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                Following ({followedOrganizers.length})
              </button>
            )}
            {user?.role === 'organizer' && (
              <button
                onClick={() => setActiveTab('resetrequest')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: activeTab === 'resetrequest' ? '#6B46C1' : 'transparent',
                  color: activeTab === 'resetrequest' ? 'white' : '#6B7280',
                  border: 'none',
                  borderBottom: activeTab === 'resetrequest' ? '3px solid #6B46C1' : '3px solid transparent',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                Reset Password
              </button>
            )}
          </div>
        </div>

        {/* Edit Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <form onSubmit={handleProfileSubmit}>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#F9FAFB',
                      color: '#6B7280',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                    Email cannot be changed
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      required
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
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      required
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
                </div>

                {user?.role === 'participant' && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        College Name
                      </label>
                      <input
                        type="text"
                        name="collegeName"
                        value={profileData.collegeName}
                        onChange={handleProfileChange}
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
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        name="contactNumber"
                        value={profileData.contactNumber}
                        onChange={handleProfileChange}
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
                      <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Areas of Interest
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                        {interestOptions.map(interest => (
                          <label
                            key={interest}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '10px',
                              border: `2px solid ${profileData.areasOfInterest.includes(interest) ? '#6B46C1' : '#E5E7EB'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              backgroundColor: profileData.areasOfInterest.includes(interest) ? '#F3F0FF' : 'white'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={profileData.areasOfInterest.includes(interest)}
                              onChange={() => handleInterestsChange(interest)}
                              style={{ marginRight: '8px', width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', color: '#374151' }}>{interest}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div style={{ paddingTop: '20px', borderTop: '2px solid #E5E7EB' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: '#6B46C1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ display: 'grid', gap: '20px', maxWidth: '500px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Current Password *
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
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
                    New Password *
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength="6"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                    Must be at least 6 characters
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
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

                <div style={{ paddingTop: '20px', borderTop: '2px solid #E5E7EB' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '12px 32px',
                      backgroundColor: '#6B46C1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Following Tab (Participants only) */}
        {activeTab === 'following' && user?.role === 'participant' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>
              Clubs You're Following ({followedOrganizers.length})
            </h2>

            {followedOrganizers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                <p style={{ marginBottom: '20px' }}>You're not following any clubs yet</p>
                <button
                  onClick={() => navigate('/clubs')}
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
                  Browse Clubs
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {followedOrganizers.map(org => (
                  <div
                    key={org._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      transition: 'box-shadow 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
                        {org.organizerName}
                      </h3>
                      <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                        {org.category} • {org.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnfollow(org._id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#FEE2E2',
                        color: '#991B1B',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'resetrequest' && user?.role === 'organizer' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>Request Password Reset</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6B7280' }}>Submit a request to Admin. They will generate a new password and share it with you manually.</p>
            <form onSubmit={handleResetRequest} style={{ maxWidth: '500px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Reason *</label>
                <textarea
                  value={resetReason}
                  onChange={e => setResetReason(e.target.value)}
                  required
                  rows={4}
                  placeholder="e.g. Forgot current password, security concern..."
                  style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ padding: '12px 32px', backgroundColor: '#6B46C1', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '600' }}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
