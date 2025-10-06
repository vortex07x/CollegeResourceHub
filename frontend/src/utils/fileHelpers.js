export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const getFileIcon = (fileType) => {
  const icons = {
    pdf: '📄',
    docx: '📝',
    doc: '📝',
    default: '📎',
  };
  return icons[fileType?.toLowerCase()] || icons.default;
};

export const validateFileType = (file) => {
  const allowedTypes = ['.pdf', '.docx', '.doc'];
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  return allowedTypes.includes(extension);
};

export const validateFileSize = (file) => {
  const maxSize = import.meta.env.VITE_UPLOAD_MAX_SIZE || 10485760; // 10MB
  return file.size <= maxSize;
};