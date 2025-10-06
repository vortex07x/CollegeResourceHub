import api from './api';

export const authService = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data && response.data.success) {
        const token = response.data.data?.token || response.data.token;
        const user = response.data.data?.user || response.data.user;
        
        if (token && user) {
          const expiryTime = Date.now() + (30 * 60 * 1000);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('tokenExpiry', expiryTime.toString());
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration service error:', error);
      
      if (error.response?.data) {
        throw error.response.data;
      } else if (error.message) {
        throw { success: false, message: error.message };
      } else {
        throw { success: false, message: 'Registration failed. Please try again.' };
      }
    }
  },

  login: async (credentials, rememberMe = false) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data && response.data.success) {
        const token = response.data.data?.token || response.data.token;
        const user = response.data.data?.user || response.data.user;
        
        if (token && user) {
          const expiryDays = rememberMe ? 30 : 7;
          const expiryTime = Date.now() + (expiryDays * 24 * 60 * 60 * 1000);
          
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('tokenExpiry', expiryTime.toString());
          localStorage.setItem('rememberMe', rememberMe.toString());
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Login service error:', error);
      
      if (error.response?.data) {
        throw error.response.data;
      } else if (error.message) {
        throw { success: false, message: error.message };
      } else {
        throw { success: false, message: 'Login failed. Please try again.' };
      }
    }
  },

  logout: async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('rememberMe');
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      
      if (error.response?.data) {
        throw error.response.data;
      } else {
        throw { success: false, message: 'Failed to fetch profile' };
      }
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      if (response.data && response.data.success) {
        const updatedUser = response.data.data?.profile || response.data.profile;
        if (updatedUser) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.response?.data) {
        throw error.response.data;
      } else {
        throw { success: false, message: 'Failed to update profile' };
      }
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error.response?.data) {
        throw error.response.data;
      } else {
        throw { success: false, message: 'Failed to send OTP' };
      }
    }
  },

  verifyOTP: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      
      if (error.response?.data) {
        throw error.response.data;
      } else {
        throw { success: false, message: 'Invalid OTP' };
      }
    }
  },

  resetPassword: async (email, otp, password) => {
    try {
      const response = await api.post('/auth/reset-password', { email, otp, password });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.response?.data) {
        throw error.response.data;
      } else {
        throw { success: false, message: 'Failed to reset password' };
      }
    }
  },

  isTokenExpired: () => {
    const expiryTime = localStorage.getItem('tokenExpiry');
    if (!expiryTime) return true;
    return Date.now() > parseInt(expiryTime);
  },

  getStoredUser: () => {
    try {
      if (authService.isTokenExpired()) {
        authService.logout();
        return null;
      }
      
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  },

  getStoredToken: () => {
    if (authService.isTokenExpired()) {
      authService.logout();
      return null;
    }
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const isExpired = authService.isTokenExpired();
    
    if (isExpired) {
      authService.logout();
      return false;
    }
    
    return !!(token && user);
  },

  getTimeUntilExpiry: () => {
    const expiryTime = localStorage.getItem('tokenExpiry');
    if (!expiryTime) return 0;
    
    const remaining = parseInt(expiryTime) - Date.now();
    return Math.max(0, remaining);
  }
};

export default authService;