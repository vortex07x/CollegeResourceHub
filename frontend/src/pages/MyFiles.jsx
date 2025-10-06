import { useState, useEffect } from 'react';
import { Upload, FileText, Eye, HardDrive, Grid3x3, List, Download, Edit2, Trash2, Pin } from 'lucide-react';
import { fileService } from '../services/fileService';
import { toast } from 'react-hot-toast';
import EditFileModal from '../components/canvas/EditFileModal';
import FileInfoModal from '../components/canvas/FileInfoModal';

const MyFiles = () => {
  const [activeTab, setActiveTab] = useState('uploads');
  const [viewMode, setViewMode] = useState('grid');
  const [myFiles, setMyFiles] = useState([]);
  const [pinnedFiles, setPinnedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingFile, setEditingFile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setIsLoading(true);

      const [myFilesResponse, pinnedResponse] = await Promise.all([
        fileService.getMyFiles(),
        fileService.getPinnedFiles()
      ]);

      const transformedMyFiles = myFilesResponse.data.map(transformFile);
      const transformedPinnedFiles = pinnedResponse.data.map(transformFile);

      setMyFiles(transformedMyFiles);
      setPinnedFiles(transformedPinnedFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const transformFile = (file) => ({
    id: file.id,
    name: file.file_name,
    title: file.title,
    type: file.file_type.toUpperCase(),
    category: file.category.replace('_', ' '),
    rawCategory: file.category,
    size: formatFileSize(file.file_size),
    uploadDate: formatDate(file.created_at),
    views: file.download_count,
    uploadedBy: file.uploaded_by,
    description: file.description,
    subject: file.subject,
    semester: file.semester,
  });

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFileIcon = (type) => {
    return type === 'PDF' ? '📄' : '📝';
  };

  const handleDelete = async (fileId, tab) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await fileService.deleteFile(fileId);
      toast.success('File deleted successfully');

      if (tab === 'uploads') {
        setMyFiles(prev => prev.filter(f => f.id !== fileId));
      }
      setPinnedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleUnpin = async (fileId) => {
    try {
      await fileService.unpinFile(fileId);
      toast.success('File unpinned');
      setPinnedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Unpin failed:', error);
      toast.error('Failed to unpin file');
    }
  };

  const handleEdit = (file) => {
    setEditingFile(file);
    setShowEditModal(true);
  };

  const handleUpdate = async (fileId, data) => {
    try {
      const response = await fileService.updateFile(fileId, data);
      toast.success('File updated successfully');

      const updatedFile = transformFile(response.data);
      setMyFiles(prev => prev.map(f => f.id === fileId ? updatedFile : f));
      setPinnedFiles(prev => prev.map(f => f.id === fileId ? updatedFile : f));

      setShowEditModal(false);
      setEditingFile(null);
    } catch (error) {
      console.error('Update failed:', error);
      throw new Error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleView = async (file) => {
    try {
      const response = await fileService.getFileInfo(file.id);
      setViewingFile(response.data);
      setShowInfoModal(true);
    } catch (error) {
      console.error('Failed to load file info:', error);
      toast.error('Failed to load file information');
    }
  };

  const handleDownload = async (file) => {
    try {
      toast.loading('Preparing download...', { id: 'download' });
      await fileService.downloadFile(file.id, file.name);
      toast.success('Download started!', { id: 'download' });
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file', { id: 'download' });
    }
  };

  const currentFiles = activeTab === 'uploads' ? myFiles : pinnedFiles;

  const stats = [
    { icon: FileText, label: 'Total Files', value: myFiles.length, color: 'text-purple-500' },
    { icon: Pin, label: 'Pinned Files', value: pinnedFiles.length, color: 'text-yellow-500' },
    { icon: Eye, label: 'Total Downloads', value: myFiles.reduce((sum, f) => sum + f.views, 0), color: 'text-green-500' },
    { icon: HardDrive, label: 'Storage Used', value: calculateTotalSize(), color: 'text-orange-500' },
  ];

  function calculateTotalSize() {
    const totalBytes = myFiles.reduce((sum, f) => {
      const sizeStr = f.size;
      const value = parseFloat(sizeStr);
      if (sizeStr.includes('MB')) return sum + value * 1024 * 1024;
      if (sizeStr.includes('KB')) return sum + value * 1024;
      return sum + value;
    }, 0);
    return formatFileSize(totalBytes);
  }

  return (
    <div className="myfiles-page min-h-screen bg-black pt-20 px-4 sm:px-6 lg:px-8 pb-16">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <h1 className="myfiles-heading text-3xl sm:text-4xl font-bold text-white">My Files</h1>
        </div>

        {/* Stats Cards */}
        <div className="myfiles-stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="myfiles-stat-card bg-[#0A0A0A] border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-purple-500/30 transition-colors"
            >
              <stat.icon size={window.innerWidth < 640 ? 24 : 32} className={`${stat.color} mb-2 sm:mb-3`} />
              <div className="myfiles-stat-value text-2xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="myfiles-stat-label text-xs sm:text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="myfiles-tabs flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`myfiles-tab px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all ${activeTab === 'uploads'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
              }`}
          >
            <Upload size={16} className="inline mr-2" />
            Your Uploads ({myFiles.length})
          </button>
          <button
            onClick={() => setActiveTab('pinned')}
            className={`myfiles-tab px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all ${activeTab === 'pinned'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
              }`}
          >
            <Pin size={16} className="inline mr-2" />
            Pinned Files ({pinnedFiles.length})
          </button>
        </div>

        {/* View Toggle */}
        <div className="myfiles-view-toggle flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => setViewMode('grid')}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border rounded-lg transition-all ${viewMode === 'grid'
                ? 'bg-purple-500 border-purple-500 text-white'
                : 'bg-[#1A1A1A] border-white/10 text-gray-400 hover:bg-white/5'
              }`}
          >
            <Grid3x3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center border rounded-lg transition-all ${viewMode === 'list'
                ? 'bg-purple-500 border-purple-500 text-white'
                : 'bg-[#1A1A1A] border-white/10 text-gray-400 hover:bg-white/5'
              }`}
          >
            <List size={16} />
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm sm:text-base">Loading files...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="myfiles-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {currentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="myfiles-file-card bg-[#0A0A0A] border border-white/10 rounded-xl p-4 sm:p-5 hover:border-purple-500 hover:-translate-y-1 transition-all duration-300 group"
                  >
                    {/* File Icon */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                      <span className="text-2xl sm:text-3xl">{getFileIcon(file.type)}</span>
                    </div>

                    {/* File Name */}
                    <h3 className="text-white font-semibold text-sm sm:text-base mb-2 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                      {file.title}
                    </h3>

                    {/* File Meta */}
                    <div className="space-y-1 mb-3 sm:mb-4 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <span>📄</span>
                        <span>{file.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💾</span>
                        <span>{file.size}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{file.uploadDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>👁️</span>
                        <span>{file.views} downloads</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(file)}
                        className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                      >
                        <Download size={12} />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                      <button
                        onClick={() => handleView(file)}
                        className="w-8 h-8 sm:w-9 sm:h-9 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
                        title="View Info"
                      >
                        <Eye size={14} />
                      </button>
                      {activeTab === 'uploads' ? (
                        <>
                          <button
                            onClick={() => handleEdit(file)}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(file.id, 'uploads')}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-white/5 border border-white/10 text-red-400 rounded-lg hover:bg-red-500/10 hover:border-red-500/30 transition-colors flex items-center justify-center"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUnpin(file.id)}
                          className="w-8 h-8 sm:w-9 sm:h-9 bg-white/5 border border-white/10 text-yellow-400 rounded-lg hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-colors flex items-center justify-center"
                          title="Unpin"
                        >
                          <Pin size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="myfiles-list bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
                {/* Table Header - Hidden on Mobile */}
                <div className="hidden lg:grid myfiles-list-header bg-[#1A1A1A] px-6 py-4 grid-cols-[2fr_1fr_1fr_1fr_1fr_140px] gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div>File Name</div>
                  <div>Type</div>
                  <div>Size</div>
                  <div>Upload Date</div>
                  <div>Downloads</div>
                  <div className="text-center">Actions</div>
                </div>

                {/* Table Rows */}
                {currentFiles.map((file, index) => (
                  <div
                    key={file.id}
                    className={`myfiles-list-row px-4 sm:px-6 py-4 hover:bg-white/[0.02] transition-colors ${
                      index !== currentFiles.length - 1 ? 'border-b border-white/5' : ''
                    }`}
                  >
                    {/* Mobile Layout */}
                    <div className="lg:hidden space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">{getFileIcon(file.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-white font-medium text-sm block truncate">{file.title}</span>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            <span>{file.type}</span>
                            <span>•</span>
                            <span>{file.size}</span>
                            <span>•</span>
                            <span>{file.views} downloads</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{file.uploadDate}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(file)}
                          className="flex-1 h-9 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-1 text-xs"
                          title="Download"
                        >
                          <Download size={14} />
                          Download
                        </button>
                        <button
                          onClick={() => handleView(file)}
                          className="w-9 h-9 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
                          title="View Info"
                        >
                          <Eye size={14} />
                        </button>
                        {activeTab === 'uploads' ? (
                          <>
                            <button
                              onClick={() => handleEdit(file)}
                              className="w-9 h-9 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(file.id, 'uploads')}
                              className="w-9 h-9 bg-white/5 border border-white/10 text-red-400 rounded-lg hover:bg-red-500/10 hover:border-red-500/30 transition-colors flex items-center justify-center"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleUnpin(file.id)}
                            className="w-9 h-9 bg-white/5 border border-white/10 text-yellow-400 rounded-lg hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-colors flex items-center justify-center"
                            title="Unpin"
                          >
                            <Pin size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_140px] gap-4 items-center">
                      {/* File Name with Icon */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">{getFileIcon(file.type)}</span>
                        </div>
                        <span className="text-white font-medium text-sm truncate">{file.title}</span>
                      </div>

                      {/* Type */}
                      <div className="text-gray-400 text-sm">{file.type}</div>

                      {/* Size */}
                      <div className="text-gray-400 text-sm">{file.size}</div>

                      {/* Date */}
                      <div className="text-gray-400 text-sm">{file.uploadDate}</div>

                      {/* Downloads */}
                      <div className="text-gray-400 text-sm">{file.views}</div>

                      {/* Actions */}
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDownload(file)}
                          className="w-8 h-8 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => handleView(file)}
                          className="w-8 h-8 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
                          title="View Info"
                        >
                          <Eye size={14} />
                        </button>
                        {activeTab === 'uploads' ? (
                          <>
                            <button
                              onClick={() => handleEdit(file)}
                              className="w-8 h-8 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(file.id, 'uploads')}
                              className="w-8 h-8 bg-white/5 border border-white/10 text-red-400 rounded-lg hover:bg-red-500/10 hover:border-red-500/30 transition-colors flex items-center justify-center"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleUnpin(file.id)}
                            className="w-8 h-8 bg-white/5 border border-white/10 text-yellow-400 rounded-lg hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-colors flex items-center justify-center"
                            title="Unpin"
                          >
                            <Pin size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {currentFiles.length === 0 && (
              <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-8 sm:p-16 text-center">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  {activeTab === 'uploads' ? (
                    <FileText size={window.innerWidth < 640 ? 32 : 48} className="text-purple-500" />
                  ) : (
                    <Pin size={window.innerWidth < 640 ? 32 : 48} className="text-yellow-500" />
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
                  {activeTab === 'uploads' ? 'No files uploaded yet' : 'No pinned files'}
                </h3>
                <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                  {activeTab === 'uploads'
                    ? 'Start uploading your academic resources to share with others'
                    : 'Pin files from Browse page for quick access'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      <EditFileModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingFile(null);
        }}
        onUpdate={handleUpdate}
        fileData={editingFile}
      />

      {/* Info Modal */}
      <FileInfoModal
        isOpen={showInfoModal}
        onClose={() => {
          setShowInfoModal(false);
          setViewingFile(null);
        }}
        fileInfo={viewingFile}
        isAuthenticated={true}  // Add this line - user is always authenticated on My Files page
      />
    </div>
  );
};

export default MyFiles;