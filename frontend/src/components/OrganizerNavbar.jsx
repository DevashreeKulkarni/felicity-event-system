import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OrganizerNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      backgroundColor: '#8b4bc7ff',
      padding: '15px 30px',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Felicity - Organizer</h3>
        <Link to="/organizer/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
        <Link to="/organizer/create-event" style={{ color: 'white', textDecoration: 'none' }}>Create Event</Link>
        <Link to="/organizer/dashboard?tab=ongoing" style={{ color: 'white', textDecoration: 'none' }}>Ongoing Events</Link>
        <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>Profile</Link>
      </div>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <button
          onClick={handleLogout}
          style={{
            padding: '5px 15px',
            backgroundColor: '#3e1f93ff',
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

export default OrganizerNavbar;
