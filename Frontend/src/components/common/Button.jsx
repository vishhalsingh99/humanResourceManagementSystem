import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:bg-red-400 hover:scale-[1.02] disabled:opacity-70',
  secondary:
    'border t-border bg-[var(--bg-input)] t-text-secondary hover:bg-[var(--bg-row-hover)] hover:t-text-primary disabled:opacity-60',
  ghost:
    't-text-muted hover:bg-[var(--bg-row-hover)] hover:t-text-primary disabled:opacity-60',
};

export default function Button({
  children,
  variant = 'primary',
  icon: Icon,
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : Icon ? <Icon size={18} /> : null}
      {children}
    </button>
  );
}
