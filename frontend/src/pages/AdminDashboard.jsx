import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import api from '../utils/api';

const AdminDashboard = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/organizers');
      setOrganizers(response.data.organizers || []);
      setError('');
    } catch (err) {
      setError('Failed to load organizers');
      console.error('Error fetching organizers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (organizerId, organizerName) => {
    if (!window.confirm(`Are you sure you want to delete organizer "${organizerName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteLoading(organizerId);
      await api.delete(`/admin/organizers/${organizerId}`);
      alert('Organizer deleted successfully');
      fetchOrganizers(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete organizer');
      console.error('Delete error:', err);
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <AdminNavbar />
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
              Admin Dashboard
            </h1>
            <p style={{ margin: 0, fontSize: '16px', color: '#6B7280' }}>
              Manage organizers and oversee the platform
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/create-organizer')}
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
            + Create New Organizer
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '25px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
              Total Organizers
            </p>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: '700', color: '#6B46C1' }}>
              {organizers.length}
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
              Approved Organizers
            </p>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: '700', color: '#10B981' }}>
              {organizers.filter(org => org.isApproved).length}
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
              Pending Approval
            </p>
            <p style={{ margin: 0, fontSize: '36px', fontWeight: '700', color: '#F59E0B' }}>
              {organizers.filter(org => !org.isApproved).length}
            </p>
          </div>
        </div>

        {/* Organizers Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '25px 30px', borderBottom: '2px solid #E5E7EB' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1F2937' }}>
              All Organizers
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
              Loading organizers...
            </div>
          ) : error ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#DC2626' }}>
              {error}
            </div>
          ) : organizers.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280' }}>
              <p style={{ fontSize: '16px', marginBottom: '20px' }}>No organizers found</p>
              <button
                onClick={() => navigate('/admin/create-organizer')}
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
                Create First Organizer
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                      Organizer Name
                    </th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                      Category
                    </th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                      Contact Email
                    </th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                      Contact Number
                    </th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {organizers.map((organizer) => (
                    <tr 
                      key={organizer._id}
                      style={{ 
                        borderBottom: '1px solid #E5E7EB',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: '600', color: '#1F2937', fontSize: '15px' }}>
                          {organizer.organizerName}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                          ID: {organizer._id?.slice(-8)}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#DBEAFE',
                          color: '#1E40AF',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          {organizer.category}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#4B5563' }}>
                        {organizer.contactEmail}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#4B5563' }}>
                        {organizer.contactNumber}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '6px 12px',
                          backgroundColor: organizer.isApproved ? '#D1FAE5' : '#FEE2E2',
                          color: organizer.isApproved ? '#065F46' : '#991B1B',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}>
                          {organizer.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDelete(organizer._id, organizer.organizerName)}
                          disabled={deleteLoading === organizer._id}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: deleteLoading === organizer._id ? '#9CA3AF' : '#DC2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: deleteLoading === organizer._id ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'background-color 0.3s'
                          }}
                          onMouseEnter={(e) => !deleteLoading && (e.target.style.backgroundColor = '#B91C1C')}
                          onMouseLeave={(e) => !deleteLoading && (e.target.style.backgroundColor = '#DC2626')}
                        >
                          {deleteLoading === organizer._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
