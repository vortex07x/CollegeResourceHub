import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Edit2, Trash2, Loader, X, Download,
    FileText, User, Calendar, ChevronLeft, ChevronRight, Eye, File
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';

const AdminFiles = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [files, setFiles] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        total_pages: 1,
        total_files: 0,
        per_page: 20
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [editingFile, setEditingFile] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingFile, setDeletingFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        category: '',
        subject: '',
        semester: ''
    });

    const categories = ['assignment', 'question_paper', 'syllabus', 'notes', 'other'];

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            navigate('/profile');
            return;
        }

        fetchFiles(1);
    }, [isAuthenticated, user, navigate]);

    const fetchFiles = async (page = 1) => {
        try {
            setIsLoading(true);
            const response = await adminService.getAllFiles(page, 20);

            if (response.success) {
                setFiles(response.data.files);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch files:', error);
            toast.error('Failed to load files');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (file) => {
        setEditingFile(file);
        setEditFormData({
            title: file.title,
            description: file.description || '',
            category: file.category,
            subject: file.subject,
            semester: file.semester || ''
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({ ...editFormData, [name]: value });
    };

    const handleSaveEdit = async () => {
        try {
            setIsSaving(true);
            const response = await adminService.updateFile(editingFile.id, editFormData);

            if (response.success) {
                setFiles(files.map(f => f.id === editingFile.id ? response.data : f));
                setShowEditModal(false);
                toast.success('File updated successfully');
            }
        } catch (error) {
            console.error('Failed to update file:', error);
            toast.error(error.message || 'Failed to update file');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (file) => {
        setDeletingFile(file);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        try {
            setIsSaving(true);
            const response = await adminService.deleteFile(deletingFile.id);

            if (response.success) {
                setFiles(files.filter(f => f.id !== deletingFile.id));
                setShowDeleteModal(false);
                toast.success('File deleted successfully');

                if (files.length === 1 && pagination.current_page > 1) {
                    fetchFiles(pagination.current_page - 1);
                }
            }
        } catch (error) {
            console.error('Failed to delete file:', error);
            toast.error(error.message || 'Failed to delete file');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredFiles = useMemo(() => {
        if (!searchTerm.trim()) return files;

        const lowerSearch = searchTerm.toLowerCase();
        return files.filter(file =>
            file.title?.toLowerCase().includes(lowerSearch) ||
            file.subject?.toLowerCase().includes(lowerSearch) ||
            file.uploaded_by?.toLowerCase().includes(lowerSearch)
        );
    }, [files, searchTerm]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            fetchFiles(newPage);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getCategoryBadgeColor = (category) => {
        const colors = {
            assignment: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            question_paper: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            syllabus: 'bg-green-500/20 text-green-400 border-green-500/30',
            notes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            other: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
        return colors[category] || colors.other;
    };

    const getCategoryIcon = (category) => {
        const icons = {
            assignment: '📝',
            question_paper: '📋',
            syllabus: '📚',
            notes: '📖',
            other: '📄'
        };
        return icons[category] || icons.other;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black pt-16 sm:pt-20 px-4 sm:px-8 pb-16 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 text-sm sm:text-base">Loading files...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pt-16 sm:pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors text-sm sm:text-base"
                    >
                        <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Back to Dashboard</span>
                        <span className="sm:hidden">Back</span>
                    </button>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">File Management</h1>
                    <p className="text-gray-400 text-sm sm:text-base">View, edit, and manage all uploaded files</p>
                </div>

                {/* Search Bar */}
                <div className="mb-4 sm:mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by title, subject, or uploader..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 sm:h-12 pl-10 sm:pl-12 pr-4 bg-[#0A0A0A] border border-white/10 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                        />
                    </div>
                    {searchTerm && (
                        <p className="text-xs sm:text-sm text-gray-400 mt-2">
                            Found {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} matching "{searchTerm}"
                        </p>
                    )}
                </div>

                {/* Files Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {filteredFiles.length > 0 ? (
                        filteredFiles.map((file) => (
                            <div
                                key={file.id}
                                className="bg-gradient-to-br from-[#0A0A0A] to-[#0F0F0F] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 group"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3 sm:mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl sm:text-2xl">{getCategoryIcon(file.category)}</span>
                                        <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold border ${getCategoryBadgeColor(file.category)}`}>
                                            {file.category.replace('_', ' ').toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditClick(file)}
                                            className="p-1.5 sm:p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title="Edit File"
                                        >
                                            <Edit2 size={14} className="sm:w-4 sm:h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(file)}
                                            className="p-1.5 sm:p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete File"
                                        >
                                            <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* File Icon and Title */}
                                <div className="mb-3 sm:mb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                                        <File size={20} className="text-purple-400 sm:w-6 sm:h-6" />
                                    </div>
                                    <h3 className="text-white font-bold text-base sm:text-lg mb-1 sm:mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                                        {file.title}
                                    </h3>
                                    {file.description && (
                                        <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                                            {file.description}
                                        </p>
                                    )}
                                </div>

                                {/* File Details */}
                                <div className="space-y-2 sm:space-y-2.5 mb-3 sm:mb-4">
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                            <FileText size={10} className="text-purple-400 sm:w-3 sm:h-3" />
                                        </div>
                                        <span className="text-gray-300 font-medium truncate">{file.subject}</span>
                                        {file.semester && (
                                            <span className="ml-auto px-1.5 sm:px-2 py-0.5 rounded-md bg-white/5 text-gray-400 text-xs">
                                                Sem {file.semester}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <User size={10} className="text-blue-400 sm:w-3 sm:h-3" />
                                        </div>
                                        <span className="text-gray-400 truncate">{file.uploaded_by}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-green-500/10 flex items-center justify-center">
                                            <Calendar size={10} className="text-green-400 sm:w-3 sm:h-3" />
                                        </div>
                                        <span className="text-gray-400 text-xs sm:text-sm">
                                            {new Date(file.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                        <div className="ml-auto flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-md bg-white/5">
                                            <Eye size={10} className="text-gray-500 sm:w-3 sm:h-3" />
                                            <span className="text-gray-400 text-xs font-medium">{file.download_count}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="pt-3 sm:pt-4 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                                            <Download size={12} className="text-orange-400 sm:w-3.5 sm:h-3.5" />
                                        </div>
                                        <span className="text-gray-400 text-xs font-medium">{formatFileSize(file.file_size)}</span>
                                    </div>
                                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                                        {file.file_type}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 sm:py-16">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <Search size={28} className="text-gray-600 sm:w-8 sm:h-8" />
                            </div>
                            <p className="text-gray-400 text-base sm:text-lg">No files found matching your search</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!searchTerm && pagination.total_pages > 1 && (
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-xl px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                        <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                            {Math.min(pagination.current_page * pagination.per_page, pagination.total_files)} of{' '}
                            {pagination.total_files} files
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(Math.min(pagination.total_pages, 5))].map((_, i) => {
                                    let pageNum;
                                    if (pagination.total_pages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.current_page <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.current_page >= pagination.total_pages - 2) {
                                        pageNum = pagination.total_pages - 4 + i;
                                    } else {
                                        pageNum = pagination.current_page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                                pagination.current_page === pageNum
                                                    ? 'bg-purple-500 text-white'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.total_pages}
                                className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={18} className="sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h3 className="text-xl sm:text-2xl font-bold text-white">Edit File</h3>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <X size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={editFormData.title}
                                        onChange={handleEditChange}
                                        required
                                        className="w-full h-10 sm:h-12 px-3 sm:px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm sm:text-base focus:border-purple-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Description</label>
                                    <textarea
                                        name="description"
                                        value={editFormData.description}
                                        onChange={handleEditChange}
                                        rows={3}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm sm:text-base focus:border-purple-500 focus:outline-none transition-colors resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Category</label>
                                        <select
                                            name="category"
                                            value={editFormData.category}
                                            onChange={handleEditChange}
                                            required
                                            className="w-full h-10 sm:h-12 px-3 sm:px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm sm:text-base focus:border-purple-500 focus:outline-none transition-colors"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>
                                                    {cat.replace('_', ' ').charAt(0).toUpperCase() + cat.replace('_', ' ').slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Semester</label>
                                        <input
                                            type="text"
                                            name="semester"
                                            value={editFormData.semester}
                                            onChange={handleEditChange}
                                            placeholder="e.g., 1, 2, 3"
                                            className="w-full h-10 sm:h-12 px-3 sm:px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm sm:text-base focus:border-purple-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={editFormData.subject}
                                        onChange={handleEditChange}
                                        required
                                        className="w-full h-10 sm:h-12 px-3 sm:px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm sm:text-base focus:border-purple-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        disabled={isSaving}
                                        className="flex-1 h-10 sm:h-12 px-4 sm:px-6 bg-white/5 border border-white/10 text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-white/10 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={isSaving}
                                        className="flex-1 h-10 sm:h-12 px-4 sm:px-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" />
                                                <span className="hidden sm:inline">Saving...</span>
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full">
                            <div className="text-center mb-4 sm:mb-6">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={28} className="text-red-500 sm:w-8 sm:h-8" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Delete File</h3>
                                <p className="text-gray-400 text-sm sm:text-base">
                                    Are you sure you want to delete <span className="text-white font-semibold">{deletingFile?.title}</span>?
                                    This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex gap-2 sm:gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isSaving}
                                    className="flex-1 h-10 sm:h-12 px-4 sm:px-6 bg-white/5 border border-white/10 text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-white/10 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={isSaving}
                                    className="flex-1 h-10 sm:h-12 px-4 sm:px-6 bg-red-500 text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" />
                                            <span className="hidden sm:inline">Deleting...</span>
                                        </>
                                    ) : (
                                        'Delete File'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFiles;