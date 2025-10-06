import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, FileQuestion } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            {/* Large 404 Text */}
            <h1 className="text-[180px] md:text-[240px] font-bold leading-none bg-gradient-to-br from-purple-500 to-blue-500 bg-clip-text text-transparent select-none">
              404
            </h1>
            
            {/* Floating File Icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 animate-pulse">
                <FileQuestion size={40} className="text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-400 mb-8 max-w-md mx-auto">
          Oops! The page you're looking for seems to have wandered off into the digital void. 
          It might have been moved, deleted, or never existed.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
          
          <Link
            to="/"
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform"
          >
            <Home size={20} />
            Back to Home
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm text-gray-500 mb-4">You might be looking for:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/browse"
              className="px-4 py-2 bg-[#1A1A1A] border border-white/10 text-gray-400 text-sm rounded-lg hover:text-white hover:border-purple-500/50 transition-colors"
            >
              Browse Files
            </Link>
            <Link
              to="/my-files"
              className="px-4 py-2 bg-[#1A1A1A] border border-white/10 text-gray-400 text-sm rounded-lg hover:text-white hover:border-purple-500/50 transition-colors"
            >
              My Files
            </Link>
            <Link
              to="/profile"
              className="px-4 py-2 bg-[#1A1A1A] border border-white/10 text-gray-400 text-sm rounded-lg hover:text-white hover:border-purple-500/50 transition-colors"
            >
              Profile
            </Link>
            <Link
              to="/help"
              className="px-4 py-2 bg-[#1A1A1A] border border-white/10 text-gray-400 text-sm rounded-lg hover:text-white hover:border-purple-500/50 transition-colors"
            >
              Help Center
            </Link>
          </div>
        </div>

        {/* Search Suggestion */}
        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-3">Or try searching:</p>
          <div className="max-w-md mx-auto relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              placeholder="Search for resources..."
              className="w-full h-12 pl-12 pr-4 bg-[#1A1A1A] border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  navigate(`/browse?search=${encodeURIComponent(e.target.value)}`);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;