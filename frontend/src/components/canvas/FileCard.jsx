import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, FileText, File, Pin } from 'lucide-react';
import { fileService } from '../../services/fileService';
import { toast } from 'react-hot-toast';
import FileInfoModal from './FileInfoModal';

const FileCard = ({ file, mode, zoom = 1, onPositionUpdate, onPinToggle, isAuthenticated }) => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(file.position);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      checkPinStatus();
    }
  }, [file.id, isAuthenticated]);

  const checkPinStatus = async () => {
    try {
      const response = await fileService.checkPinStatus(file.id);
      setIsPinned(response.data.is_pinned);
    } catch (error) {
      console.error('Failed to check pin status:', error);
    }
  };

  const getFileIcon = (type) => {
    return type === 'pdf' ? FileText : File;
  };

  const getFileIconColor = (type) => {
    return type === 'pdf' 
      ? 'from-red-500 to-red-600' 
      : 'from-blue-500 to-blue-600';
  };

  // Mouse handlers for Organize mode
  const handleMouseDown = (e) => {
    if (mode === 'organize') {
      if (!isAuthenticated) {
        toast.error('Please login to organize files');
        navigate('/login');
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      
      setIsDragging(true);
      isDraggingRef.current = true;
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
      };
      initialPos.current = {
        x: position.x,
        y: position.y,
      };
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to download files');
      navigate('/login');
      return;
    }
    
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      toast.loading('Preparing download...', { id: 'download' });
      
      await fileService.downloadFile(file.id, file.name);
      
      toast.success('Download started!', { id: 'download' });
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file', { id: 'download' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async (e) => {
    e.stopPropagation();
    
    if (isLoadingInfo) return;
    
    try {
      setIsLoadingInfo(true);
      
      // Create file info from available data (no API call needed)
      const info = {
        id: file.id,
        file_name: file.name,
        title: file.title,
        file_type: file.type,
        file_size: file.size,
        category: file.rawCategory,
        subject: file.subject,
        semester: file.semester,
        description: file.description,
        uploaded_by: file.uploadedBy,
        created_at: file.uploadDate,
        download_count: file.downloadCount
      };
      
      setFileInfo(info);
      setShowInfoModal(true);
    } catch (error) {
      console.error('Failed to show file info:', error);
      toast.error('Failed to load file information');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handlePinToggle = async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to pin files');
      navigate('/login');
      return;
    }
    
    if (isPinning) return;
    
    try {
      setIsPinning(true);
      
      if (isPinned) {
        await fileService.unpinFile(file.id);
        toast.success('File unpinned');
        setIsPinned(false);
      } else {
        await fileService.pinFile(file.id);
        toast.success('File pinned for quick access');
        setIsPinned(true);
      }
      
      if (onPinToggle) {
        onPinToggle(file.id, !isPinned);
      }
    } catch (error) {
      console.error('Pin toggle failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update pin status');
    } finally {
      setIsPinning(false);
    }
  };

  // Mouse move handler for Organize mode
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDraggingRef.current && mode === 'organize') {
        e.preventDefault();
        
        const deltaX = (e.clientX - dragStartPos.current.x) / zoom;
        const deltaY = (e.clientY - dragStartPos.current.y) / zoom;
        
        const newX = initialPos.current.x + deltaX;
        const newY = initialPos.current.y + deltaY;
        
        setPosition({ x: newX, y: newY });
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        isDraggingRef.current = false;
        onPositionUpdate(file.id, position);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, mode, zoom, file.id, position, onPositionUpdate]);

  // Non-passive touch event listeners for Organize mode
  useEffect(() => {
    const card = cardRef.current;
    if (!card || mode !== 'organize') return;

    const touchStartHandler = (e) => {
      if (!isAuthenticated) {
        toast.error('Please login to organize files');
        navigate('/login');
        return;
      }

      e.stopPropagation();
      const touch = e.touches[0];
      setIsDragging(true);
      isDraggingRef.current = true;
      dragStartPos.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
      initialPos.current = {
        x: position.x,
        y: position.y,
      };
    };

    const touchMoveHandler = (e) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        const deltaX = (touch.clientX - dragStartPos.current.x) / zoom;
        const deltaY = (touch.clientY - dragStartPos.current.y) / zoom;
        const newX = initialPos.current.x + deltaX;
        const newY = initialPos.current.y + deltaY;
        setPosition({ x: newX, y: newY });
      }
    };

    const touchEndHandler = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        isDraggingRef.current = false;
        onPositionUpdate(file.id, position);
      }
    };

    card.addEventListener('touchstart', touchStartHandler, { passive: false });
    card.addEventListener('touchmove', touchMoveHandler, { passive: false });
    card.addEventListener('touchend', touchEndHandler, { passive: false });

    return () => {
      card.removeEventListener('touchstart', touchStartHandler);
      card.removeEventListener('touchmove', touchMoveHandler);
      card.removeEventListener('touchend', touchEndHandler);
    };
  }, [mode, zoom, file.id, position, onPositionUpdate, isAuthenticated, navigate]);

  const Icon = getFileIcon(file.type);
  const iconColorClass = getFileIconColor(file.type);

  return (
    <>
      <div
        ref={cardRef}
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          cursor: mode === 'organize' ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          userSelect: 'none',
          touchAction: mode === 'organize' ? 'none' : 'auto',
        }}
        className={`file-card w-56 bg-[#1A1A1A] border rounded-xl p-5 ${
          isDragging
            ? 'border-blue-500 shadow-[0_12px_32px_rgba(59,130,246,0.3)] scale-105 z-50'
            : mode === 'browse'
            ? 'border-white/10 hover:border-purple-500 hover:shadow-[0_12px_32px_rgba(139,92,246,0.2)] hover:-translate-y-1'
            : 'border-white/10'
        }`}
      >
        {isPinned && isAuthenticated && (
          <div className="file-card-pin-badge absolute top-2 right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center pointer-events-none">
            <Pin size={14} className="text-black fill-black" />
          </div>
        )}

        <div className={`file-card-icon w-16 h-16 bg-gradient-to-br ${iconColorClass} rounded-xl flex items-center justify-center mb-4 pointer-events-none`}>
          <Icon size={32} className="text-white" />
        </div>

        <h3 className="file-card-title text-base font-semibold text-white mb-2 line-clamp-2 leading-tight pointer-events-none">
          {file.title}
        </h3>

        <div className="space-y-1.5 mb-4 pointer-events-none">
          <div className="file-card-meta flex items-center gap-2 text-xs text-gray-400">
            <FileText size={14} />
            <span>{file.type.toUpperCase()}</span>
            <span className="text-gray-600">•</span>
            <span>{file.size}</span>
          </div>
          <div className="file-card-meta flex items-center gap-2 text-xs text-gray-400">
            <File size={14} />
            <span className="capitalize">{file.category}</span>
          </div>
          {file.subject && (
            <div className="text-xs text-gray-400">
              <span className="font-medium">Subject:</span> {file.subject}
            </div>
          )}
          {file.semester && (
            <div className="text-xs text-gray-400">
              <span className="font-medium">Semester:</span> {file.semester}
            </div>
          )}
          <div className="text-xs text-gray-500">{file.uploadDate}</div>
        </div>

        <div className="mb-4 pb-4 border-b border-white/5 pointer-events-none">
          <p className="text-xs text-gray-500">Uploaded by</p>
          <p className="text-sm text-gray-400 font-medium">{file.uploadedBy}</p>
        </div>

        {mode === 'browse' && (
          <div className="file-card-actions flex gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading || !isAuthenticated}
              className={`file-card-button flex-1 h-9 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-xs font-semibold transition-opacity flex items-center justify-center gap-1 ${
                isDownloading || !isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
              title={!isAuthenticated ? 'Login to download' : 'Download file'}
            >
              <Download size={14} />
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
            {isAuthenticated && (
              <button
                onClick={handlePinToggle}
                disabled={isPinning}
                className={`file-card-icon-button w-9 h-9 border rounded-lg transition-colors flex items-center justify-center ${
                  isPinned
                    ? 'bg-yellow-500 border-yellow-500 text-black hover:bg-yellow-600'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                } ${isPinning ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isPinned ? 'Unpin' : 'Pin for quick access'}
              >
                <Pin size={14} className={isPinned ? 'fill-black' : ''} />
              </button>
            )}
            <button
              onClick={handlePreview}
              disabled={isLoadingInfo}
              className={`file-card-icon-button w-9 h-9 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center ${
                isLoadingInfo ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="View File Info"
            >
              <Eye size={14} />
            </button>
          </div>
        )}

        {mode === 'organize' && (
          <div className="text-center text-xs text-gray-500 pointer-events-none">
            {isDragging ? 'Release to drop' : 'Drag to reposition'}
          </div>
        )}
      </div>

      <FileInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        fileInfo={fileInfo}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
};

export default FileCard;