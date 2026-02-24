import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('participant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(
        email, 
        password, 
        loginType === 'organizer' ? 'organizer' : null
      );
      
      console.log('Login successful:', userData);
      
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (userData.role === 'organizer') {
        navigate('/organizer/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || err.message || 'Login failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#F3F4F6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0',
      margin: '0'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        width: '90%',
        backgroundColor: 'white',
        padding: '60px',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(107, 70, 193, 0.15)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: '700', 
            color: '#6B46C1',
            margin: '0 0 15px 0',
            letterSpacing: '-0.5px'
          }}>
            Felicity
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#6B7280',
            margin: 0
          }}>
            Event Management System
          </p>
        </div>
        
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '35px',
          fontSize: '28px',
          fontWeight: '600',
          color: '#1F2937'
        }}>
          Login
        </h2>
      
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
        <div style={{ marginBottom: '25px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '10px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Login As:
          </label>
          <select 
            value={loginType} 
            onChange={(e) => setLoginType(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '14px 16px', 
              borderRadius: '8px', 
              border: '2px solid #D1D5DB',
              fontSize: '15px',
              color: '#1F2937',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="participant">Participant</option>
            <option value="organizer">Organizer</option>
          </select>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '10px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '14px 16px', 
              borderRadius: '8px', 
              border: '2px solid #D1D5DB',
              fontSize: '15px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '10px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '14px 16px', 
              borderRadius: '8px', 
              border: '2px solid #D1D5DB',
              fontSize: '15px',
              boxSizing: 'border-box'
            }}
          />
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
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {loginType === 'participant' && (
        <p style={{ 
          textAlign: 'center', 
          marginTop: '30px',
          fontSize: '15px',
          color: '#6B7280'
        }}>
          Don't have an account?{' '}
          <Link 
            to="/register" 
            style={{ 
              color: '#6B46C1', 
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Register
          </Link>
        </p>
      )}
      </div>
    </div>
  );
};

export default Login;
