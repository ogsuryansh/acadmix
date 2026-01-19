import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { success, user } = response.data;

      if (success) {
        setUser(user);
        toast.success('Login successful!');
        // Don't navigate here - let the Login component handle navigation
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { success, user } = response.data;

      if (success) {
        setUser(user);
        toast.success('Registration successful!');
        navigate('/');
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const googleLogin = async () => {
    try {
      // Get user info from session
      const response = await api.get('/auth/me');
      setUser(response.data.user);

      // Don't navigate here - let AuthCallback handle the navigation
    } catch (error) {
      toast.error('Google login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
      navigate('/');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated via session
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        setLoading(false);
      } catch (error) {
        setUser(null);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    googleLogin,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 