import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Edit2, Trash2, Loader, X,
    Mail, Building2, FileText, Eye, ChevronLeft, ChevronRight, Shield, ShieldOff
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import adminService from '../services/adminService';
import toast from 'react-hot-toast';

const AdminUsers = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        total_pages: 1,
        total_users: 0,
        per_page: 10
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [deletingUser, setDeletingUser] = useState(null);
    const [roleChangeUser, setRoleChangeUser] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        email: '',
        college: ''
    });

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            navigate('/profile');
            return;
        }

        fetchUsers(1);
    }, [isAuthenticated, user, navigate]);

    const fetchUsers = async (page = 1) => {
        try {
            setIsLoading(true);
            const response = await adminService.getAllUsers(page, 10);

            if (response.success) {
                setUsers(response.data.users);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const getAvatarUrl = (userObj) => {
        const style = userObj.avatar_style || 'avataaars';
        const seed = userObj.avatar_seed || userObj.email || userObj.name;
        return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({
            name: user.name,
            email: user.email,
            college: user.college
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
            const response = await adminService.updateUser(editingUser.id, editFormData);

            if (response.success) {
                setUsers(users.map(u => u.id === editingUser.id ? response.data : u));
                setShowEditModal(false);
                toast.success('User updated successfully');
            }
        } catch (error) {
            console.error('Failed to update user:', error);
            toast.error(error.message || 'Failed to update user');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRoleClick = (userObj) => {
        if (userObj.id === user.id) {
            toast.error('You cannot change your own role');
            return;
        }
        setRoleChangeUser(userObj);
        setShowRoleModal(true);
    };

    const handleConfirmRoleChange = async () => {
        try {
            setIsSaving(true);
            const newRole = roleChangeUser.role === 'admin' ? 'user' : 'admin';
            const response = await adminService.updateUserRole(roleChangeUser.id, newRole);

            if (response.success) {
                setUsers(users.map(u => u.id === roleChangeUser.id ? { ...u, role: newRole } : u));
                setShowRoleModal(false);
                toast.success(`User role updated to ${newRole}`);
            }
        } catch (error) {
            console.error('Failed to update user role:', error);
            toast.error(error.message || 'Failed to update user role');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (user) => {
        setDeletingUser(user);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        try {
            setIsSaving(true);
            const response = await adminService.deleteUser(deletingUser.id);

            if (response.success) {
                setUsers(users.filter(u => u.id !== deletingUser.id));
                setShowDeleteModal(false);
                toast.success('User deleted successfully');

                if (users.length === 1 && pagination.current_page > 1) {
                    fetchUsers(pagination.current_page - 1);
                }
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            toast.error(error.message || 'Failed to delete user');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users;

        const lowerSearch = searchTerm.toLowerCase();
        return users.filter(user =>
            user.name?.toLowerCase().includes(lowerSearch) ||
            user.email?.toLowerCase().includes(lowerSearch) ||
            user.college?.toLowerCase().includes(lowerSearch)
        );
    }, [users, searchTerm]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            fetchUsers(newPage);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black pt-16 sm:pt-20 px-4 sm:px-8 pb-16 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 text-sm sm:text-base">Loading users...</p>
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
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-gray-400 text-sm sm:text-base">View and manage all registered users</p>
                </div>

                {/* Search Bar */}
                <div className="mb-4 sm:mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or college..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 sm:h-12 pl-10 sm:pl-12 pr-4 bg-[#0A0A0A] border border-white/10 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                        />
                    </div>
                    {searchTerm && (
                        <p className="text-xs sm:text-sm text-gray-400 mt-2">
                            Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching "{searchTerm}"
                        </p>
                    )}
                </div>

                {/* Users Table - Desktop */}
                <div className="hidden md:block bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-[#1A1A1A] border-b border-white/10">
                                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-400">User</th>
                                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-400">College</th>
                                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-400">Role</th>
                                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-400">Files</th>
                                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-400">Downloads</th>
                                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold text-gray-400">Joined</th>
                                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs lg:text-sm font-semibold text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((userObj) => (
                                        <tr key={userObj.id} className="border-b border-white/5 hover:bg-[#1A1A1A] transition-colors">
                                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={getAvatarUrl(userObj)}
                                                        alt={userObj.name}
                                                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10"
                                                    />
                                                    <div>
                                                        <div className="text-white font-medium text-sm lg:text-base">{userObj.name}</div>
                                                        <div className="text-xs lg:text-sm text-gray-400 flex items-center gap-1">
                                                            <Mail size={10} className="lg:w-3 lg:h-3" />
                                                            {userObj.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                                                <div className="flex items-center gap-2 text-gray-300 text-sm lg:text-base">
                                                    <Building2 size={14} className="text-gray-500 lg:w-4 lg:h-4" />
                                                    <span className="truncate max-w-[150px]">{userObj.college}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${userObj.role === 'admin'
                                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                                    }`}>
                                                    {userObj.role === 'admin' ? <Shield size={12} /> : <ShieldOff size={12} />}
                                                    {userObj.role === 'admin' ? 'Admin' : 'User'}
                                                </span>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={14} className="text-purple-500 lg:w-4 lg:h-4" />
                                                    <span className="text-white font-medium text-sm lg:text-base">{userObj.files_count}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                                                <div className="flex items-center gap-2">
                                                    <Eye size={14} className="text-blue-500 lg:w-4 lg:h-4" />
                                                    <span className="text-white font-medium text-sm lg:text-base">{userObj.total_downloads}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 text-gray-400 text-xs lg:text-sm">
                                                {new Date(userObj.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleRoleClick(userObj)}
                                                        className={`p-1.5 lg:p-2 rounded-lg transition-colors ${userObj.id === user.id
                                                                ? 'text-gray-600 cursor-not-allowed'
                                                                : userObj.role === 'admin'
                                                                    ? 'text-orange-400 hover:bg-orange-500/10'
                                                                    : 'text-green-400 hover:bg-green-500/10'
                                                            }`}
                                                        title={userObj.id === user.id ? 'Cannot change own role' : (userObj.role === 'admin' ? 'Revoke Admin' : 'Grant Admin')}
                                                        disabled={userObj.id === user.id}
                                                    >
                                                        {userObj.role === 'admin' ? <ShieldOff size={16} className="lg:w-[18px] lg:h-[18px]" /> : <Shield size={16} className="lg:w-[18px] lg:h-[18px]" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditClick(userObj)}
                                                        className="p-1.5 lg:p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 size={16} className="lg:w-[18px] lg:h-[18px]" />
                                                    </button>
                                                    {userObj.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleDeleteClick(userObj)}
                                                            className="p-1.5 lg:p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={16} className="lg:w-[18px] lg:h-[18px]" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                            No users found matching your search
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!searchTerm && pagination.total_pages > 1 && (
                        <div className="px-4 lg:px-6 py-3 lg:py-4 border-t border-white/10 flex items-center justify-between">
                            <div className="text-xs lg:text-sm text-gray-400">
                                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                                {Math.min(pagination.current_page * pagination.per_page, pagination.total_users)} of{' '}
                                {pagination.total_users} users
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    className="p-1.5 lg:p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={18} className="lg:w-5 lg:h-5" />
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(pagination.total_pages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(i + 1)}
                                            className={`w-7 h-7 lg:w-8 lg:h-8 rounded-lg text-xs lg:text-sm font-medium transition-colors ${pagination.current_page === i + 1
                                                    ? 'bg-purple-500 text-white'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.total_pages}
                                    className="p-1.5 lg:p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={18} className="lg:w-5 lg:h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Users Cards - Mobile */}
                <div className="md:hidden space-y-4 mb-6">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((userObj) => (
                            <div
                                key={userObj.id}
                                className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <img
                                        src={getAvatarUrl(userObj)}
                                        alt={userObj.name}
                                        className="w-12 h-12 rounded-full bg-white/5 border border-white/10"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-white font-semibold text-base truncate">{userObj.name}</h3>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${userObj.role === 'admin'
                                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                    : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                                }`}>
                                                {userObj.role === 'admin' ? <Shield size={10} /> : <ShieldOff size={10} />}
                                                {userObj.role === 'admin' ? 'Admin' : 'User'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                                            <Mail size={10} />
                                            <span className="truncate">{userObj.email}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <Building2 size={10} />
                                            <span className="truncate">{userObj.college}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 pt-3 mb-3 border-t border-white/10">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <FileText size={12} className="text-purple-500" />
                                            <span className="text-white font-semibold text-sm">{userObj.files_count}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">Files</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Eye size={12} className="text-blue-500" />
                                            <span className="text-white font-semibold text-sm">{userObj.total_downloads}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">Downloads</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-white font-semibold text-sm mb-1">
                                            {new Date(userObj.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <span className="text-xs text-gray-400">Joined</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                                    <button
                                        onClick={() => handleRoleClick(userObj)}
                                        disabled={userObj.id === user.id}
                                        className={`flex-1 h-9 flex items-center justify-center gap-1 rounded-lg font-medium text-xs transition-colors ${userObj.id === user.id
                                                ? 'bg-gray-500/10 text-gray-600 cursor-not-allowed'
                                                : userObj.role === 'admin'
                                                    ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                                                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                            }`}
                                    >
                                        {userObj.role === 'admin' ? <ShieldOff size={14} /> : <Shield size={14} />}
                                        {userObj.role === 'admin' ? 'Revoke Admin' : 'Grant Admin'}
                                    </button>
                                    <button
                                        onClick={() => handleEditClick(userObj)}
                                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    {userObj.role !== 'admin' && (
                                        <button
                                            onClick={() => handleDeleteClick(userObj)}
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <Search size={32} className="mx-auto mb-3 opacity-50" />
                            <p>No users found matching your search</p>
                        </div>
                    )}

                    {/* Mobile Pagination */}
                    {!searchTerm && pagination.total_pages > 1 && (
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4">
                            <div className="text-xs text-gray-400 text-center mb-3">
                                Page {pagination.current_page} of {pagination.total_pages}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={18} />
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
                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${pagination.current_page === pageNum
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
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h3 className="text-xl sm:text-2xl font-bold text-white">Edit User</h3>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <X size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editFormData.name}
                                        onChange={handleEditChange}
                                        required
                                        className="w-full h-10 sm:h-12 px-3 sm:px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm sm:text-base focus:border-purple-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={editFormData.email}
                                        onChange={handleEditChange}
                                        required
                                        className="w-full h-10 sm:h-12 px-3 sm:px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm sm:text-base focus:border-purple-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">College</label>
                                    <input
                                        type="text"
                                        name="college"
                                        value={editFormData.college}
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

                {/* Role Change Confirmation Modal */}
                {showRoleModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full">
                            <div className="text-center mb-4 sm:mb-6">
                                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${roleChangeUser?.role === 'admin'
                                        ? 'bg-orange-500/10'
                                        : 'bg-green-500/10'
                                    }`}>
                                    {roleChangeUser?.role === 'admin' ? (
                                        <ShieldOff size={28} className="text-orange-500 sm:w-8 sm:h-8" />
                                    ) : (
                                        <Shield size={28} className="text-green-500 sm:w-8 sm:h-8" />
                                    )}
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                                    {roleChangeUser?.role === 'admin' ? 'Revoke Admin Role' : 'Grant Admin Role'}
                                </h3>
                                <p className="text-gray-400 text-sm sm:text-base">
                                    Are you sure you want to {roleChangeUser?.role === 'admin' ? 'revoke admin privileges from' : 'grant admin privileges to'}{' '}
                                    <span className="text-white font-semibold">{roleChangeUser?.name}</span>?
                                    {roleChangeUser?.role !== 'admin' && (
                                        <span className="block mt-2 text-xs sm:text-sm text-yellow-400">
                                            ⚠️ This user will have full access to admin features.
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div className="flex gap-2 sm:gap-3">
                                <button
                                    onClick={() => setShowRoleModal(false)}
                                    disabled={isSaving}
                                    className="flex-1 h-10 sm:h-12 px-4 sm:px-6 bg-white/5 border border-white/10 text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-white/10 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmRoleChange}
                                    disabled={isSaving}
                                    className={`flex-1 h-10 sm:h-12 px-4 sm:px-6 text-white rounded-lg font-semibold text-sm sm:text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${roleChangeUser?.role === 'admin'
                                            ? 'bg-orange-500 hover:bg-orange-600'
                                            : 'bg-green-500 hover:bg-green-600'
                                        }`}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" />
                                            <span className="hidden sm:inline">Updating...</span>
                                        </>
                                    ) : (
                                        <>
                                            {roleChangeUser?.role === 'admin' ? 'Revoke Admin' : 'Grant Admin'}
                                        </>
                                    )}
                                </button>
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
                                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Delete User</h3>
                                <p className="text-gray-400 text-sm sm:text-base">
                                    Are you sure you want to delete <span className="text-white font-semibold">{deletingUser?.name}</span>?
                                    This will also delete all their files and cannot be undone.
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
                                        'Delete User'
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

export default AdminUsers;