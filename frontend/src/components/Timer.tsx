import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  expiresAt: string;
  onExpire: () => void;
}

export const Timer: React.FC<TimerProps> = ({ expiresAt, onExpire }) => {
  const calculateRemaining = () => Math.max(0, new Date(expiresAt).getTime() - Date.now());

  const [timeLeftMs, setTimeLeftMs] = useState<number>(calculateRemaining);

  useEffect(() => {
    setTimeLeftMs(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      if (remaining <= 0) {
        setTimeLeftMs(0);
        clearInterval(interval);
        onExpire();
      } else {
        setTimeLeftMs(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = totalSeconds < 120; // < 2 mins
  const isWarning = totalSeconds < 600; // < 10 mins

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-base font-bold shadow-sm transition border ${
        isUrgent
          ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
          : isWarning
          ? 'bg-amber-100 text-amber-800 border-amber-300'
          : 'bg-blue-50 text-blue-800 border-blue-200'
      }`}
    >
      <Clock className="w-4 h-4 shrink-0" />
      <span>
        {hours > 0 ? `${pad(hours)}:` : ''}
        {pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
};
