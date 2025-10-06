import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, X } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import ForgotPasswordModal from '../components/common/ForgotPasswordModal';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    clearError();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Pass rememberMe parameter to login
      await login({
        email: formData.email,
        password: formData.password
      }, formData.rememberMe);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <>
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-12 shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Logo */}
            <div className="text-center mb-3">
              <h1 className="text-3xl font-bold text-white">📚 College Hub</h1>
            </div>

            {/* Heading */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-sm text-gray-400">Login to access your resources</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    className={`w-full h-12 pl-12 pr-4 bg-[#1A1A1A] border ${
                      errors.email ? 'border-red-500' : 'border-white/10'
                    } rounded-lg text-white text-sm placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-3 focus:ring-purple-500/10 transition-all`}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                    <AlertCircle size={14} />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={`w-full h-12 pl-12 pr-12 bg-[#1A1A1A] border ${
                      errors.password ? 'border-red-500' : 'border-white/10'
                    } rounded-lg text-white text-sm placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-3 focus:ring-purple-500/10 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                    <AlertCircle size={14} />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-[18px] h-[18px] rounded border border-white/20 bg-[#1A1A1A] checked:bg-gradient-to-br checked:from-purple-500 checked:to-blue-500 checked:border-transparent cursor-pointer transition-all"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-400 cursor-pointer select-none">
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-sm text-purple-500 hover:text-purple-400 hover:underline transition-colors inline-block"
                >
                  Forgot your password?
                </button>
              </div>
            </form>

            {/* Switch to Register */}
            <div className="text-center mt-6 text-sm text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-purple-500 font-semibold hover:text-purple-400 hover:underline transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPasswordModal} 
        onClose={() => setShowForgotPasswordModal(false)} 
      />
    </>
  );
};

export default Login;