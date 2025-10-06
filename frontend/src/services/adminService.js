import api from './api';

export const adminService = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // User Management
  getAllUsers: async (page = 1, limit = 10) => {
    const response = await api.get('/admin/users', {
      params: { page, limit }
    });
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // File Management
  getAllFiles: async (page = 1, limit = 20) => {
    const response = await api.get('/admin/files', {
      params: { page, limit }
    });
    return response.data;
  },

  updateFile: async (fileId, fileData) => {
    const response = await api.put(`/admin/files/${fileId}`, fileData);
    return response.data;
  },

  deleteFile: async (fileId) => {
    const response = await api.delete(`/admin/files/${fileId}`);
    return response.data;
  }
};

export default adminService;