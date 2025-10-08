import axios from 'axios';
import { toast } from 'react-hot-toast';

// Use environment variable or fallback to production URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://collegeresourcehub.onrender.com/api';

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 60000, // ✅ Increased to 60 seconds for cold starts
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

// Response interceptor for handling errors, token expiration, and retries
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // ✅ Handle timeout errors with retry logic (for cold starts)
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      config._retryCount = config._retryCount || 0;

      // Retry up to 2 times for timeouts
      if (config._retryCount < 2) {
        config._retryCount += 1;
        
        console.log(`⏳ Server is starting up... Retry attempt ${config._retryCount}/2`);
        
        // Show user-friendly message on first retry
        if (config._retryCount === 1) {
          toast.loading('Server is waking up, please wait...', { 
            id: 'cold-start',
            duration: 10000 
          });
        }
        
        // Wait before retry (5 seconds)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Retry the request
        return api(config);
      } else {
        // Max retries reached
        toast.error('Server is taking longer than expected. Please try again.', { 
          id: 'cold-start' 
        });
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      
      // Don't show duplicate error if we already showed cold-start message
      if (error.code !== 'ECONNABORTED') {
        toast.error('Network error. Please check your connection.', {
          duration: 4000,
          position: 'top-right',
        });
      }
      
      return Promise.reject(error);
    }

    // Log error details
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });

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