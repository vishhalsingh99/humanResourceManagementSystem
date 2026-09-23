import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Users } from 'lucide-react';
import { pageTransition } from '../../../lib/motion';
import { useEmployeeListController } from '../hooks/useEmployeeListController';
import EmployeeListToolbar from './EmployeeListToolbar';
import EmployeeListTable from './EmployeeListTable';

/**
 * Presentation layer (Layer 1): pure UI, wired to the controller hook.
 * No fetch logic, no axios, no zod — just render what the controller gives it.
 */
export default function EmployeeListPage() {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    employees,
    counts,
    isLoading,
    isFetching,
    isError,
    errorMessage,
    refetch,
  } = useEmployeeListController();

  return (
    <motion.div {...pageTransition} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-fg">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-fg">Employee Directory</h1>
            <p className="text-sm text-fg-muted">{counts.all} employees across your company</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-fg-muted transition hover:bg-surface-hover hover:text-fg"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="mb-4">
        <EmployeeListToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          counts={counts}
        />
      </div>

      {isError ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-4 text-sm text-danger-soft-fg"
        >
          <AlertTriangle size={18} />
          {errorMessage}
        </motion.div>
      ) : (
        <EmployeeListTable employees={employees} isLoading={isLoading} />
      )}
    </motion.div>
  );
}
