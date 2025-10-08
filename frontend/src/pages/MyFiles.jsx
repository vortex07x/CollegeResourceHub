import { useState, useEffect } from 'react';
import { Upload, FileText, Eye, HardDrive, Grid3x3, List, Download, Edit2, Trash2, Pin, AlertCircle, RefreshCw, Loader } from 'lucide-react';
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
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [loadError, setLoadError] = useState(null);
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
      setLoadError(null);
      setIsWakingUp(true);

      const [myFilesResponse, pinnedResponse] = await Promise.all([
        fileService.getMyFiles(),
        fileService.getPinnedFiles()
      ]);

      const transformedMyFiles = myFilesResponse.data.map(transformFile);
      const transformedPinnedFiles = pinnedResponse.data.map(transformFile);

      setMyFiles(transformedMyFiles);
      setPinnedFiles(transformedPinnedFiles);
      setIsWakingUp(false);
    } catch (error) {
      console.error('Failed to load files:', error);
      setIsWakingUp(false);

      if (error.code === 'ECONNABORTED') {
        setLoadError('timeout');
        toast.error('Server is taking longer than expected. Please try refreshing.', {
          duration: 6000,
          position: 'top-center',
        });
      } else {
        setLoadError('general');
        toast.error('Failed to load files');
      }
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

  const handleDownload = async (file) => {
    try {
      await fileService.downloadFile(file.id, file.name);
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  const handleEdit = (file) => {
    setEditingFile(file);
    setShowEditModal(true);
  };

  const handleEditSave = async (updatedData) => {
    try {
      await fileService.updateFile(editingFile.id, updatedData);
      toast.success('File updated successfully');
      setShowEditModal(false);
      loadFiles();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update file');
    }
  };

  const handleViewInfo = (file) => {
    setViewingFile(file);
    setShowInfoModal(true);
  };

  const handlePin = async (fileId) => {
    try {
      await fileService.pinFile(fileId);
      toast.success('File pinned successfully');
      loadFiles();
    } catch (error) {
      console.error('Pin failed:', error);
      toast.error('Failed to pin file');
    }
  };

  const handleUnpin = async (fileId) => {
    try {
      await fileService.unpinFile(fileId);
      toast.success('File unpinned successfully');
      loadFiles();
    } catch (error) {
      console.error('Unpin failed:', error);
      toast.error('Failed to unpin file');
    }
  };

  const displayFiles = activeTab === 'uploads' ? myFiles : pinnedFiles;

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pt-16 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="text-purple-500 animate-spin mx-auto mb-4" />
          {isWakingUp ? (
            <div className="space-y-2">
              <p className="text-white font-medium text-lg">Server is waking up...</p>
              <p className="text-gray-400 text-sm max-w-md">
                This may take up to 60 seconds on first load. Please be patient.
              </p>
            </div>
          ) : (
            <p className="text-white font-medium">Loading your files...</p>
          )}
        </div>
      </div>
    );
  }

  // Error State
  if (loadError) {
    return (
      <div className="min-h-screen bg-black pt-16 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            {loadError === 'timeout' ? 'Server Starting Up' : 'Failed to Load Files'}
          </h3>
          <p className="text-gray-400 mb-6">
            {loadError === 'timeout'
              ? 'The server needs more time to wake up. This happens after periods of inactivity.'
              : 'Unable to fetch your files right now. Please check your connection and try again.'}
          </p>
          <button
            onClick={loadFiles}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={18} />
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Files</h1>
          <p className="text-gray-400">Manage your uploaded files and pinned resources</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Upload className="text-purple-400" size={24} />
              <span className="text-3xl font-bold text-white">{myFiles.length}</span>
            </div>
            <p className="text-gray-400 text-sm">Total Uploads</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Pin className="text-blue-400" size={24} />
              <span className="text-3xl font-bold text-white">{pinnedFiles.length}</span>
            </div>
            <p className="text-gray-400 text-sm">Pinned Files</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="text-green-400" size={24} />
              <span className="text-3xl font-bold text-white">
                {myFiles.reduce((total, file) => {
                  const sizeMatch = file.size.match(/[\d.]+/);
                  const sizeValue = sizeMatch ? parseFloat(sizeMatch[0]) : 0;
                  return total + (file.size.includes('MB') ? sizeValue : sizeValue / 1024);
                }, 0).toFixed(2)} MB
              </span>
            </div>
            <p className="text-gray-400 text-sm">Total Storage</p>
          </div>
        </div>

        {/* Tabs and View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 bg-[#0A0A0A] border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('uploads')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'uploads'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              My Uploads
            </button>
            <button
              onClick={() => setActiveTab('pinned')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'pinned'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              Pinned
            </button>
          </div>

          <div className="flex items-center gap-2 bg-[#0A0A0A] border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${viewMode === 'grid'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              <Grid3x3 size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all ${viewMode === 'list'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Files Display */}
        {displayFiles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={48} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {activeTab === 'uploads' ? 'No uploaded files yet' : 'No pinned files yet'}
            </h3>
            <p className="text-gray-400">
              {activeTab === 'uploads'
                ? 'Upload your first file to get started'
                : 'Pin files from the browse page to save them here'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayFiles.map((file) => (
              <div
                key={file.id}
                className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-2xl">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeTab === 'uploads' ? (
                      <button
                        onClick={() => handlePin(file.id)}
                        className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                        title="Pin file"
                      >
                        <Pin size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnpin(file.id)}
                        className="p-2 text-purple-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Unpin file"
                      >
                        <Pin size={16} className="fill-current" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                  {file.title}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Type</span>
                    <span className="text-gray-300">{file.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Size</span>
                    <span className="text-gray-300">{file.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Downloads</span>
                    <span className="text-gray-300">{file.views}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Uploaded</span>
                    <span className="text-gray-300">{file.uploadDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleViewInfo(file)}
                    className="flex-1 px-3 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(file)}
                    className="flex-1 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>

                {activeTab === 'uploads' && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(file)}
                      className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(file.id, 'uploads')}
                      className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">File</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Size</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Downloads</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Uploaded</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getFileIcon(file.type)}</div>
                        <div>
                          <p className="text-white font-medium">{file.title}</p>
                          <p className="text-gray-400 text-sm">{file.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{file.type}</td>
                    <td className="px-6 py-4 text-gray-300">{file.size}</td>
                    <td className="px-6 py-4 text-gray-300">{file.views}</td>
                    <td className="px-6 py-4 text-gray-300">{file.uploadDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewInfo(file)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                          title="View info"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                          title="Download"
                        >
                          <Download size={18} />
                        </button>
                        {activeTab === 'uploads' ? (
                          <>
                            <button
                              onClick={() => handleEdit(file)}
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(file.id, 'uploads')}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleUnpin(file.id)}
                            className="p-2 text-purple-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Unpin"
                          >
                            <Pin size={18} className="fill-current" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditModal && editingFile && (
        <EditFileModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingFile(null);
          }}
          onUpdate={handleEditSave}
          fileData={editingFile}
        />
      )}

      {showInfoModal && viewingFile && (
        <FileInfoModal
          isOpen={showInfoModal}
          onClose={() => {
            setShowInfoModal(false);
            setViewingFile(null);
          }}
          fileInfo={viewingFile}
          isAuthenticated={true}
        />
      )}
    </div>
  );
};

export default MyFiles;