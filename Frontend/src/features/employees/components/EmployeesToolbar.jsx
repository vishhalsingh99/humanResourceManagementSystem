import { Download, Plus, Search } from 'lucide-react';

const statusFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function EmployeesToolbar({
  employeeCount,
  search,
  onAdd,
  canCreate = false,
  onDownloadPdf,
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-xl font-medium text-neutral-50">Employee Details</h2>

        <p className="mt-2 font-mono text-sm text-neutral-500">
          {employeeCount} employee{employeeCount !== 1 ? 's' : ''} available
        </p>

        <div className="mt-3 inline-flex flex-wrap gap-1 rounded-xl border border-neutral-800 bg-neutral-950/60 p-1">
          {statusFilterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusFilterChange(option.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition duration-200 ${
                statusFilter === option.value
                  ? 'bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.3)]'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
          />

          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search employee"
            className="w-full rounded-xl border border-neutral-700/90 bg-neutral-950/65 py-3 pl-11 pr-4 text-sm text-neutral-100 outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)] sm:w-80"
          />
        </div>

        {canCreate && (
          <button
            onClick={onAdd}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400"
          >
            <Plus size={18} />
            Add Employee
          </button>
        )}

        <button
          onClick={onDownloadPdf}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/60 px-5 py-3 text-sm font-semibold text-neutral-200 transition hover:scale-[1.02] hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
          <Download size={18} />
          Print
        </button>
      </div>
    </div>
  );
}
