import { Download, Plus, Search } from 'lucide-react';

const statusFilterOptions = [
  { value: 'all',      label: 'All' },
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function EmployeesToolbar({
  employeeCount, search, onAdd, canCreate = false, onDownloadPdf,
  onSearchChange, statusFilter = 'all', onStatusFilterChange,
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-xl font-medium t-text-heading">Employee Details</h2>
        <p className="mt-2 font-mono text-sm t-text-subtle">
          {employeeCount} employee{employeeCount !== 1 ? 's' : ''} available
        </p>
        <div className="mt-3 inline-flex flex-wrap gap-1 rounded-xl border t-border bg-[var(--bg-input)] p-1">
          {statusFilterOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusFilterChange(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition duration-200 ${
                statusFilter === opt.value
                  ? 'bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.3)]'
                  : 't-text-muted hover:bg-[var(--bg-row-hover)] hover:t-text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 t-text-subtle" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search employee"
            className="ui-input w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none sm:w-80"
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
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border t-border bg-[var(--bg-input)] px-5 py-3 text-sm font-semibold t-text-secondary transition hover:scale-[1.02] hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-500"
        >
          <Download size={18} />
          Print
        </button>
      </div>
    </div>
  );
}
