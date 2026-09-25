export default function EmptyState({ icon: Icon, message = 'No records found', colSpan }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center t-text-subtle">
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border t-border bg-[var(--bg-input)] text-red-400/80 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
          <Icon size={28} />
        </div>
      )}
      <span className="text-sm">{message}</span>
    </div>
  );

  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan}>{content}</td>
      </tr>
    );
  }

  return content;
}
