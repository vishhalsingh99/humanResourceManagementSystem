import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const config = {
  success: {
    icon: CheckCircle,  
    bar: 'bg-green-400',
    bg: 'bg-white border-l-4 border-green-500',
    iconColor: 'text-green-500',
    title: 'Success',
  },
  error: {
    icon: XCircle,
    bar: 'bg-red-400',
    bg: 'bg-white border-l-4 border-red-500',
    iconColor: 'text-red-500',
    title: 'Error',
  },
  warning: {
    icon: AlertCircle,
    bar: 'bg-yellow-400',
    bg: 'bg-white border-l-4 border-yellow-500',
    iconColor: 'text-yellow-500',
    title: 'Warning',
  },
  info: {
    icon: Info,
    bar: 'bg-blue-400',
    bg: 'bg-white border-l-4 border-blue-500',
    iconColor: 'text-blue-500',
    title: 'Info',
  },
};

export default function Toast({ message, type = 'success', onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // trigger enter animation
    const enter = setTimeout(() => setVisible(true), 10);
    // start exit animation before unmount
    const exit = setTimeout(() => setVisible(false), 2700);
    const close = setTimeout(onClose, 3000);
    return () => { clearTimeout(enter); clearTimeout(exit); clearTimeout(close); };
  }, [onClose]);

  const { icon: Icon, bar, bg, iconColor, title } = config[type] || config.success;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-80 rounded-lg shadow-xl overflow-hidden transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${bg}`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon size={20} className={`shrink-0 mt-0.5 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          <p className="text-sm text-gray-600 mt-0.5 leading-snug">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0">
          <X size={16} />
        </button>
      </div>
      {/* Progress bar */}
      <div className={`h-1 ${bar} animate-[shrink_3s_linear_forwards]`} />
    </div>
  );
}
