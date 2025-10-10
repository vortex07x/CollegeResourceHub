import { useEffect, useState } from 'react';
import { Server, Loader2, CheckCircle2, AlertCircle, Wifi } from 'lucide-react';

const ServerWarmupModal = ({ isOpen, onClose, status, retryCount }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (status === 'warming') {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (!isOpen) return null;

  const getStatusContent = () => {
    switch (status) {
      case 'warming':
        return {
          icon: <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />,
          title: 'Server is Waking Up',
          description: 'The server is starting from inactivity. This usually takes 30-60 seconds on the first request.',
          bgGradient: 'from-purple-500/20 to-blue-500/20',
          showProgress: true,
        };
      case 'ready':
        return {
          icon: <CheckCircle2 className="w-16 h-16 text-green-500" />,
          title: 'Server is Ready!',
          description: 'You can now use all features normally.',
          bgGradient: 'from-green-500/20 to-emerald-500/20',
          showProgress: false,
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-16 h-16 text-red-500" />,
          title: 'Connection Issue',
          description: 'Unable to reach the server. Please check your internet connection.',
          bgGradient: 'from-red-500/20 to-orange-500/20',
          showProgress: false,
        };
      default:
        return null;
    }
  };

  const content = getStatusContent();
  if (!content) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${content.bgGradient} opacity-50`} />
        
        {/* Content */}
        <div className="relative p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {content.icon}
              {status === 'warming' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Server className="w-6 h-6 text-white animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center mb-3">
            {content.title}
            {status === 'warming' && <span className="inline-block w-8 text-left">{dots}</span>}
          </h2>

          {/* Description */}
          <p className="text-gray-400 text-center mb-6 leading-relaxed">
            {content.description}
          </p>

          {/* Progress Bar */}
          {content.showProgress && (
            <div className="mb-6">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse" 
                     style={{ width: '70%' }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Initializing...</span>
                <span>{retryCount > 0 ? `Attempt ${retryCount + 1}` : 'First attempt'}</span>
              </div>
            </div>
          )}

          {/* Status Messages */}
          <div className="space-y-2 bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 text-sm">
              <Wifi className={`w-4 h-4 ${status === 'warming' ? 'text-yellow-500 animate-pulse' : status === 'ready' ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-gray-300">
                {status === 'warming' && 'Connecting to server...'}
                {status === 'ready' && 'Connected successfully'}
                {status === 'error' && 'Connection failed'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Server className={`w-4 h-4 ${status === 'warming' ? 'text-yellow-500 animate-pulse' : status === 'ready' ? 'text-green-500' : 'text-gray-500'}`} />
              <span className="text-gray-300">
                {status === 'warming' && 'Server starting up...'}
                {status === 'ready' && 'Server ready'}
                {status === 'error' && 'Server unavailable'}
              </span>
            </div>
          </div>

          {/* Info Box */}
          {status === 'warming' && (
            <div className="mt-4 bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <p className="text-xs text-purple-200 text-center">
                💡 <strong>Why does this happen?</strong> Free hosting services put inactive servers to sleep to save resources. 
                This only happens after periods of inactivity.
              </p>
            </div>
          )}

          {/* Close Button (only for ready state) */}
          {status === 'ready' && (
            <button
              onClick={onClose}
              className="mt-6 w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          )}

          {/* Retry Button (only for error state) */}
          {status === 'error' && (
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Retry Connection
            </button>
          )}
        </div>

        {/* Animated Border */}
        {status === 'warming' && (
          <div className="absolute inset-0 border-2 border-purple-500/50 rounded-2xl animate-pulse pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default ServerWarmupModal;