import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/backend';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    // Only check expiration if token exists
    if (token && tokenExpiry) {
      const isExpired = Date.now() > parseInt(tokenExpiry);
      if (isExpired) {
        // Clear expired token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('rememberMe');
        
        // Dispatch auth-expired event
        window.dispatchEvent(new Event('auth-expired'));
        
        // Show toast only for expired sessions
        toast.error('Session expired. Please login again.', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#1A1A1A',
            color: '#fff',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          },
        });
        
        // Reject the request
        return Promise.reject(new Error('Token expired'));
      }
      
      // Add token to header if it exists and is not expired
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors and token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 if user was actually authenticated
    if (error.response?.status === 401) {
      const hadToken = localStorage.getItem('token');
      
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('rememberMe');
      
      // Only show toast and redirect if user actually had a token (was logged in)
      if (hadToken) {
        // Show toast notification
        toast.error('Session expired. Please login again.', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#1A1A1A',
            color: '#fff',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          },
        });

        // Dispatch custom event for auth state update
        window.dispatchEvent(new Event('auth-expired'));
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    }
    return Promise.reject(error);
  }
);

export default api;