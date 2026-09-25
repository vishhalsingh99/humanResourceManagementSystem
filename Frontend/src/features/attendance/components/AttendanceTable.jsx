import { memo } from 'react';
import { CalendarDaysIcon, FileText, PencilLine, Trash2 } from 'lucide-react';
import DataTable from '../../../components/table/DataTable';
import FormatDate from '../../../components/common/FormatDate';
import StatusBadge from '../../../components/common/StatusBadge';
import { STATUS_TONES } from '../utils/constants';
import { getRecordEmployee } from '../utils/attendanceHelpers';

function AttendanceTable({ records, employeeById, canEdit = false, canDelete = false, onEdit, onDelete, onOpenCalendar, onViewSummary }) {
  const showActions = canEdit || canDelete || Boolean(onViewSummary);
  return(
  <DataTable
   headers={['Employee', 'Date', 'Check In', 'Check Out', 'Total Work Hours', 'Late By', 'Status']} actions={showActions}>
    {records.length === 0 ? <tr>
      <td colSpan={showActions ? 8 : 7} className="px-4 py-8 text-center text-neutral-500">No attendance records found</td>
      </tr> :
       records.map((record) => {
        const employee = getRecordEmployee(record, employeeById)
        return(
        <tr key={record.id} className="border-t border-neutral-800 transition-colors hover:bg-neutral-800/30">
          <td className="px-4 py-3 text-sm text-neutral-100">{record.employeeName || record.employee_name || employee?.name || 'N/A'}
          <span className="block text-xs text-neutral-500">{record.employeeCode || record.employee_code || employee?.employee_id || ''}</span></td>
          <td className="px-4 py-3 text-sm text-neutral-300"><FormatDate value={record.date} /></td>
          <td className="px-4 py-3 text-sm text-neutral-300">{record.check_in || '-'}</td>
          <td className="px-4 py-3 text-sm text-neutral-300">{record.check_out || '-'}</td>
          <td className="px-4 py-3 text-sm text-neutral-300">{record.totalWorkHours || record.total_work_hours || '-'}</td>
          <td className="px-4 py-3 text-sm text-neutral-300">
            {record.lateBy || '-'}
            {(record.isShortLeave || record.shortLeaveHalfDayApplied) && (
              <span className="mt-1 block text-xs font-semibold text-blue-400">
                {record.shortLeaveHalfDayApplied ? 'Short leave limit reached: Half Day' : 'Short leave'}
              </span>
            )}
          </td>
          <td className="px-4 py-3"><StatusBadge tone={STATUS_TONES[record.status] || 'slate'}>{record.status}</StatusBadge></td>
          {showActions && <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onOpenCalendar(record)} className="cursor-pointer rounded p-1 text-emerald-400 hover:bg-emerald-500/10" title="Attendance Calendar">
                <CalendarDaysIcon size={18} />
              </button>
              {onViewSummary && (
                <button type="button" onClick={() => onViewSummary(record)} className="cursor-pointer rounded p-1 text-violet-400 hover:bg-violet-500/10" title="Attendance Summary">
                  <FileText size={18} />
                </button>
              )}
              {canEdit && (
                <button type="button" onClick={() => onEdit(record)} className="cursor-pointer rounded p-1 text-blue-400 hover:bg-blue-500/10" title="Edit">
                  <PencilLine size={18} />
                </button>
              )}
              {canDelete && (
                <button type="button" onClick={() => onDelete(record.id)} className="cursor-pointer rounded p-1 text-red-400 hover:bg-red-500/10" title="Delete">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </td>
          }
        </tr>
        )
      })}
    

  </DataTable>
  )
}
export default memo(AttendanceTable);
