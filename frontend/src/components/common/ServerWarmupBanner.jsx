import { useEffect, useState } from 'react';
import { Server, Loader2, CheckCircle2, X, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ServerWarmupBanner = ({ isVisible, status, retryCount }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (status === 'warming') {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status]);

  const getStatusContent = () => {
    switch (status) {
      case 'warming':
        return {
          icon: <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />,
          message: `Server is waking up${dots}`,
          bgColor: 'from-purple-500/10 to-blue-500/10',
          borderColor: 'border-purple-500/30',
          textColor: 'text-purple-300',
        };
      case 'ready':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
          message: 'Server is ready!',
          bgColor: 'from-green-500/10 to-emerald-500/10',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-300',
        };
      case 'error':
        return {
          icon: <Wifi className="w-5 h-5 text-red-400" />,
          message: 'Connection issue - check your internet',
          bgColor: 'from-red-500/10 to-orange-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-300',
        };
      default:
        return null;
    }
  };

  const content = getStatusContent();

  return (
    <AnimatePresence>
      {isVisible && content && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-16 left-0 right-0 z-[100] px-4 sm:px-6 lg:px-8 py-3`}
        >
          <div className={`max-w-6xl mx-auto bg-gradient-to-r ${content.bgColor} border ${content.borderColor} rounded-lg backdrop-blur-sm`}>
            <div className="flex items-center justify-between px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {content.icon}
                </div>
                <p className={`${content.textColor} text-sm sm:text-base font-medium whitespace-nowrap sm:whitespace-normal truncate sm:truncate-none`}>
                  {content.message}
                </p>
                {status === 'warming' && retryCount > 0 && (
                  <span className="hidden md:inline text-xs text-gray-400 ml-2">
                    (Attempt {retryCount + 1})
                  </span>
                )}
              </div>
              
              {status === 'ready' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex-shrink-0 ml-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ServerWarmupBanner;