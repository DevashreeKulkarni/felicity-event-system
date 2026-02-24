import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const Auth = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.pathname === '/register' ? 'register' : 'login'
  );
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // Update tab when URL changes
  useEffect(() => {
    if (location.pathname === '/register') {
      setActiveTab('register');
    } else {
      setActiveTab('login');
    }
  }, [location.pathname]);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginType, setLoginType] = useState('participant');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Turnstile CAPTCHA
  const TURNSTILE_SITE_KEY = '1x00000000000000000000AA'; // Cloudflare test key (always passes)
  const loginTurnstileRef = useRef(null);
  const registerTurnstileRef = useRef(null);
  const [loginCaptchaToken, setLoginCaptchaToken] = useState('');
  const [registerCaptchaToken, setRegisterCaptchaToken] = useState('');

  useEffect(() => {
    // Load Cloudflare Turnstile script once
    if (!document.getElementById('cf-turnstile-script')) {
      const script = document.createElement('script');
      script.id = 'cf-turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // Render login Turnstile widget when tab is 'login'
  useEffect(() => {
    if (activeTab === 'login' && loginTurnstileRef.current && window.turnstile) {
      loginTurnstileRef.current.innerHTML = '';
      window.turnstile.render(loginTurnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setLoginCaptchaToken(token),
        'expired-callback': () => setLoginCaptchaToken('')
      });
    }
  }, [activeTab, loginTurnstileRef.current]);

  // Render register Turnstile widget when tab is 'register'
  useEffect(() => {
    if (activeTab === 'register' && registerTurnstileRef.current && window.turnstile) {
      registerTurnstileRef.current.innerHTML = '';
      window.turnstile.render(registerTurnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setRegisterCaptchaToken(token),
        'expired-callback': () => setRegisterCaptchaToken('')
      });
    }
  }, [activeTab, registerTurnstileRef.current]);

  // Register state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    participantType: 'IIIT',
    collegeName: '',
    contactNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginCaptchaToken) {
      setLoginError('Please complete the CAPTCHA verification.');
      return;
    }

    setLoginLoading(true);
    try {
      // Verify CAPTCHA first
      await api.post('/auth/verify-turnstile', { token: loginCaptchaToken });

      const userData = await login(
        loginEmail,
        loginPassword,
        loginType === 'organizer' ? 'organizer' : null
      );

      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (userData.role === 'organizer') {
        navigate('/organizer/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');

    if (!registerCaptchaToken) {
      setRegisterError('Please complete the CAPTCHA verification.');
      return;
    }

    if (formData.participantType === 'IIIT') {
      if (!formData.email.endsWith('@students.iiit.ac.in') && !formData.email.endsWith('@iiit.ac.in')) {
        setRegisterError('IIIT participants must use IIIT email address (@students.iiit.ac.in or @iiit.ac.in)');
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }

    setRegisterLoading(true);
    try {
      // Verify CAPTCHA first
      await api.post('/auth/verify-turnstile', { token: registerCaptchaToken });

      const registerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        participantType: formData.participantType,
        collegeName: formData.collegeName,
        contactNumber: formData.contactNumber,
        password: formData.password
      };

      await register(registerData);
      navigate('/onboarding');
    } catch (err) {
      setRegisterError(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '8px',
    border: '2px solid #D1D5DB',
    fontSize: '15px',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '10px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#374151'
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
        maxWidth: '650px',
        width: '90%',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(107, 70, 193, 0.15)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '40px 60px 30px' }}>
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

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #E5E7EB',
          backgroundColor: '#F9FAFB'
        }}>
          <button
            onClick={() => {
              setActiveTab('login');
              navigate('/login');
            }}
            style={{
              flex: 1,
              padding: '18px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'login' ? '3px solid #6B46C1' : '3px solid transparent',
              color: activeTab === 'login' ? '#6B46C1' : '#6B7280',
              fontSize: '17px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              marginBottom: '-2px'
            }}
          >
            Login
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              navigate('/register');
            }}
            style={{
              flex: 1,
              padding: '18px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'register' ? '3px solid #6B46C1' : '3px solid transparent',
              color: activeTab === 'register' ? '#6B46C1' : '#6B7280',
              fontSize: '17px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              marginBottom: '-2px'
            }}
          >
            Register
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '40px 60px 50px' }}>
          {activeTab === 'login' ? (
            // LOGIN FORM
            <>
              {loginError && (
                <div style={{
                  padding: '12px',
                  marginBottom: '20px',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #DC2626',
                  borderRadius: '6px',
                  color: '#DC2626',
                  fontSize: '14px'
                }}>
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                <div style={{ marginBottom: '25px' }}>
                  <label style={labelStyle}>Login As:</label>
                  <select
                    value={loginType}
                    onChange={(e) => setLoginType(e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: 'pointer',
                      color: '#1F2937',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="participant">Participant</option>
                    <option value="organizer">Organizer</option>
                  </select>
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <label style={labelStyle}>Email:</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <label style={labelStyle}>Password:</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Turnstile CAPTCHA widget for login */}
                <div ref={loginTurnstileRef} style={{ margin: '20px 0' }} />

                <button
                  type="submit"
                  disabled={loginLoading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#6B46C1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loginLoading ? 'not-allowed' : 'pointer',
                    fontSize: '17px',
                    fontWeight: '600',
                    transition: 'background-color 0.3s',
                    opacity: loginLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => !loginLoading && (e.target.style.backgroundColor = '#553C9A')}
                  onMouseLeave={(e) => !loginLoading && (e.target.style.backgroundColor = '#6B46C1')}
                >
                  {loginLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </>
          ) : (
            // REGISTER FORM
            <>
              {registerError && (
                <div style={{
                  padding: '12px',
                  marginBottom: '20px',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #DC2626',
                  borderRadius: '6px',
                  color: '#DC2626',
                  fontSize: '14px'
                }}>
                  {registerError}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={labelStyle}>First Name:</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleRegisterChange}
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Last Name:</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleRegisterChange}
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Participant Type:</label>
                  <select
                    name="participantType"
                    value={formData.participantType}
                    onChange={handleRegisterChange}
                    required
                    style={{
                      ...inputStyle,
                      cursor: 'pointer',
                      color: '#1F2937',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="IIIT">IIIT Student</option>
                    <option value="Non-IIIT">Non-IIIT Participant</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>
                    Email {formData.participantType === 'IIIT' ? '(IIIT only)' : ''}:
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleRegisterChange}
                    required
                    placeholder={formData.participantType === 'IIIT' ? 'your.name@students.iiit.ac.in' : 'your.email@example.com'}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>College Name:</label>
                  <input
                    type="text"
                    name="collegeName"
                    value={formData.collegeName}
                    onChange={handleRegisterChange}
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Contact Number:</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleRegisterChange}
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Password:</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleRegisterChange}
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '25px' }}>
                  <label style={labelStyle}>Confirm Password:</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                    style={inputStyle}
                  />
                </div>

                {/* Turnstile CAPTCHA widget for register */}
                <div ref={registerTurnstileRef} style={{ margin: '20px 0' }} />

                <button
                  type="submit"
                  disabled={registerLoading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#6B46C1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: registerLoading ? 'not-allowed' : 'pointer',
                    fontSize: '17px',
                    fontWeight: '600',
                    transition: 'background-color 0.3s',
                    opacity: registerLoading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => !registerLoading && (e.target.style.backgroundColor = '#553C9A')}
                  onMouseLeave={(e) => !registerLoading && (e.target.style.backgroundColor = '#6B46C1')}
                >
                  {registerLoading ? 'Registering...' : 'Register'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
