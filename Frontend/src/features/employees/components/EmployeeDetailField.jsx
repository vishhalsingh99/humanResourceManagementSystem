export default function EmployeeDetailField({ label, value }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <p className="w-56 font-semibold t-text-secondary">{label}:</p>
      <div className="flex-1 border-b border-dotted t-divider pb-1 t-text-muted">
        {value || 'N/A'}
      </div>
    </div>
  );
}
