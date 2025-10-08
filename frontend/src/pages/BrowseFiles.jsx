import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ZoomIn, ZoomOut, MapPin, Grid3x3, Upload, Move, Loader, X, AlertCircle, RefreshCw } from 'lucide-react';
import useFileStore from '../store/useFileStore';
import useAuthStore from '../store/useAuthStore';
import FileCard from '../components/canvas/FileCard';
import Sidebar from '../components/sidebar/Sidebar';
import MiniMap from '../components/canvas/MiniMap';
import UploadModal from '../components/canvas/UploadModal';
import { fileService } from '../services/fileService';
import { toast } from 'react-hot-toast';

const BrowseFiles = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { currentMode, setMode, filters, setSearchQuery } = useFileStore();

  // Set initial zoom based on screen size
  const getInitialZoom = () => {
    return window.innerWidth <= 768 ? 0.5 : 1;
  };

  const [zoom, setZoom] = useState(getInitialZoom());
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadPosition, setUploadPosition] = useState({ x: 200, y: 200 });
  const [allFiles, setAllFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWakingUp, setIsWakingUp] = useState(false); // ✅ Cold start indicator
  const [loadError, setLoadError] = useState(null); // ✅ Error state
  const [hasShownWelcomeToast, setHasShownWelcomeToast] = useState(false);
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Show welcome toast for logged-out users (only once per session)
  useEffect(() => {
    if (!isAuthenticated && !hasShownWelcomeToast && !isLoading && !loadError) {
      toast('Login to unlock uploading, downloading, and organizing files!', {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#1A1A1A',
          color: '#fff',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
        },
      });
      setHasShownWelcomeToast(true);
    }
  }, [isAuthenticated, hasShownWelcomeToast, isLoading, loadError]);

  useEffect(() => {
    loadFiles();

    // Handle window resize to adjust zoom
    const handleResize = () => {
      const newZoom = window.innerWidth <= 768 ? 0.5 : 1;
      setZoom(newZoom);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setIsWakingUp(true); // ✅ Show waking up indicator
      
      const response = await fileService.getAllFiles();

      const transformedFiles = response.data.map(file => ({
        id: file.id,
        name: file.file_name,
        title: file.title,
        type: file.file_type,
        category: file.category.replace('_', ' '),
        rawCategory: file.category,
        size: formatFileSize(file.file_size),
        uploadedBy: file.uploaded_by,
        uploadDate: formatDate(file.created_at),
        rawDate: new Date(file.created_at),
        position: { x: parseFloat(file.position_x) || 0, y: parseFloat(file.position_y) || 0 },
        description: file.description,
        subject: file.subject,
        semester: file.semester,
        downloadCount: file.download_count,
      }));

      setAllFiles(transformedFiles);
      setIsWakingUp(false);
    } catch (error) {
      console.error('Failed to load files:', error);
      setIsWakingUp(false);
      
      // ✅ Handle different error types
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

  const filteredFiles = useMemo(() => {
    let filtered = [...allFiles];

    if (filters.fileType !== 'all') {
      filtered = filtered.filter(file => file.type === filters.fileType);
    }

    if (filters.category !== 'all') {
      const categoryMap = {
        'assignment': 'assignment',
        'question-paper': 'question_paper',
        'syllabus': 'syllabus',
        'notes': 'notes',
        'other': 'other'
      };
      filtered = filtered.filter(file => file.rawCategory === categoryMap[filters.category]);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(file => {
        const fileDate = file.rawDate;
        const diffTime = now - fileDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        switch (filters.dateRange) {
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          case 'year':
            return diffDays <= 365;
          default:
            return true;
        }
      });
    }

    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(file =>
        file.title.toLowerCase().includes(query) ||
        file.name.toLowerCase().includes(query) ||
        file.category.toLowerCase().includes(query) ||
        file.subject?.toLowerCase().includes(query) ||
        file.description?.toLowerCase().includes(query) ||
        file.uploadedBy.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allFiles, filters]);

  const formatFileSize = (bytes) => {
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
    return date.toLocaleDateString();
  };

  const getRandomPosition = () => {
    const canvasWidth = canvasRef.current?.clientWidth || 1200;
    const canvasHeight = canvasRef.current?.clientHeight || 800;
    return {
      x: Math.random() * (canvasWidth - 300) + 100,
      y: Math.random() * (canvasHeight - 300) + 100,
    };
  };

  useEffect(() => {
    if (currentMode === 'upload') {
      if (!isAuthenticated) {
        toast.error('Please login to upload files');
        navigate('/login');
        setMode('browse');
        return;
      }
      setUploadPosition(getRandomPosition());
      setIsUploadModalOpen(true);
    }
  }, [currentMode, isAuthenticated, navigate, setMode]);

  const handleFileUpload = async (formData) => {
    if (!isAuthenticated) {
      toast.error('Please login to upload files');
      navigate('/login');
      return;
    }

    try {
      const response = await fileService.uploadFile(formData);

      const uploadedFile = {
        id: response.data.id,
        name: response.data.file_name,
        title: response.data.title,
        type: response.data.file_type,
        category: response.data.category.replace('_', ' '),
        rawCategory: response.data.category,
        size: formatFileSize(response.data.file_size),
        uploadedBy: response.data.uploaded_by,
        uploadDate: 'Just now',
        rawDate: new Date(),
        position: {
          x: parseFloat(response.data.position_x) || 0,
          y: parseFloat(response.data.position_y) || 0
        },
        description: response.data.description,
        subject: response.data.subject,
        semester: response.data.semester,
        downloadCount: 0,
      };

      setAllFiles(prev => [...prev, uploadedFile]);
      toast.success('File uploaded successfully!');
      setMode('browse');
    } catch (error) {
      console.error('Upload error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        throw new Error(error.response?.data?.message || 'Upload failed');
      }
    }
  };

  const handleModalClose = () => {
    setIsUploadModalOpen(false);
    setMode('browse');
  };

  // Mouse handlers (for Browse mode - canvas dragging)
  const handleMouseDown = useCallback((e) => {
    if (currentMode === 'browse' && !e.target.closest('.file-card')) {
      e.preventDefault();
      setIsDragging(true);
      isDraggingRef.current = true;
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
    }
  }, [currentMode, pan.x, pan.y]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const handleResetView = () => {
    const defaultZoom = window.innerWidth <= 768 ? 0.5 : 1;
    setZoom(defaultZoom);
    setPan({ x: 0, y: 0 });
  };

  const handleFilePositionUpdate = async (fileId, newPosition) => {
    if (!isAuthenticated) {
      toast.error('Please login to organize files');
      return;
    }

    try {
      setAllFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId ? { ...file, position: newPosition } : file
        )
      );

      await fileService.updateFilePosition(fileId, newPosition);
    } catch (error) {
      console.error('Failed to update position:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error('Failed to save position');
      }
      loadFiles();
    }
  };

  // Non-passive touch event listeners for Browse mode canvas dragging
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const touchStartHandler = (e) => {
      if (currentMode === 'browse' && !e.target.closest('.file-card')) {
        const touch = e.touches[0];
        setIsDragging(true);
        isDraggingRef.current = true;
        setDragStart({
          x: touch.clientX - pan.x,
          y: touch.clientY - pan.y,
        });
      }
    };

    const touchMoveHandler = (e) => {
      if (isDraggingRef.current && currentMode === 'browse') {
        e.preventDefault();
        const touch = e.touches[0];
        const newX = touch.clientX - dragStart.x;
        const newY = touch.clientY - dragStart.y;
        setPan({ x: newX, y: newY });
      }
    };

    const touchEndHandler = () => {
      setIsDragging(false);
      isDraggingRef.current = false;
    };

    canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
    canvas.addEventListener('touchend', touchEndHandler, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', touchStartHandler);
      canvas.removeEventListener('touchmove', touchMoveHandler);
      canvas.removeEventListener('touchend', touchEndHandler);
    };
  }, [currentMode, pan.x, pan.y, dragStart.x, dragStart.y]);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDraggingRef.current && currentMode === 'browse') {
        e.preventDefault();
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPan({ x: newX, y: newY });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      isDraggingRef.current = false;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart.x, dragStart.y, currentMode]);

  return (
    <div className="browse-page-container min-h-screen bg-black pt-16">
      <Sidebar allFiles={allFiles} />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={handleModalClose}
        onUpload={handleFileUpload}
        uploadPosition={uploadPosition}
      />

      {/* Top Control Bar */}
      <div className="browse-control-bar fixed top-16 left-0 right-0 h-16 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-8 z-[95] gap-4">
        {/* Search Bar */}
        <div className="browse-search-container relative flex-1 max-w-4xl">
          <Search size={18} className="browse-search-icon absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files, assignments, papers..."
            className="browse-search-input w-full h-10 pl-12 pr-10 bg-[#1A1A1A] border border-white/10 rounded-full text-white text-sm placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="browse-search-clear absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-all"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* View Controls */}
        <div className="browse-view-controls flex items-center gap-3 flex-shrink-0">
          {/* Zoom Controls */}
          <div className="browse-zoom-controls flex items-center gap-2 bg-[#1A1A1A] border border-white/10 rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="browse-zoom-button w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <div className="browse-zoom-display w-16 text-center text-sm text-gray-400 font-medium">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={handleZoomIn}
              className="browse-zoom-button w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
          </div>

          {/* Reset View */}
          <button
            onClick={handleResetView}
            className="browse-reset-button px-4 h-9 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm font-medium hover:bg-white/5 transition-colors"
          >
            Reset View
          </button>

          {/* Mini Map Toggle */}
          <button
            onClick={() => setShowMiniMap(!showMiniMap)}
            className={`browse-minimap-toggle w-9 h-9 flex items-center justify-center border rounded-lg transition-colors ${showMiniMap
              ? 'bg-purple-500 border-purple-500 text-white'
              : 'bg-[#1A1A1A] border-white/10 text-white hover:bg-white/5'
              }`}
            title="Toggle Mini Map"
          >
            <MapPin size={18} />
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        className={`browse-canvas-container h-[calc(100vh-8rem)] relative overflow-hidden select-none ${isDragging && currentMode === 'browse' ? 'cursor-grabbing' : currentMode === 'browse' ? 'cursor-grab' : 'cursor-default'
          }`}
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(255,255,255,0.15) 1.5px, transparent 1.5px)
          `,
          backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          touchAction: currentMode === 'browse' ? 'none' : 'auto',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      >
        {/* ✅ Loading State with Cold Start Message */}
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
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
                <p className="text-white font-medium">Loading files...</p>
              )}
            </div>
          </div>
        ) : loadError ? (
          // ✅ Error State with Retry
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                {loadError === 'timeout' ? 'Server Starting Up' : 'Failed to Load Files'}
              </h3>
              <p className="text-gray-400 mb-6">
                {loadError === 'timeout' 
                  ? 'The server needs more time to wake up. This happens after periods of inactivity on the free hosting tier.' 
                  : 'Unable to fetch files right now. Please check your connection and try again.'}
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
        ) : (
          <>
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                willChange: isDragging ? 'transform' : 'auto',
              }}
              className="absolute inset-0"
            >
              {filteredFiles.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="browse-empty-icon w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload size={48} className="text-gray-600" />
                    </div>
                    <h3 className="browse-empty-title text-xl font-semibold text-white mb-2">
                      {allFiles.length === 0 ? 'No files yet' : 'No files found'}
                    </h3>
                    <p className="browse-empty-description text-gray-400 mb-4">
                      {allFiles.length === 0
                        ? 'Upload your first file to get started'
                        : 'Try adjusting your filters or search query'}
                    </p>
                    {allFiles.length === 0 && (
                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast.error('Please login to upload files');
                            navigate('/login');
                          } else {
                            setMode('upload');
                          }
                        }}
                        className="browse-empty-button px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                      >
                        Upload File
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    mode={currentMode}
                    zoom={zoom}
                    onPositionUpdate={handleFilePositionUpdate}
                    onPinToggle={(fileId, isPinned) => { }}
                    isAuthenticated={isAuthenticated}
                  />
                ))
              )}
            </div>

            {/* Mode Indicator */}
            <div className="browse-mode-indicator absolute top-20 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#0A0A0A]/90 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-3 pointer-events-none z-10">
              {currentMode === 'browse' && (
                <>
                  <Grid3x3 size={18} className="browse-mode-icon text-purple-500" />
                  <span className="browse-mode-text text-white font-medium">Browse Mode</span>
                  {(filters.fileType !== 'all' || filters.category !== 'all' || filters.dateRange !== 'all' || filters.searchQuery) && (
                    <span className="browse-mode-count text-purple-400 text-sm">
                      ({filteredFiles.length} of {allFiles.length})
                    </span>
                  )}
                </>
              )}
              {currentMode === 'upload' && (
                <>
                  <Upload size={18} className="browse-mode-icon text-blue-500" />
                  <span className="browse-mode-text text-white font-medium">Upload Mode</span>
                </>
              )}
              {currentMode === 'organize' && (
                <>
                  <Move size={18} className="browse-mode-icon text-green-500" />
                  <span className="browse-mode-text text-white font-medium">Organize Mode</span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mini Map */}
      {showMiniMap && !isLoading && !loadError && filteredFiles.length > 0 && (
        <MiniMap
          files={filteredFiles}
          viewportPan={pan}
          viewportZoom={zoom}
          canvasSize={{ width: 2000, height: 1500 }}
        />
      )}
    </div>
  );
};

export default BrowseFiles;