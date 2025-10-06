import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, Building2, X } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

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

    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.college) {
      newErrors.college = 'College name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        college: formData.college
      });
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
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
            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-sm text-gray-400">Join the community</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  className={`w-full h-12 pl-12 pr-4 bg-[#1A1A1A] border ${errors.name ? 'border-red-500' : 'border-white/10'
                    } rounded-lg text-white text-sm placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-3 focus:ring-purple-500/10 transition-all`}
                />
              </div>
              {errors.name && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                  <AlertCircle size={14} />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Email Input */}
            <div>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="College email address"
                  className={`w-full h-12 pl-12 pr-4 bg-[#1A1A1A] border ${errors.email ? 'border-red-500' : 'border-white/10'
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

            {/* College Input */}
            <div>
              <div className="relative">
                <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="College name"
                  className={`w-full h-12 pl-12 pr-4 bg-[#1A1A1A] border ${errors.college ? 'border-red-500' : 'border-white/10'
                    } rounded-lg text-white text-sm placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-3 focus:ring-purple-500/10 transition-all`}
                />
              </div>
              {errors.college && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                  <AlertCircle size={14} />
                  <span>{errors.college}</span>
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
                  className={`w-full h-12 pl-12 pr-12 bg-[#1A1A1A] border ${errors.password ? 'border-red-500' : 'border-white/10'
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

            {/* Confirm Password Input */}
            <div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className={`w-full h-12 pl-12 pr-12 bg-[#1A1A1A] border ${errors.confirmPassword ? 'border-red-500' : 'border-white/10'
                    } rounded-lg text-white text-sm placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-3 focus:ring-purple-500/10 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                  <AlertCircle size={14} />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            {/* Terms and Conditions Checkbox */}
            <div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="w-[18px] h-[18px] mt-0.5 rounded border border-white/20 bg-[#1A1A1A] checked:bg-gradient-to-br checked:from-purple-500 checked:to-blue-500 checked:border-transparent cursor-pointer transition-all flex-shrink-0"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-400 cursor-pointer select-none leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" className="text-purple-500 hover:text-purple-400 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-purple-500 hover:text-purple-400 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                  <AlertCircle size={14} />
                  <span>{errors.agreeToTerms}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="text-center mt-6 text-sm text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-purple-500 font-semibold hover:text-purple-400 hover:underline transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;