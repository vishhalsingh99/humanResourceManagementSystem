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
        <h2 className="text-xl font-medium text-slate-900">Employee Details</h2>

        <p className="mt-2 text-sm text-slate-500">
          {employeeCount} employee{employeeCount !== 1 ? 's' : ''} available
        </p>

        <div className="mt-3 inline-flex flex-wrap gap-1 rounded-none border border-slate-300 bg-slate-50 p-1">
          {statusFilterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusFilterChange(option.value)}
              className={`rounded-none px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === option.value
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
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
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search employee"
            className="w-full rounded-none border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500 sm:w-80"
          />
        </div>

        {canCreate && (
          <button
            onClick={onAdd}
            className="flex items-center justify-center gap-2 rounded-none bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 cursor-pointer"
          >
            <Plus size={18} />
            Add Employee
          </button>
        )}

        <button
          onClick={onDownloadPdf}
          className="flex items-center justify-center gap-2 rounded-none bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 cursor-pointer"
        >
          <Download size={18} />
          Print
        </button>
      </div>
    </div>
  );
}
