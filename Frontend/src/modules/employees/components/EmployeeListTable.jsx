import { motion } from 'framer-motion';
import { Mail, Phone } from 'lucide-react';
import { SkeletonRow } from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/common/EmptyState';
import { staggerContainer, staggerItem } from '../../../lib/motion';
import StatusPill from './StatusPill';

const COLUMNS = ['Employee', 'Department', 'Designation', 'Contact', 'Status'];

export default function EmployeeListTable({ employees, isLoading }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {COLUMNS.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>

        {isLoading ? (
          <tbody>
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonRow key={index} columns={COLUMNS.length} />
            ))}
          </tbody>
        ) : (
          <motion.tbody {...staggerContainer}>
            {employees.map((employee) => (
              <motion.tr
                key={employee.id}
                {...staggerItem}
                className="border-b border-border last:border-b-0 transition-colors hover:bg-surface-hover"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-soft-fg">
                      {employee.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-fg">{employee.name}</p>
                      <p className="truncate text-xs text-fg-subtle">{employee.employeeCode}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-fg-muted">{employee.department}</td>
                <td className="px-4 py-3 text-fg-muted">{employee.designation}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5 text-xs text-fg-muted">
                    {employee.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail size={12} className="text-fg-subtle" /> {employee.email}
                      </span>
                    )}
                    {employee.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={12} className="text-fg-subtle" /> {employee.phone}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={employee.status} />
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        )}
      </table>

      {!isLoading && employees.length === 0 && (
        <div className="px-4 py-10">
          <EmptyState message="No employees match your search or filter." />
        </div>
      )}
    </div>
  );
}
