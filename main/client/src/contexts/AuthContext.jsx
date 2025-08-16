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
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const googleLogin = async (token) => {
    try {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get user info
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      
      // Don't navigate here - let AuthCallback handle the navigation
    } catch (error) {
      toast.error('Google login failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/');
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const isAdmin = localStorage.getItem('isAdmin');
        
        console.log('🔍 AuthContext: Checking authentication state', {
          hasToken: !!token,
          isAdmin: isAdmin === 'true',
          pathname: window.location.pathname
        });
        
        if (token) {
          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          if (isAdmin === 'true') {
            console.log('👤 Setting admin user');
            // For admin users, create a mock user object
            setUser({
              id: 'admin',
              name: 'Admin',
              email: 'admin@acadmix.com',
              role: 'admin'
            });
            setLoading(false);
          } else {
            console.log('🔍 Verifying token with /auth/me');
            // Verify token and get user info for regular users
            const response = await api.get('/auth/me');
            console.log('✅ Token verified, user loaded:', response.data.user);
            setUser(response.data.user);
            setLoading(false);
          }
        } else {
          console.log('🔍 No token found, user not authenticated');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        delete api.defaults.headers.common['Authorization'];
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