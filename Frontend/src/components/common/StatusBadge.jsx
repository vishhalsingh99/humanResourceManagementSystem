const toneClasses = {
  green: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
  red: 'bg-red-500/15 text-red-300 border border-red-500/25',
  yellow: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  blue: 'bg-neutral-800 text-neutral-200 border border-neutral-700',
  slate: 'bg-neutral-800/80 text-neutral-300 border border-neutral-700',
};

export default function StatusBadge({ children, tone = 'slate', className = '' }) {
  return (
    <span
      className={`inline-flex rounded-xl px-2 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
