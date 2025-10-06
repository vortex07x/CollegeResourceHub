import { Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, FileText, User, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';

const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout, checkAuth } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check auth on mount and when auth-expired event fires
  useEffect(() => {
    checkAuth();
    
    const handleAuthExpiration = () => {
      checkAuth();
    };

    window.addEventListener('auth-expired', handleAuthExpiration);
    
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpiration);
    };
  }, [checkAuth]);

  // Also check auth when location changes
  useEffect(() => {
    checkAuth();
  }, [location.pathname, checkAuth]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/browse', label: 'Browse Files', icon: FolderOpen },
    { path: '/my-files', label: 'My Files', icon: FileText },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar-main">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="navbar-logo">
              <span className="text-2xl">📚</span>
              <span className="hidden sm:inline">College Hub</span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="relative flex items-center gap-2 text-base font-medium transition-all duration-300 group"
                  >
                    <Icon size={20} className={active ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
                    <span className={active ? 'text-white' : 'text-gray-400 group-hover:text-white'}>
                      {link.label}
                    </span>
                    
                    {active && (
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full" />
                    )}
                    
                    {!active && (
                      <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300"
                  >
                    <User size={20} />
                    <span className="font-medium">{user?.name || 'Profile'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-all duration-300 hover:scale-105"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:scale-105 hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)] transition-all duration-300 flex items-center gap-2"
                >
                  Login
                  <span className="text-sm">→</span>
                </Link>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="navbar-mobile-toggle"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="navbar-mobile-overlay"
        />
      )}

      <div className={`navbar-mobile-menu ${mobileMenuOpen ? 'navbar-mobile-menu-open' : ''}`}>
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <span className="text-lg font-bold text-white">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/10 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-300"
                >
                  <User size={20} />
                  <span className="font-medium">{user?.name || 'Profile'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-300"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full px-6 py-3.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-center rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;