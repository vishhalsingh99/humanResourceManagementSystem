export default function EmployeeDetailField({ label, value }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <p className="w-56 font-semibold text-neutral-200">{label}:</p>

      <div className="flex-1 border-b border-dotted border-neutral-600 pb-1 text-neutral-300">
        {value || 'N/A'}
      </div>
    </div>
  );
}
