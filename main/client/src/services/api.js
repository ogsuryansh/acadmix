import axios from 'axios';

// Detect environment and set appropriate base URL
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isDevelopment ? 'http://localhost:5000/api' : 'https://api.acadmix.shop/api');

console.log('🌍 Environment:', isDevelopment ? 'Development' : 'Production');
console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    console.log('🔍 API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      hasToken: !!token,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('🔍 API Error Debug:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      pathname: window.location.pathname,
      timestamp: new Date().toISOString()
    });
    
    if (error.response?.status === 401) {
      console.log('🚨 401 Unauthorized - Authentication failed');
      // Only redirect to login if we're not already on login page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        console.log('🔄 Redirecting to login page...');
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        // Use a more graceful redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default api; 