import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import api from '../utils/api';

const CreateOrganizer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState(null);
  
  const [formData, setFormData] = useState({
    organizerName: '',
    category: '',
    description: '',
    contactEmail: '',
    contactNumber: '',
    discordWebhook: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/admin/organizers', formData);
      setCredentials(response.data);
      alert('Organizer created successfully! Please save the credentials.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create organizer');
      console.error('Create organizer error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    alert(`${field} copied to clipboard!`);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #D1D5DB',
    fontSize: '15px',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  };

  if (credentials) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
        <AdminNavbar />
        <div style={{ padding: '30px 50px' }}>
          <div style={{
            maxWidth: '700px',
            margin: '0 auto',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#D1FAE5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <span style={{ fontSize: '40px' }}>✓</span>
              </div>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '700', color: '#1F2937' }}>
                Organizer Created Successfully!
              </h2>
              <p style={{ margin: 0, fontSize: '16px', color: '#6B7280' }}>
                Please save these credentials. They won't be shown again.
              </p>
            </div>

            <div style={{
              backgroundColor: '#FEF3C7',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '30px',
              border: '2px solid #FCD34D'
            }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#92400E' }}>
                ⚠️ Important: Share these credentials securely with the organizer. The password cannot be retrieved later.
              </p>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ ...labelStyle, color: '#6B7280' }}>Organizer Name</label>
              <div style={{
                padding: '12px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1F2937'
              }}>
                {credentials.organizer.organizerName}
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ ...labelStyle, color: '#6B7280' }}>Login Email</label>
              <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                <div style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1F2937',
                  fontFamily: 'monospace'
                }}>
                  {credentials.organizer.contactEmail}
                </div>
                <button
                  onClick={() => copyToClipboard(credentials.organizer.contactEmail, 'Email')}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#6B46C1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ ...labelStyle, color: '#6B7280' }}>Auto-Generated Password</label>
              <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                <div style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#FEE2E2',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#DC2626',
                  fontFamily: 'monospace',
                  letterSpacing: '2px'
                }}>
                  {credentials.credentials?.password || credentials.password}
                </div>
                <button
                  onClick={() => copyToClipboard(credentials.credentials?.password || credentials.password, 'Password')}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#DC2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => navigate('/admin/dashboard')}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#6B46C1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  setCredentials(null);
                  setFormData({
                    organizerName: '',
                    category: '',
                    description: '',
                    contactEmail: '',
                    contactNumber: '',
                    discordWebhook: ''
                  });
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: 'white',
                  color: '#6B46C1',
                  border: '2px solid #6B46C1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <AdminNavbar />
      <div style={{ padding: '30px 50px' }}>
        <button
          onClick={() => navigate('/admin/dashboard')}
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
          ← Back to Dashboard
        </button>

        <div style={{
          maxWidth: '700px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '700', color: '#1F2937' }}>
            Create New Organizer
          </h1>
          <p style={{ margin: '0 0 30px 0', fontSize: '15px', color: '#6B7280' }}>
            Auto-generated credentials will be provided after creation
          </p>

          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #DC2626',
              borderRadius: '6px',
              color: '#DC2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                Organizer Name <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="text"
                name="organizerName"
                value={formData.organizerName}
                onChange={handleChange}
                required
                placeholder="e.g., E-Cell, Muse, Photography Club"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                Category <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select Category</option>
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Academic">Academic</option>
                <option value="Social">Social</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                Description <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Brief description about the organizer..."
                style={{
                  ...inputStyle,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                Contact Email <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                required
                placeholder="organizer@example.com"
                style={inputStyle}
              />
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
                This will be used as the login email
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                Contact Number <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
                placeholder="9876543210"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={labelStyle}>
                Discord Webhook URL (Optional)
              </label>
              <input
                type="url"
                name="discordWebhook"
                value={formData.discordWebhook}
                onChange={handleChange}
                placeholder="https://discord.com/api/webhooks/..."
                style={inputStyle}
              />
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6B7280' }}>
                For registration notifications (Advanced Feature)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#6B46C1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '17px',
                fontWeight: '600',
                transition: 'background-color 0.3s',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#553C9A')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#6B46C1')}
            >
              {loading ? 'Creating...' : 'Create Organizer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrganizer;
