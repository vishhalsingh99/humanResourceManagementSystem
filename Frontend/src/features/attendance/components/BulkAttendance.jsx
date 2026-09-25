import { memo } from 'react';
import { ArrowLeft, Save, Search } from 'lucide-react';
import Button from '../../../components/common/Button';
import InputField from '../../../components/common/InputField';
import SelectField from '../../../components/common/SelectField';
import DataTable from '../../../components/table/DataTable';
import { ATTENDANCE_STATUSES } from '../utils/constants';
import { getEmployeeCode } from '../utils/attendanceHelpers';

function BulkAttendance({ criteria, departmentOptions, designationOptions, employees, isSaving, showRows, onCriteriaChange, onSearch, onClose, onSave, onSetAllStatus, getRow, onRowChange }) {
  return (
    <div className="p-4 sm:p-6 mt-18 lg:p-10">
      <div className="ui-card rounded-2xl">
        <div className="flex items-center justify-between border-b t-divider px-5 py-4">
          <h2 className="m-0 text-xl font-semibold t-text-heading">Select Criteria</h2>
          <Button type="button" onClick={onClose} variant="secondary" icon={ArrowLeft} className="rounded-lg">Back</Button>
        </div>
        <form onSubmit={onSearch} className="grid gap-5 px-5 py-5 md:grid-cols-3">
          <SelectField label="Department" value={criteria.department} onChange={(e) => onCriteriaChange('department', e.target.value)} options={departmentOptions} inputClassName="rounded-lg" />
          <SelectField label="Designation" value={criteria.designation} onChange={(e) => onCriteriaChange('designation', e.target.value)} options={designationOptions} inputClassName="rounded-lg" />
          <InputField type="date" label="Attendance Date" required value={criteria.date} onChange={(e) => onCriteriaChange('date', e.target.value)} inputClassName="rounded-lg" />
          <div className="flex justify-end md:col-span-3">
            <Button type="submit" icon={Search} className="rounded-lg bg-red-500 hover:bg-red-400">Search</Button>
          </div>
        </form>
      </div>

      {showRows && (
        <div className="mt-6 ui-card rounded-2xl">
          <div className="flex flex-col gap-4 border-b t-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="m-0 text-lg font-semibold t-text-heading">Employee List</h3>
              <p className="mt-1 text-sm t-text-muted">{employees.length} employee{employees.length !== 1 ? 's' : ''} found for {criteria.date}</p>
            </div>
            <Button type="button" icon={Save} disabled={isSaving || employees.length === 0} onClick={onSave} className="self-start rounded-lg bg-red-500 hover:bg-red-400 lg:self-auto">
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b t-divider px-5 py-4 text-sm t-text-secondary">
            <span className="font-semibold t-text-primary">Set all employees as</span>
            {ATTENDANCE_STATUSES.map((status) => (
              <label key={status} className="inline-flex cursor-pointer items-center gap-1.5">
                <input type="radio" name="bulk-status" onChange={() => onSetAllStatus(status)} className="accent-red-500" />
                <span>{status}</span>
              </label>
            ))}
          </div>

          <div className="px-5 pb-5">
            <DataTable
              headers={['#', 'Employee Code', 'Name', 'Department', 'Designation', 'Attendance', 'Source', 'Entry Time', 'Exit Time', 'Note']}
              className="rounded-2xl border-0"
              tableClassName="w-full min-w-230 border-collapse"
              headerRowClassName="border-y t-divider text-left text-xs"
              headerCellClassName="px-3 py-3 text-xs font-semibold uppercase tracking-wide t-text-muted"
            >
              {employees.map((employee, index) => {
                const row = getRow(employee);
                return (
                  <tr key={employee.id} className="border-b t-divider align-top transition-colors hover:bg-[var(--bg-row-hover)]">
                    <td className="px-3 py-4 text-sm t-text-subtle">{index + 1}</td>
                    <td className="px-3 py-4 text-sm t-text-secondary">{getEmployeeCode(employee)}</td>
                    <td className="px-3 py-4 text-sm font-semibold t-text-primary">{employee.name}</td>
                    <td className="px-3 py-4 text-sm t-text-secondary">{employee.department || '-'}</td>
                    <td className="px-3 py-4 text-sm t-text-secondary">{employee.designation || '-'}</td>
                    <td className="px-3 py-4">
                      <div className="grid gap-1.5 text-sm t-text-secondary">
                        {ATTENDANCE_STATUSES.map((status) => (
                          <label key={status} className="inline-flex cursor-pointer items-center gap-1.5">
                            <input type="radio" name={`attendance-${employee.id}`} checked={row.status === status} onChange={() => onRowChange(employee.id, 'status', status)} className="accent-red-500" />
                            <span>{status}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm t-text-subtle">N/A</td>
                    <td className="px-3 py-4">
                      <input type="time" value={row.check_in} onChange={(e) => onRowChange(employee.id, 'check_in', e.target.value)} className="ui-input w-32 rounded-lg px-3 py-2 text-sm" />
                    </td>
                    <td className="px-3 py-4">
                      <input type="time" value={row.check_out} onChange={(e) => onRowChange(employee.id, 'check_out', e.target.value)} className="ui-input w-32 rounded-lg px-3 py-2 text-sm" />
                    </td>
                    <td className="px-3 py-4">
                      <input value={row.notes} onChange={(e) => onRowChange(employee.id, 'notes', e.target.value)} className="ui-input w-40 rounded-lg px-3 py-2 text-sm" />
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-10 text-center t-text-subtle">No employees found for selected criteria.</td></tr>
              )}
            </DataTable>
          </div>
        </div>
      )}
    </div>
  );
}
export default memo(BulkAttendance);
