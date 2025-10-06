import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import authService from '../../services/authService';
import useAuthStore from '../../store/useAuthStore';

const SessionTimer = () => {
  const { isAuthenticated } = useAuthStore();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const updateTimer = () => {
      const remaining = authService.getTimeUntilExpiry();
      
      if (remaining <= 0) {
        authService.logout();
        window.location.href = '/login';
        return;
      }

      // Show warning if less than 5 minutes remaining
      setShowWarning(remaining < 5 * 60 * 1000);

      // Format time remaining
      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Update every second for accuracy

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div 
      className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-lg transition-all ${
        showWarning 
          ? 'bg-orange-500/10 border border-orange-500/20 text-orange-500 animate-pulse' 
          : 'bg-white/5 border border-white/10 text-gray-400'
      }`}
    >
      <Clock size={16} />
      <span className="font-medium">
        {showWarning ? 'Session expires soon: ' : 'Session: '}
        {timeRemaining}
      </span>
    </div>
  );
};

export default SessionTimer;