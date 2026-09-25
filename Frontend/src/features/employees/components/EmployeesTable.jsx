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
        className="rounded-2xl"
        tableClassName="min-w-full border-collapse"
        headClassName=""
        headerRowClassName="bg-neutral-950/80 text-left text-xs"
        headerCellClassName="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-400"
      >
        {employees.length === 0 ? (
          <tr>
            <td colSpan={10} className="px-5 py-16 text-center text-neutral-500">
              <BookXIcon size={48} className="mx-auto mb-4 text-red-400/50" />
              No employees found
            </td>
          </tr>
        ) : (
          employees.map((employee, index) => (
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
          ))
        )}
      </DataTable>
    </div>
  );
}
