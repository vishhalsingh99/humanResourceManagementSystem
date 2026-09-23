export default function StatusPill({ status }) {
  const isActive = status === 'active';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive ? 'bg-accent-soft text-accent-soft-fg' : 'bg-surface-2 text-fg-muted'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-accent' : 'bg-fg-subtle'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}
