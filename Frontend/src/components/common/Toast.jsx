import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const config = {
  success: {
    icon: CheckCircle,
    bar: 'bg-emerald-400',
    bg: 'border-l-4 border-emerald-500 bg-neutral-900/95',
    iconColor: 'text-emerald-400',
    title: 'Success',
  },
  error: {
    icon: XCircle,
    bar: 'bg-red-400',
    bg: 'border-l-4 border-red-500 bg-neutral-900/95',
    iconColor: 'text-red-400',
    title: 'Error',
  },
  warning: {
    icon: AlertCircle,
    bar: 'bg-amber-400',
    bg: 'border-l-4 border-amber-500 bg-neutral-900/95',
    iconColor: 'text-amber-400',
    title: 'Warning',
  },
  info: {
    icon: Info,
    bar: 'bg-red-400/80',
    bg: 'border-l-4 border-red-500/80 bg-neutral-900/95',
    iconColor: 'text-red-300',
    title: 'Info',
  },
};

export default function Toast({ message, type = 'success', onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = setTimeout(() => setVisible(true), 10);
    const exit = setTimeout(() => setVisible(false), 2700);
    const close = setTimeout(onClose, 3000);
    return () => {
      clearTimeout(enter);
      clearTimeout(exit);
      clearTimeout(close);
    };
  }, [onClose]);

  const { icon: Icon, bar, bg, iconColor, title } = config[type] || config.success;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-80 overflow-hidden rounded-2xl border border-neutral-800/80 shadow-[0_0_30px_rgba(239,68,68,0.12)] backdrop-blur-md transition-all duration-300
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${bg}`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon size={20} className={`mt-0.5 shrink-0 ${iconColor}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-100">{title}</p>
          <p className="mt-0.5 text-sm leading-snug text-neutral-400">{message}</p>
        </div>
        <button onClick={onClose} className="shrink-0 cursor-pointer text-neutral-500 hover:text-neutral-200">
          <X size={16} />
        </button>
      </div>
      <div className={`h-1 ${bar} animate-[shrink_3s_linear_forwards]`} />
    </div>
  );
}
