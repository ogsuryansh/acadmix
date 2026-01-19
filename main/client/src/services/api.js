import axios from 'axios';

// Detect environment and set appropriate base URL
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Environment-based API URL configuration
let API_BASE_URL;
if (isDevelopment) {
  // Local development
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
} else {
  // Production - use environment variable or fallback to production URL
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.acadmix.shop/api';
}

console.log('🌍 Environment:', isDevelopment ? 'Development' : 'Production');
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('📍 Current hostname:', window.location.hostname);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include credentials for CORS and sessions
});

api.interceptors.request.use(
  (config) => {
    // No need to add Authorization header for cookie-based auth
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    console.log('🔍 API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      withCredentials: config.withCredentials,
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
      // Only redirect to login if we're not already on login/register/admin-login/auth-callback pages
      const currentPath = window.location.pathname;
      const excludedPaths = ['/login', '/register', '/admin-login', '/auth-callback'];
      if (!excludedPaths.some(path => currentPath.includes(path))) {
        console.log('🔄 Redirecting to login page...');
        // Use a more graceful redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network Error:', error.message);
      // You could show a toast notification here
    }

    return Promise.reject(error);
  }
);

export default api; 