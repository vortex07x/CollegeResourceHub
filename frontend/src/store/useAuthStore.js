import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: authService.getStoredUser(),
      isAuthenticated: authService.isAuthenticated(),
      isLoading: false,
      error: null,
      serverWarmupStatus: 'idle', // 'idle', 'warming', 'ready', 'error'
      serverRetryCount: 0,

      login: async (credentials, rememberMe = false) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials, rememberMe);
          
          if (!response.success) {
            throw new Error(response.message || 'Login failed');
          }
          
          const userData = response?.data?.user || response?.user;
          const token = response?.data?.token || response?.token;
          
          if (!userData || !token) {
            throw new Error('Invalid response structure from server');
          }
          
          set({ 
            user: userData, 
            isAuthenticated: true, 
            isLoading: false 
          });
          return response;
        } catch (error) {
          const errorMessage = error.message || error.error || 'Login failed';
          set({ 
            error: errorMessage, 
            isLoading: false,
            isAuthenticated: false,
            user: null
          });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(userData);
          
          if (!response.success) {
            throw new Error(response.message || 'Registration failed');
          }
          
          const user = response?.data?.user || response?.user;
          const token = response?.data?.token || response?.token;
          
          if (!user || !token) {
            throw new Error('Invalid response structure from server');
          }
          
          set({ 
            user: user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          return response;
        } catch (error) {
          const errorMessage = error.message || error.error || 'Registration failed';
          set({ 
            error: errorMessage, 
            isLoading: false,
            isAuthenticated: false,
            user: null
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null 
          });
        } catch (error) {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null 
          });
        }
      },

      handleTokenExpiration: () => {
        authService.logout();
        set({ 
          user: null, 
          isAuthenticated: false,
          error: 'Session expired. Please login again.' 
        });
      },

      updateUser: (userData) => {
        set({ user: userData });
        localStorage.setItem('user', JSON.stringify(userData));
      },

      clearError: () => set({ error: null }),

      checkAuth: () => {
        const isExpired = authService.isTokenExpired();
        const token = authService.getStoredToken();
        const user = authService.getStoredUser();
        
        if (isExpired || !token || !user) {
          set({ user: null, isAuthenticated: false });
        } else {
          set({ user, isAuthenticated: true });
        }
      },

      // Server warmup state management
      setServerWarmupStatus: (status) => {
        set({ serverWarmupStatus: status });
      },

      setServerRetryCount: (count) => {
        set({ serverRetryCount: count });
      },

      resetServerWarmup: () => {
        set({ serverWarmupStatus: 'idle', serverRetryCount: 0 });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('auth-expired', () => {
    useAuthStore.getState().handleTokenExpiration();
  });
}

export default useAuthStore;