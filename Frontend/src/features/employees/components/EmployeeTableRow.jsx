import { Eye, PencilLine, Trash2 } from 'lucide-react';
import { formatJoinDate, getEmployeeCode } from '../utils/employee.utils';
import StatusToggle from '../../../components/ui/StatusToggle';

export default function EmployeeTableRow({
  employee, index, onDelete, onEdit, onView, onToggleStatus,
  isStatusUpdating = false, canEdit = false, canDelete = false,
}) {
  return (
    <tr className="border-t t-divider bg-transparent transition hover:bg-[var(--bg-row-hover)]">
      <td className="px-5 py-4 font-mono text-xs t-text-muted">{index + 1}</td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {employee.avatarUrl && (
            <img src={employee.avatarUrl} alt={employee.name} className="h-9 w-9 rounded-xl object-cover" />
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold t-text-primary">{employee.name}</span>
            <span className="font-mono text-xs t-text-subtle">{getEmployeeCode(employee)}</span>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-xs t-text-secondary">{employee.gender || '-'}</td>
      <td className="px-5 py-4 text-xs t-text-secondary">{employee.department || '-'}</td>
      <td className="px-5 py-4 text-xs t-text-secondary">{employee.phone || '-'}</td>
      <td className="px-5 py-4 text-xs t-text-secondary">{employee.email || '-'}</td>
      <td className="px-5 py-4 text-xs t-text-secondary">{formatJoinDate(employee.join_date)}</td>
      <td className="px-5 py-4">
        <StatusToggle
          isActive={employee.status !== 'inactive'}
          disabled={!canEdit || isStatusUpdating}
          onToggle={() => onToggleStatus(employee)}
        />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(employee)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border t-border bg-[var(--bg-input)] t-text-secondary transition hover:scale-[1.02] hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
            title="View employee" aria-label="View employee"
          >
            <Eye size={16} />
          </button>
          {canEdit && (
            <button
              onClick={() => onEdit(employee)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border t-border bg-[var(--bg-input)] text-emerald-500 transition hover:scale-[1.02] hover:border-emerald-500/40 hover:bg-emerald-500/10"
            >
              <PencilLine size={16} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(employee.id)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border t-border bg-[var(--bg-input)] text-rose-500 transition hover:scale-[1.02] hover:border-rose-500/40 hover:bg-rose-500/10"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
