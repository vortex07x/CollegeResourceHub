import api from './api';

export const fileService = {
  // Get all files
  getAllFiles: async (filters = {}) => {
    const response = await api.get('/files', { params: filters });
    return response.data;
  },

  // Get user's files
  getMyFiles: async () => {
    const response = await api.get('/files/my-files');
    return response.data;
  },

  // Get pinned files
  getPinnedFiles: async () => {
    const response = await api.get('/files/pinned');
    return response.data;
  },

  // Get top downloaded files (public endpoint)
  getTopDownloadedFiles: async () => {
    const response = await api.get('/files/top-downloaded');
    return response.data;
  },

  // Pin a file
  pinFile: async (fileId) => {
    const response = await api.post(`/files/${fileId}/pin`);
    return response.data;
  },

  // Unpin a file
  unpinFile: async (fileId) => {
    const response = await api.post(`/files/${fileId}/unpin`);
    return response.data;
  },

  // Check pin status
  checkPinStatus: async (fileId) => {
    const response = await api.get(`/files/${fileId}/pin-status`);
    return response.data;
  },

  // Upload file
  uploadFile: async (formData) => {
    const response = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Update file
  updateFile: async (fileId, data) => {
    const response = await api.put(`/files/${fileId}`, data);
    return response.data;
  },

  // Download file
  downloadFile: async (fileId, fileName) => {
    try {
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // Get file info
  getFileInfo: async (fileId) => {
    const response = await api.get(`/files/${fileId}/info`);
    return response.data;
  },

  // Delete file
  deleteFile: async (fileId) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },

  // Update file position (for canvas)
  updateFilePosition: async (fileId, position) => {
    const response = await api.patch(`/files/${fileId}/position`, {
      position_x: position.x,
      position_y: position.y
    });
    return response.data;
  },

  // Convert file (PDF to DOCX or DOCX to PDF)
  convertFile: async (fileId, conversionType) => {
    const response = await api.post(`/files/${fileId}/convert`, {
      conversion_type: conversionType
    });
    return response.data;
  },

  // Download converted file (temporary file)
  downloadConvertedFile: async (tempFilePath, fileName) => {
    try {
      const response = await api.get('/files/download-converted', {
        params: { file_path: tempFilePath },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // Save converted file permanently
  saveConvertedFile: async (originalFileId, tempFilePath) => {
    const response = await api.post(`/files/${originalFileId}/save-converted`, {
      temp_file_path: tempFilePath
    });
    return response.data;
  },

  // NEW: Clean up temporary converted file
  cleanupTempFile: async (tempFilePath) => {
    const response = await api.post('/files/cleanup-temp', {
      temp_file_path: tempFilePath
    });
    return response.data;
  },
};

export default fileService;