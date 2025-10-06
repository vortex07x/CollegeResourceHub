import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, FileText, Download, HardDrive, TrendingUp,
    Activity, Loader, ArrowLeft, UserCog, Files, Menu, X
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import adminService from '../services/adminService';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [showMobileNav, setShowMobileNav] = useState(false);
    const [stats, setStats] = useState({
        overview: {
            total_users: 0,
            total_files: 0,
            total_downloads: 0,
            total_storage_mb: 0,
            recent_users: 0,
            recent_uploads: 0
        },
        top_users: [],
        recent_activity: []
    });

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            navigate('/profile');
            return;
        }

        fetchDashboardStats();
    }, [isAuthenticated, user, navigate]);

    const fetchDashboardStats = async () => {
        try {
            setIsLoading(true);
            const response = await adminService.getDashboardStats();

            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const overviewCards = [
        {
            title: 'Total Users',
            value: stats.overview.total_users,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            change: `+${stats.overview.recent_users} this week`
        },
        {
            title: 'Total Files',
            value: stats.overview.total_files,
            icon: FileText,
            color: 'from-purple-500 to-pink-500',
            change: `+${stats.overview.recent_uploads} this week`
        },
        {
            title: 'Total Downloads',
            value: stats.overview.total_downloads,
            icon: Download,
            color: 'from-green-500 to-emerald-500',
            change: 'All time'
        },
        {
            title: 'Storage Used',
            value: `${stats.overview.total_storage_mb} MB`,
            icon: HardDrive,
            color: 'from-orange-500 to-red-500',
            change: 'Total storage'
        }
    ];

    const navigationItems = [
        {
            title: 'User Management',
            description: 'View, edit, and manage user accounts',
            icon: UserCog,
            color: 'from-blue-500 to-cyan-500',
            path: '/admin/users'
        },
        {
            title: 'File Management',
            description: 'Manage, edit, and delete uploaded files',
            icon: Files,
            color: 'from-purple-500 to-pink-500',
            path: '/admin/files'
        }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black pt-16 sm:pt-20 px-4 sm:px-8 pb-16 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 text-sm sm:text-base">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pt-16 sm:pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                        >
                            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Back to Profile</span>
                            <span className="sm:hidden">Back</span>
                        </button>
                        
                        {/* Mobile Navigation Toggle */}
                        <button
                            onClick={() => setShowMobileNav(true)}
                            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
                    <p className="text-gray-400 text-sm sm:text-base">Manage users, files, and monitor platform activity</p>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {overviewCards.map((card, index) => (
                        <div
                            key={index}
                            className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 sm:p-6 relative overflow-hidden group hover:border-white/20 transition-colors"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <card.icon size={20} className="text-gray-400 sm:w-6 sm:h-6" />
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${card.color} opacity-20`}></div>
                                </div>
                                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{card.value}</div>
                                <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">{card.title}</div>
                                <div className="text-xs text-gray-500">{card.change}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                    {/* Desktop Navigation - Compact Sidebar */}
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-3 sticky top-24">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Quick Actions</h2>
                            <div className="space-y-2">
                                {navigationItems.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => navigate(item.path)}
                                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 hover:border-purple-500/50 hover:bg-[#2A2A2A] transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                                                <item.icon size={18} className="text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-white mb-0.5">{item.title}</h3>
                                                <p className="text-xs text-gray-400 leading-snug line-clamp-1">{item.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9 space-y-6">
                        {/* Top Users */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 sm:p-6">
                            <div className="flex items-center gap-2 mb-4 sm:mb-6">
                                <TrendingUp size={18} className="text-purple-500 sm:w-5 sm:h-5" />
                                <h2 className="text-lg sm:text-xl font-bold text-white">Top Contributors</h2>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                {stats.top_users.length > 0 ? (
                                    stats.top_users.map((user, index) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-3 sm:p-4 bg-[#1A1A1A] rounded-lg hover:bg-[#2A2A2A] transition-colors"
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                                                    {index + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-white font-medium text-sm sm:text-base truncate">{user.name}</div>
                                                    <div className="text-xs sm:text-sm text-gray-400 truncate">{user.email}</div>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-2">
                                                <div className="text-white font-semibold text-sm sm:text-base">{user.file_count}</div>
                                                <div className="text-xs text-gray-400">files</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm sm:text-base">No user data available</div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 sm:p-6">
                            <div className="flex items-center gap-2 mb-4 sm:mb-6">
                                <Activity size={18} className="text-purple-500 sm:w-5 sm:h-5" />
                                <h2 className="text-lg sm:text-xl font-bold text-white">Recent Activity</h2>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                {stats.recent_activity.length > 0 ? (
                                    stats.recent_activity.map((activity, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-[#1A1A1A] rounded-lg"
                                        >
                                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                                <FileText size={14} className="text-purple-500 sm:w-4 sm:h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm text-white">
                                                    <span className="font-medium">{activity.user_name}</span>
                                                    {' uploaded '}
                                                    <span className="text-purple-400 break-words">{activity.file_title}</span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                                                    {formatDate(activity.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm sm:text-base">No recent activity</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer with Animations */}
            {showMobileNav && (
                <>
                    {/* Backdrop with fade-in */}
                    <div 
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden animate-fadeIn"
                        onClick={() => setShowMobileNav(false)}
                    />
                    {/* Drawer with slide-in */}
                    <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-[#0A0A0A] border-l border-white/10 z-50 lg:hidden overflow-y-auto shadow-2xl animate-slideInRight">
                        <div className="p-4 sm:p-5">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white">Quick Actions</h2>
                                <button
                                    onClick={() => setShowMobileNav(false)}
                                    className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {navigationItems.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            navigate(item.path);
                                            setShowMobileNav(false);
                                        }}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-4 hover:border-purple-500/50 hover:bg-[#2A2A2A] transition-all group text-left animate-slideUp"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                                                <item.icon size={24} className="text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                                                <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;