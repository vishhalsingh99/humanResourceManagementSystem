const toneClasses = {
  green:  'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 dark:text-emerald-300',
  red:    'bg-red-500/15 text-red-600 border border-red-500/30 dark:text-red-300',
  yellow: 'bg-amber-500/15 text-amber-600 border border-amber-500/30 dark:text-amber-300',
  blue:   'bg-sky-500/10 text-sky-600 border border-sky-500/20 dark:text-sky-300',
  slate:  'bg-[var(--bg-badge-neutral)] t-text-badge border t-border',
};

export default function StatusBadge({ children, tone = 'slate', className = '' }) {
  return (
    <span className={`inline-flex rounded-xl px-2 py-1 text-xs font-semibold ${toneClasses[tone] ?? toneClasses.slate} ${className}`}>
      {children}
    </span>
  );
}
