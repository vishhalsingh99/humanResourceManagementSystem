import { memo } from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '../../../components/common/Button';
import InputField from '../../../components/common/InputField';
import SelectField from '../../../components/common/SelectField';
import TextareaField from '../../../components/common/TextareaField';
import { ATTENDANCE_STATUSES } from '../utils/constants';
import { getEmployeeCode } from '../utils/attendanceHelpers';

function AttendanceForm({ form, employees, onChange, onSubmit, onClose, isSaving = false }) {
  return (
    <div className="mt-4 p-4 sm:p-6 lg:p-10">
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md sm:p-7"
      >
        <div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <Button type="button" onClick={onClose} variant="primary" icon={ArrowLeft} className="self-start" disabled={isSaving}>
            Back
          </Button>
          <div className="text-left lg:text-right">
            <h2 className="m-0 text-3xl font-semibold text-neutral-50">Update Attendance</h2>
            <p className="mt-2 text-sm text-neutral-400">Update the attendance details below.</p>
          </div>
        </div>
        <div className="pt-8">
          <h3 className="m-0 text-2xl font-semibold text-neutral-50">Attendance Details</h3>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <SelectField label="Employee" value={form.employee_id} onChange={(event) => onChange('employee_id', event.target.value)} required>
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({getEmployeeCode(employee)})
                </option>
              ))}
            </SelectField>
            <InputField type="date" label="Date" value={form.date} onChange={(event) => onChange('date', event.target.value)} required />
            <InputField type="time" label="Check In Time" value={form.check_in} onChange={(event) => onChange('check_in', event.target.value)} />
            <InputField type="time" label="Check Out Time" value={form.check_out} onChange={(event) => onChange('check_out', event.target.value)} />
            <SelectField label="Status" value={form.status} onChange={(event) => onChange('status', event.target.value)} options={ATTENDANCE_STATUSES} required />
            <TextareaField className="md:col-span-2 xl:col-span-3" label="Notes" value={form.notes} onChange={(event) => onChange('notes', event.target.value)} placeholder="Any additional notes..." />
          </div>
        </div>
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-neutral-800 pt-6 sm:flex-row sm:justify-end">
          <Button type="button" onClick={onClose} variant="secondary" disabled={isSaving}>
            Back
          </Button>
          <Button type="submit" variant="primary" loading={isSaving}>
            {isSaving ? 'Saving...' : 'Update Attendance'}
          </Button>
        </div>
      </form>
    </div>
  );
}
export default memo(AttendanceForm);
