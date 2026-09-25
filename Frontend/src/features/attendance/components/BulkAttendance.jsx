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
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <h2 className="m-0 text-xl font-semibold text-neutral-100">Select Criteria</h2>
          <Button type="button" onClick={onClose} variant="secondary" icon={ArrowLeft} className="rounded-lg">Back</Button>
        </div>
        <form onSubmit={onSearch} className="grid gap-5 px-5 py-5 md:grid-cols-3">
          <SelectField label="Department" value={criteria.department} onChange={(event) => onCriteriaChange('department', event.target.value)} options={departmentOptions} inputClassName="rounded-lg" />
          <SelectField label="Designation" value={criteria.designation} onChange={(event) => onCriteriaChange('designation', event.target.value)} options={designationOptions} inputClassName="rounded-lg" />
          <InputField type="date" label="Attendance Date" required value={criteria.date} onChange={(event) => onCriteriaChange('date', event.target.value)} inputClassName="rounded-lg" />
          <div className="flex justify-end md:col-span-3">
            <Button type="submit" icon={Search} className="rounded-lg bg-red-500 hover:bg-red-400">Search</Button>
          </div>
        </form>
      </div>

      {showRows && (
        <div className="mt-6 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md">
          <div className="flex flex-col gap-4 border-b border-neutral-800 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="m-0 text-lg font-semibold text-neutral-100">Employee List</h3>
              <p className="mt-1 text-sm text-neutral-400">{employees.length} employee{employees.length !== 1 ? 's' : ''} found for {criteria.date}</p>
            </div>
            <Button type="button" icon={Save} disabled={isSaving || employees.length === 0} onClick={onSave} className="self-start rounded-lg bg-red-500 hover:bg-red-400 lg:self-auto">
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b border-neutral-800 px-5 py-4 text-sm text-neutral-300">
            <span className="font-semibold text-neutral-200">Set attendance for all employees as</span>
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
              headerRowClassName="border-y border-neutral-800 text-left text-xs"
              headerCellClassName="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-400"
            >
              {employees.map((employee, index) => {
                const row = getRow(employee);
                return (
                  <tr key={employee.id} className="border-b border-neutral-800 align-top transition-colors hover:bg-neutral-800/30">
                    <td className="px-3 py-4 text-sm text-neutral-500">{index + 1}</td>
                    <td className="px-3 py-4 text-sm text-neutral-300">{getEmployeeCode(employee)}</td>
                    <td className="px-3 py-4 text-sm font-semibold text-neutral-100">{employee.name}</td>
                    <td className="px-3 py-4 text-sm text-neutral-300">{employee.department || '-'}</td>
                    <td className="px-3 py-4 text-sm text-neutral-300">{employee.designation || '-'}</td>
                    <td className="px-3 py-4">
                      <div className="grid gap-1.5 text-sm text-neutral-300">
                        {ATTENDANCE_STATUSES.map((status) => (
                          <label key={status} className="inline-flex cursor-pointer items-center gap-1.5">
                            <input
                              type="radio"
                              name={`attendance-${employee.id}`}
                              checked={row.status === status}
                              onChange={() => onRowChange(employee.id, 'status', status)}
                              className="accent-red-500"
                            />
                            <span>{status}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-neutral-400">N/A</td>
                    <td className="px-3 py-4">
                      <input
                        type="time"
                        value={row.check_in}
                        onChange={(event) => onRowChange(employee.id, 'check_in', event.target.value)}
                        className="w-32 rounded-lg border border-neutral-700 bg-neutral-950/65 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-red-500/70"
                      />
                    </td>
                    <td className="px-3 py-4">
                      <input
                        type="time"
                        value={row.check_out}
                        onChange={(event) => onRowChange(employee.id, 'check_out', event.target.value)}
                        className="w-32 rounded-lg border border-neutral-700 bg-neutral-950/65 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-red-500/70"
                      />
                    </td>
                    <td className="px-3 py-4">
                      <input
                        value={row.notes}
                        onChange={(event) => onRowChange(employee.id, 'notes', event.target.value)}
                        className="w-40 rounded-lg border border-neutral-700 bg-neutral-950/65 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-red-500/70"
                      />
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-neutral-500">No employees found for selected criteria.</td>
                </tr>
              )}
            </DataTable>
          </div>
        </div>
      )}
    </div>
  );
}
export default memo(BulkAttendance);
