import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Save, Eye, FileText, Award, X, Loader, Shield, Edit2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const { user: storeUser, updateUser, isAuthenticated } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState({
    style: 'avataaars',
    seed: 'User'
  });
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    college: '',
    joinDate: '',
    role: 'user'
  });
  const [stats, setStats] = useState({
    files_uploaded: 0,
    total_views: 0,
    contributions: 0
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const avatarStyles = [
    { name: 'Avataaars', value: 'avataaars' },
    { name: 'Personas', value: 'personas' },
    { name: 'Lorelei', value: 'lorelei' },
    { name: 'Notionists', value: 'notionists' },
    { name: 'Adventurer', value: 'adventurer' },
    { name: 'Big Ears', value: 'big-ears' },
    { name: 'Bottts', value: 'bottts' },
    { name: 'Shapes', value: 'shapes' },
  ];

  const seeds = [
    'Happy', 'Cool', 'Smart', 'Creative', 'Friendly', 'Wise',
    'Bold', 'Clever', 'Bright', 'Brave', 'Kind', 'Swift',
    'Sharp', 'Noble', 'Gentle', 'Strong', 'Quick', 'Calm'
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchProfileData();
  }, [isAuthenticated, navigate]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await authService.getProfile();
      
      if (response.success) {
        const profileData = response.data.profile;
        const statsData = response.data.stats;
        
        const data = {
          name: profileData.name || '',
          email: profileData.email || '',
          bio: profileData.bio || '',
          college: profileData.college || '',
          joinDate: formatDate(profileData.created_at),
          role: profileData.role || 'user'
        };

        setFormData(data);
        setOriginalData(data);

        setAvatarConfig({
          style: profileData.avatar_style || 'avataaars',
          seed: profileData.avatar_seed || profileData.name?.replace(/\s+/g, '-') || 'User'
        });

        setStats({
          files_uploaded: statsData.files_uploaded || 0,
          total_views: statsData.total_views || 0,
          contributions: statsData.contributions || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setErrorMessage(error.message || 'Failed to load profile data');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getAvatarUrl = (style, seed) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setErrorMessage('');
      
      const response = await authService.updateProfile({
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        college: formData.college,
        avatar_style: avatarConfig.style,
        avatar_seed: avatarConfig.seed
      });
      
      if (response.success) {
        const updatedProfile = response.data.profile;
        
        const data = {
          name: updatedProfile.name,
          email: updatedProfile.email,
          bio: updatedProfile.bio,
          college: updatedProfile.college,
          joinDate: formatDate(updatedProfile.created_at),
          role: updatedProfile.role || 'user'
        };
        
        setFormData(data);
        setOriginalData(data);
        
        updateUser(updatedProfile);
        
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setErrorMessage(error.message || 'Failed to update profile');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = async (style, seed) => {
    const newConfig = { style, seed };
    setAvatarConfig(newConfig);
    setShowAvatarPicker(false);
    
    try {
      const response = await authService.updateProfile({
        avatar_style: style,
        avatar_seed: seed
      });
      
      if (response.success) {
        updateUser(response.data.profile);
        setSuccessMessage('Avatar updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
      setErrorMessage('Failed to update avatar');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const displayStats = [
    { icon: FileText, label: 'Files Uploaded', value: stats.files_uploaded, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { icon: Eye, label: 'Total Views', value: stats.total_views, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { icon: Award, label: 'Contributions', value: stats.contributions, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  ];

  const isAdmin = formData.role === 'admin';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm sm:text-base">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16 sm:pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-500/10 border border-green-500/30 rounded-lg sm:rounded-xl text-green-500 text-xs sm:text-sm flex items-center gap-2">
            <span className="text-base sm:text-lg">✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg sm:rounded-xl text-red-500 text-xs sm:text-sm flex items-center gap-2">
            <span className="text-base sm:text-lg">✗</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 mb-6 sm:mb-8 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 items-center sm:items-start">
            {/* Avatar Section */}
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full sm:rounded-2xl border-2 sm:border-4 border-white/30 bg-white overflow-hidden shadow-2xl">
                <img 
                  src={getAvatarUrl(avatarConfig.style, avatarConfig.seed)} 
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="absolute -bottom-1 -right-1 sm:bottom-0 sm:right-0 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                title="Change Avatar"
              >
                <Edit2 size={14} className="text-purple-500 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white break-words max-w-full">
                  {formData.name}
                </h1>
                {isAdmin && (
                  <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded-full flex-shrink-0">
                    <Shield size={14} className="text-yellow-500 sm:w-4 sm:h-4" />
                    <span className="text-yellow-500 text-xs sm:text-sm font-semibold">Admin</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4">
                <p className="text-white/90 text-sm sm:text-base break-all">{formData.email}</p>
                <p className="text-white/70 text-xs sm:text-sm break-words">{formData.college}</p>
                <div className="flex items-center gap-2 text-white/60 text-xs sm:text-sm justify-center sm:justify-start">
                  <Calendar size={14} className="flex-shrink-0 sm:w-4 sm:h-4" />
                  <span>Member since {formData.joinDate}</span>
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Shield size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Admin Dashboard
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {displayStats.map((stat, index) => (
            <div
              key={index}
              className="bg-[#0A0A0A] border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 text-center hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 ${stat.bgColor} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                <stat.icon size={20} className={`${stat.color} sm:w-6 sm:h-6 lg:w-7 lg:h-7`} />
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Account Information Card */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Account Information</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-white/5 border border-white/10 text-white rounded-lg font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isSaving ? (
                    <>
                      <Loader size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" />
                      <span className="hidden sm:inline">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} className="sm:w-[18px] sm:h-[18px]" />
                      Save
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="w-full h-10 sm:h-12 px-3 sm:px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm sm:text-base focus:border-purple-500 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="w-full h-10 sm:h-12 px-3 sm:px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm sm:text-base focus:border-purple-500 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed break-all"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">College</label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="w-full h-10 sm:h-12 px-3 sm:px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm sm:text-base focus:border-purple-500 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                rows={4}
                placeholder="Tell us about yourself..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm sm:text-base focus:border-purple-500 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>
          </div>
        </div>

        {/* Avatar Picker Modal */}
        {showAvatarPicker && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Choose Your Avatar</h3>
              <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">Select a style and variation</p>
              
              <div className="mb-5 sm:mb-6">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2 sm:mb-3">Avatar Style</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                  {avatarStyles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setAvatarConfig({ ...avatarConfig, style: style.value })}
                      className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                        avatarConfig.style === style.value
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                          : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#2A2A2A]'
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2 sm:mb-3">Choose Variation</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
                  {seeds.map((seed, index) => (
                    <button
                      key={index}
                      onClick={() => handleAvatarSelect(avatarConfig.style, seed)}
                      className={`aspect-square rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                        avatarConfig.seed === seed
                          ? 'border-purple-500 ring-2 sm:ring-4 ring-purple-500/30'
                          : 'border-white/10 hover:border-purple-500/50'
                      }`}
                    >
                      <img 
                        src={getAvatarUrl(avatarConfig.style, seed)} 
                        alt={`Avatar ${seed}`}
                        className="w-full h-full object-cover bg-white"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;