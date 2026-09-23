export default function EmptyState({ icon: Icon, message = 'No records found', colSpan }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-slate-400">
      {Icon && <Icon size={44} />}
      <span>{message}</span>
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
