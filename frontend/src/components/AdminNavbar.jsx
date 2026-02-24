import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      backgroundColor: '#6B46C1',
      padding: '15px 30px',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Felicity - Admin</h3>
        <Link to="/admin/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
        <Link to="/admin/create-organizer" style={{ color: 'white', textDecoration: 'none' }}>Manage Organizers</Link>
        <Link to="/admin/reset-requests" style={{ color: 'white', textDecoration: 'none' }}>Password Reset Requests</Link>
      </div>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <button
          onClick={handleLogout}
          style={{
            padding: '5px 15px',
            backgroundColor: '#553C9A',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;
