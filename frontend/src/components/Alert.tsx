import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

interface AlertProps {
  type?: 'success' | 'error' | 'info';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type = 'error', message, onClose }) => {
  const styles = {
    error: 'bg-red-50 text-red-800 border-red-200 icon-red-500',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 icon-emerald-500',
    info: 'bg-blue-50 text-blue-800 border-blue-200 icon-blue-500'
  };

  const icons = {
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
  };

  return (
    <div className={`p-4 rounded-lg border flex items-start justify-between gap-3 shadow-sm ${styles[type]}`}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <span className="text-sm font-medium leading-relaxed">{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded text-gray-500">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
