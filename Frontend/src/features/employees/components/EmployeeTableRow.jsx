import { Eye, PencilLine, Trash2 } from 'lucide-react';
import { formatJoinDate, getEmployeeCode } from '../utils/employee.utils';
import StatusToggle from '../../../components/ui/StatusToggle';

export default function EmployeeTableRow({
  employee,
  index,
  onDelete,
  onEdit,
  onView,
  onToggleStatus,
  isStatusUpdating = false,
  canEdit = false,
  canDelete = false,
}) {
  return (
    <tr className="border-t border-slate-100 bg-white">
      <td className="px-5 py-4 text-xs">{index + 1}</td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {employee.avatarUrl && (
            <img
              src={employee.avatarUrl}
              alt={employee.name}
              className="h-9 w-9 rounded-full object-cover"
            />
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-slate-900">{employee.name}</span>
            <span className="text-xs text-slate-500">{getEmployeeCode(employee)}</span>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-xs">{employee.gender || '-'}</td>
      <td className="px-5 py-4 text-xs">{employee.department || '-'}</td>
      <td className="px-5 py-4 text-xs">{employee.phone || '-'}</td>
      <td className="px-5 py-4 text-xs">{employee.email || '-'}</td>
      
      <td className="px-5 py-4 text-xs">{formatJoinDate(employee.join_date)}</td>
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
            className="flex h-10 w-10 items-center justify-center rounded-none bg-blue-50 text-blue-700 hover:bg-blue-100"
            title="View employee"
            aria-label="View employee"
          >
            <Eye size={16} />
            
          </button>
          {canEdit && (
            <button
              onClick={() => onEdit(employee)}
              className="flex h-10 w-10 items-center justify-center rounded-none bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              <PencilLine size={16} />
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => onDelete(employee.id)}
              className="flex h-10 w-10 items-center justify-center rounded-none bg-rose-50 text-rose-700 hover:bg-rose-100"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
