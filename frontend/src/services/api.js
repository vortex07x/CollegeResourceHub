import axios from 'axios';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';

// Use environment variable or fallback to production URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://collegeresourcehub.onrender.com/api';

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 60000, // Increased to 60 seconds for cold starts
});

// Global state for cold start detection
let isServerWarming = false;
let warmupListeners = [];

// Function to notify warmup state changes
const notifyWarmupStateChange = (state) => {
  warmupListeners.forEach(listener => listener(state));
  
  // Update Zustand store
  const authStore = useAuthStore.getState();
  if (state.status === 'warming') {
    authStore.setServerWarmupStatus('warming');
    authStore.setServerRetryCount(state.retryCount);
  } else if (state.status === 'ready') {
    authStore.setServerWarmupStatus('ready');
    // Auto-hide after 2 seconds
    setTimeout(() => {
      authStore.resetServerWarmup();
    }, 2000);
  } else if (state.status === 'error') {
    authStore.setServerWarmupStatus('error');
  }
};

// Subscribe to warmup state changes
export const subscribeToWarmupState = (callback) => {
  warmupListeners.push(callback);
  return () => {
    warmupListeners = warmupListeners.filter(listener => listener !== callback);
  };
};

// Health check function
export const checkServerHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Block requests if server is warming up (except health checks)
    if (isServerWarming && !config.url?.includes('health')) {
      return Promise.reject(new Error('Server is warming up'));
    }

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
  (response) => {
    // Reset warmup state on successful response
    if (isServerWarming) {
      isServerWarming = false;
      notifyWarmupStateChange({ status: 'ready', retryCount: 0 });
    }
    return response;
  },
  async (error) => {
    const config = error.config;

    // Handle timeout errors with cold start detection
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      config._retryCount = config._retryCount || 0;

      // First timeout = likely cold start
      if (config._retryCount === 0) {
        isServerWarming = true;
        notifyWarmupStateChange({ status: 'warming', retryCount: 0 });
      }

      // Retry up to 3 times for timeouts
      if (config._retryCount < 3) {
        config._retryCount += 1;
        
        console.log(`⏳ Server warming up... Retry attempt ${config._retryCount}/3`);
        
        // Notify listeners of retry
        notifyWarmupStateChange({ status: 'warming', retryCount: config._retryCount });
        
        // Wait before retry (10 seconds for first retry, 15 for second, 20 for third)
        const waitTime = 10000 + (config._retryCount * 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Retry the request
        try {
          const response = await api(config);
          // Success! Server is ready
          isServerWarming = false;
          notifyWarmupStateChange({ status: 'ready', retryCount: config._retryCount });
          
          // Dismiss any loading toasts
          toast.dismiss('cold-start');
          
          return response;
        } catch (retryError) {
          // Continue to next retry or fail
          if (config._retryCount >= 3) {
            isServerWarming = false;
            notifyWarmupStateChange({ status: 'error', retryCount: config._retryCount });
            toast.dismiss('cold-start');
          }
          return Promise.reject(retryError);
        }
      } else {
        // Max retries reached
        isServerWarming = false;
        notifyWarmupStateChange({ status: 'error', retryCount: config._retryCount });
        toast.dismiss('cold-start');
        toast.error('Server is taking longer than expected. Please refresh the page.', { 
          duration: 6000 
        });
      }
    }

    // Handle network errors with cold start detection
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      
      // Check if it's a cold start scenario
      if (!isServerWarming && error.message !== 'Server is warming up' && error.code !== 'ECONNABORTED') {
        // Could be a cold start - trigger warmup detection
        isServerWarming = true;
        notifyWarmupStateChange({ status: 'warming', retryCount: 0 });
        
        console.log('🔄 Detected potential cold start, retrying in 15 seconds...');
        
        // Retry once after 15 seconds
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        try {
          const response = await api(error.config);
          isServerWarming = false;
          notifyWarmupStateChange({ status: 'ready', retryCount: 1 });
          return response;
        } catch (retryError) {
          isServerWarming = false;
          notifyWarmupStateChange({ status: 'error', retryCount: 1 });
          
          toast.error('Network error. Please check your connection.', {
            duration: 4000,
            position: 'top-right',
          });
          
          return Promise.reject(retryError);
        }
      }
      
      // If already warming or blocked, just reject
      if (error.message !== 'Server is warming up') {
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