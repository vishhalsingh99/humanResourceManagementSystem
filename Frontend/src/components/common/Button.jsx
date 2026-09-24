import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:bg-red-400 hover:shadow-[0_0_24px_rgba(239,68,68,0.35)] disabled:bg-red-500/40 disabled:shadow-none',
  secondary:
    'border border-neutral-700/90 bg-neutral-900/60 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800/80 disabled:opacity-50',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-emerald-600/40',
  warning:
    'bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:bg-amber-500/40',
  danger:
    'bg-rose-600 text-white hover:bg-rose-500 disabled:bg-rose-600/40',
  ghost:
    'bg-transparent text-neutral-300 hover:bg-neutral-800/70 hover:text-white disabled:opacity-50',
};

const sizes = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-5 py-3 text-sm',
  icon: 'h-10 w-10 p-0',
};

export default function Button({
  children,
  className = '',
  icon: Icon,
  size = 'md',
  variant = 'primary',
  type = 'button',
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:hover:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : Icon ? <Icon size={18} /> : null}
      {children}
    </button>
  );
}
