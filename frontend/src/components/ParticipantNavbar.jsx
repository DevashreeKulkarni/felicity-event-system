import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ParticipantNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      backgroundColor: '#6B46C1',
      padding: '0 30px',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      height: '60px'
    }}>
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Felicity</h3>
        <Link 
          to="/dashboard" 
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          Dashboard
        </Link>
        <Link 
          to="/events" 
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          Browse Events
        </Link>
        <Link 
          to="/clubs" 
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          Clubs/Organizers
        </Link>
        <Link 
          to="/profile" 
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          Profile
        </Link>
      </div>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <span style={{ fontSize: '14px' }}>
          Welcome, {user?.firstName || user?.organizerName || user?.email?.split('@')[0]}
        </span>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default ParticipantNavbar;
