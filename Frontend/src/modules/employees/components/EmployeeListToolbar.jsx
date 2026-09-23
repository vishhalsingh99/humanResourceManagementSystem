import { motion } from 'framer-motion';
import SearchBar from '../../../components/common/SearchBar';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

export default function EmployeeListToolbar({ search, onSearchChange, statusFilter, onStatusChange, counts }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <SearchBar
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name, code, department..."
        className="w-full sm:max-w-sm"
        inputClassName="rounded-xl border-border bg-surface text-fg focus:border-primary"
        iconClassName="text-fg-subtle"
      />

      <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-2 p-1">
        {FILTERS.map((filter) => {
          const isActive = statusFilter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onStatusChange(filter.key)}
              className="relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            >
              {isActive && (
                <motion.span
                  layoutId="employee-status-filter-pill"
                  className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <span className={`relative z-10 ${isActive ? 'text-primary' : 'text-fg-muted'}`}>
                {filter.label}
                <span className="ml-1.5 text-xs opacity-70">{counts[filter.key]}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
