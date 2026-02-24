import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, loginType = null) => {
    const response = await api.post('/auth/login', { email, password, loginType });
    const { token, role, ...userData } = response.data;

    localStorage.setItem('token', token);

    // Fetch full profile
    const profileResponse = await api.get('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });

    // role must come from the login response (the Organizer model has no role field)
    const fullUserData = { ...profileResponse.data, ...userData, role };
    localStorage.setItem('user', JSON.stringify(fullUserData));
    setUser(fullUserData);

    return fullUserData;
  };

  const register = async (formData) => {
    const response = await api.post('/auth/register', formData);
    const { token, ...userData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
