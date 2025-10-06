import { useState } from 'react';
import { X, Mail, KeyRound, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import authService from '../../services/authService';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const resetForm = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        toast.success('OTP sent to your email!', {
          position: 'top-right',
          style: {
            background: '#1A1A1A',
            color: '#fff',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          },
        });
        setStep(2);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP', {
        position: 'top-right',
      });
      setErrors({ email: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!otp) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    if (otp.length !== 6) {
      setErrors({ otp: 'OTP must be 6 digits' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.verifyOTP(email, otp);
      if (response.success) {
        toast.success('OTP verified successfully!', {
          position: 'top-right',
          style: {
            background: '#1A1A1A',
            color: '#fff',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          },
        });
        setStep(3);
      }
    } catch (error) {
      toast.error(error.message || 'Invalid OTP', {
        position: 'top-right',
      });
      setErrors({ otp: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!password) {
      setErrors({ password: 'Password is required' });
      return;
    }

    if (password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPassword(email, otp, password);
      if (response.success) {
        toast.success('Password reset successful! Please login.', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#1A1A1A',
            color: '#fff',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          },
        });
        handleClose();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to reset password', {
        position: 'top-right',
      });
      setErrors({ password: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-sm text-gray-400">
            {step === 1 && 'Enter your email to receive OTP'}
            {step === 2 && 'Enter the 6-digit OTP sent to your email'}
            {step === 3 && 'Create your new password'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-purple-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Input */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <div className="relative">
                <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className={`w-full h-12 pl-12 pr-4 bg-[#1A1A1A] border ${
                    errors.otp ? 'border-red-500' : 'border-white/10'
                  } rounded-lg text-white text-sm placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-3 focus:ring-purple-500/10 transition-all tracking-widest text-center`}
                />
              </div>
              {errors.otp && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                  <AlertCircle size={14} />
                  <span>{errors.otp}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 h-12 bg-white/5 text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendOTP}
              className="w-full text-sm text-purple-500 hover:text-purple-400 hover:underline transition-colors"
            >
              Resend OTP
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className={`w-full h-12 pl-12 pr-4 bg-[#1A1A1A] border ${
                    errors.password ? 'border-red-500' : 'border-white/10'
                  } rounded-lg text-white text-sm placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-3 focus:ring-purple-500/10 transition-all`}
                />
              </div>
              {errors.password && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                  <AlertCircle size={14} />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            <div>
              <div className="relative">
                <CheckCircle size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`w-full h-12 pl-12 pr-4 bg-[#1A1A1A] border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-white/10'
                  } rounded-lg text-white text-sm placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-3 focus:ring-purple-500/10 transition-all`}
                />
              </div>
              {errors.confirmPassword && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                  <AlertCircle size={14} />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;