import { X, FileText, File, Calendar, User, FolderOpen, Download, Eye, HardDrive, School, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { fileService } from '../../services/fileService';
import { toast } from 'react-hot-toast';

const FileInfoModal = ({ isOpen, onClose, fileInfo, isAuthenticated }) => {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !fileInfo) return null;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const getCategoryLabel = (category) => {
    const labels = {
      assignment: 'Assignment',
      question_paper: 'Question Paper',
      syllabus: 'Syllabus',
      notes: 'Notes',
      other: 'Other'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category) => {
    const colors = {
      assignment: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      question_paper: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      syllabus: 'bg-green-500/10 text-green-400 border-green-500/20',
      notes: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      other: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    };
    return colors[category] || colors.other;
  };

  // Normalize file data to ensure all required fields are present
  const normalizeFileData = () => {
    const file = fileInfo;
    
    return {
      id: file.id,
      title: file.title,
      file_name: file.file_name || file.name || '',
      file_type: (file.file_type || file.type || '').toLowerCase(),
      file_size: file.file_size || 0,
      category: file.category || file.rawCategory || 'other',
      subject: file.subject || 'N/A',
      semester: file.semester || 'N/A',
      description: file.description || '',
      uploaded_by: file.uploaded_by || file.uploadedBy || 'Unknown',
      uploader_email: file.uploader_email || 'N/A',
      uploader_college: file.uploader_college || '',
      created_at: file.created_at || new Date().toISOString(),
      download_count: file.download_count || file.views || 0,
    };
  };

  const normalizedFile = normalizeFileData();

  const handleConvertClick = () => {
    onClose();
    // Pass normalized file data via state AND fileId via URL for direct access
    navigate(`/conversion?fileId=${normalizedFile.id}`, { state: { file: normalizedFile } });
  };

  const handleDownload = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to download files');
      navigate('/login');
      return;
    }

    if (isDownloading) return;

    try {
      setIsDownloading(true);
      toast.loading('Preparing download...', { id: 'download' });

      await fileService.downloadFile(normalizedFile.id, normalizedFile.file_name);

      toast.success('Download started!', { id: 'download' });
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file', { id: 'download' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="modal-container fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="modal-content bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-modalSlideIn">
        <div className="file-info-header relative h-32 bg-gradient-to-br from-purple-500 to-blue-500 p-6 flex items-end">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="file-info-icon w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              {normalizedFile.file_type === 'pdf' ? (
                <FileText size={32} className="text-white" />
              ) : (
                <File size={32} className="text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`file-info-badge px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(normalizedFile.category)}`}>
                  {getCategoryLabel(normalizedFile.category)}
                </span>
                <span className="file-info-badge px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 uppercase">
                  {normalizedFile.file_type}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-body flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
            {normalizedFile.title}
          </h2>

          {normalizedFile.description && (
            <p className="text-gray-400 mb-6 leading-relaxed">
              {normalizedFile.description}
            </p>
          )}

          <div className="file-info-grid grid grid-cols-2 gap-4 mb-6">
            <div className="file-info-card bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="file-info-card-icon w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <FolderOpen size={20} className="text-purple-400" />
                </div>
                <div>
                  <p className="file-info-card-label text-xs text-gray-500 font-medium">Subject</p>
                  <p className="file-info-card-value text-sm font-semibold text-white">{normalizedFile.subject || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="file-info-card bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="file-info-card-icon w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <School size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="file-info-card-label text-xs text-gray-500 font-medium">Semester</p>
                  <p className="file-info-card-value text-sm font-semibold text-white">{normalizedFile.semester || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="file-info-card bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="file-info-card-icon w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <HardDrive size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="file-info-card-label text-xs text-gray-500 font-medium">File Size</p>
                  <p className="file-info-card-value text-sm font-semibold text-white">{formatFileSize(normalizedFile.file_size)}</p>
                </div>
              </div>
            </div>

            <div className="file-info-card bg-[#1A1A1A] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="file-info-card-icon w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Eye size={20} className="text-yellow-400" />
                </div>
                <div>
                  <p className="file-info-card-label text-xs text-gray-500 font-medium">Downloads</p>
                  <p className="file-info-card-value text-sm font-semibold text-white">{normalizedFile.download_count || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <User size={16} className="text-purple-400" />
              Uploader Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Name</span>
                <span className="text-sm font-medium text-white">{normalizedFile.uploaded_by || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Email</span>
                <span className="text-sm font-medium text-white">{normalizedFile.uploader_email || 'N/A'}</span>
              </div>
              {normalizedFile.uploader_college && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">College</span>
                  <span className="text-sm font-medium text-white">{normalizedFile.uploader_college}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Calendar size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Uploaded</p>
                  <p className="text-sm font-semibold text-white">{formatDate(normalizedFile.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Full Date</p>
                <p className="text-xs text-gray-400">{new Date(normalizedFile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-[#0A0A0A]">
          <button
            onClick={onClose}
            className="modal-button px-6 h-11 bg-white/5 border border-white/10 rounded-lg text-white font-medium hover:bg-white/10 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading || !isAuthenticated}
            className={`modal-button px-6 h-11 bg-white/5 border border-white/10 rounded-lg text-white font-medium hover:bg-white/10 transition-colors flex items-center gap-2 ${isDownloading || !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            title={!isAuthenticated ? 'Login to download' : 'Download file'}
          >
            <Download size={18} />
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
          <button
            onClick={handleConvertClick}
            className="modal-button px-6 h-11 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Convert File
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileInfoModal;