export default function EmployeeDetailField({ label, value }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <p className="w-56 font-semibold text-slate-900">{label}:</p>

      <div className="flex-1 border-b border-dotted border-slate-500 pb-1 text-slate-700">
        {value || 'N/A'}
      </div>
    </div>
  );
}
