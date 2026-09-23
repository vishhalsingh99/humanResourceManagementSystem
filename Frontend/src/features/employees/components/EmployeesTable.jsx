import { BookXIcon } from 'lucide-react';
import DataTable from '../../../components/table/DataTable';
import { employeeTableHeadings } from '../constants/employee.constants';
import EmployeeTableRow from './EmployeeTableRow';

export default function EmployeesTable({
  employees,
  onDelete,
  onEdit,
  onView,
  onToggleStatus,
  statusUpdatingId = null,
  canEdit = false,
  canDelete = false,
  startIndex = 0,
}) {
  return (
    <div className="mt-6">
      <DataTable
        headers={employeeTableHeadings}
        className="rounded-none"
        tableClassName="min-w-full border-collapse divide-slate-200"
        headClassName=""
        headerRowClassName="bg-[#eef5ff] text-left text-xs text-white"
        headerCellClassName="px-5 py-4 text-xs font-semibold text-slate-800"
      >
            {employees.map((employee, index) => (
              <EmployeeTableRow
                key={employee.id}
                employee={employee}
                index={startIndex + index}
                onDelete={onDelete}
                onEdit={onEdit}
                canEdit={canEdit}
                canDelete={canDelete}
                onView={onView}
                onToggleStatus={onToggleStatus}
                isStatusUpdating={statusUpdatingId === employee.id}
              />
            ))}

            {employees.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-16 items-center text-center text-slate-400">
                  No employees found
                </td>
              </tr>
            )}
            {employees.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-16 items-center text-center text-slate-400">
                  <BookXIcon size={48} className="mx-auto mb-4" />
                </td>
              </tr>
            )}
      </DataTable>
    </div>
  );
}
