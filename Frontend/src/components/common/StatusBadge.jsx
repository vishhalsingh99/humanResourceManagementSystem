const toneClasses = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  slate: 'bg-slate-100 text-slate-700',
};

export default function StatusBadge({ children, tone = 'slate', className = '' }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}>
      {children}
    </span>
  );
}
