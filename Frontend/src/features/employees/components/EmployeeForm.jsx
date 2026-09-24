import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { getEmployeeFormSections } from '../config/employeeForm.config';
import { getPhoneErrorMessage } from '../../../utils/phoneValidation';
import { getAadhaarErrorMessage, getPanErrorMessage, getSalaryErrorMessage } from '../../../utils/formValidation';
import { uploadEmployeeResume } from '../services/employees.api';
import AddMasterOptionModal from './AddMasterOptionModal';
import EmployeeFormSection from './EmployeeFormSection';

export default function EmployeeForm({
  editingEmployee,
  form,
  onClose,
  onFieldChange,
  onSubmit,
  isSaving = false,
  roles = [],
  departmentOptions,
  designationOptions,
  onAddOption,
  optionModalType,
  optionForm,
  isSavingOption,
  onOptionFormChange,
  onOptionFormSubmit,
  onCloseOptionModal,
}) {
  const [fieldErrors, setFieldErrors] = useState({
    phone: '',
    emergencyContact: '',
    salary: '',
    aadhaarNumber: '',
    panNumber: '',
    resumeFile: '',
    email: '',
  });

  const handleFieldChange = async (field, value) => {
    if (field === 'resumeFile') {
      if (value.error) {
        setFieldErrors((prev) => ({ ...prev, resumeFile: value.error }));
        return;
      }

      try {
        const response = await uploadEmployeeResume(value.file);
        onFieldChange('resumeFile', response.data.resumeFile);
        setFieldErrors((prev) => ({ ...prev, resumeFile: '' }));
      } catch (error) {
        setFieldErrors((prev) => ({
          ...prev,
          resumeFile: error.response?.data?.error || 'Unable to upload resume',
        }));
      }
      return;
    }

    const normalizedValue = field === 'panNumber' ? value.toUpperCase() : value;
    onFieldChange(field, normalizedValue);

    if (field === 'phone' || field === 'emergencyContact') {
      const error = value ? getPhoneErrorMessage(value) : '';
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    }

    if (field === 'salary') {
      setFieldErrors((prev) => ({ ...prev, salary: getSalaryErrorMessage(value) }));
    }

    if (field === 'aadhaarNumber') {
      setFieldErrors((prev) => ({ ...prev, aadhaarNumber: getAadhaarErrorMessage(value) }));
    }

    if (field === 'panNumber') {
      setFieldErrors((prev) => ({ ...prev, panNumber: getPanErrorMessage(normalizedValue) }));
    }
  };

  const employeeFormSections = getEmployeeFormSections(
    departmentOptions,
    designationOptions,
    Boolean(editingEmployee)
  );
  const selectedRole =
    roles.find((role) => String(role.id) === String(form.roleId)) ||
    roles.find((role) => role.name === 'Employee') ||
    roles[0];
  const selectedPermissions = selectedRole?.permissions || [];

  return (
    <div className="mt-4 p-4 sm:p-6 lg:p-10">
      <form
        onSubmit={(e) => {
          if (isSaving) {
            e.preventDefault();
            return;
          }
          onSubmit(e);
        }}
        className="rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-5 shadow-[0_0_28px_rgba(239,68,68,0.08)] backdrop-blur-md sm:p-7"
      >
        <div className="flex flex-col gap-4 border-b border-neutral-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex cursor-pointer items-center gap-2 self-start rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="text-left lg:text-right">
            <h2 className="text-3xl font-medium text-neutral-50">
              {editingEmployee ? 'Update Employee' : 'Add Employee'}
            </h2>
            <p className="mt-2 font-mono text-sm text-neutral-500">Employee Details Form</p>
          </div>
        </div>

        {employeeFormSections.map((section, index) => (
          <EmployeeFormSection
            key={section.title}
            section={{
              ...section,
              sectionClassName: index === 0 ? 'mt-8' : section.sectionClassName,
            }}
            form={form}
            onFieldChange={handleFieldChange}
            onAddOption={onAddOption}
            fieldErrors={fieldErrors}
          />
        ))}

        <section className="mt-8">
          <h3 className="mb-6 border-b border-neutral-800 pb-3 text-2xl font-medium text-neutral-50">
            Access & Role
          </h3>
          <div className="grid gap-6 lg:grid-cols-[minmax(220px,320px)_1fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-200">Role *</label>
              <select
                value={form.roleId || selectedRole?.id || ''}
                onChange={(event) => handleFieldChange('roleId', event.target.value)}
                className="w-full rounded-xl border border-neutral-700/90 bg-neutral-950/65 px-3 py-2.5 text-sm text-neutral-100 outline-none transition focus:border-red-500/70 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"
              >
                {!roles.length && <option value="">Employee</option>}
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
              <p className="text-sm font-semibold text-neutral-100">Permissions inherited from role</p>
              {selectedPermissions.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedPermissions.map((permission) => (
                    <span key={permission} className="font-mono text-sm text-neutral-400">
                      ✓ {permission.replace('.', ' ')}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-neutral-500">No permissions assigned.</p>
              )}
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-neutral-800 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="cursor-pointer rounded-xl border border-neutral-700 px-5 py-3 text-sm font-semibold text-neutral-300 transition hover:scale-[1.02] hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving && <Loader2 size={18} className="animate-spin" />}
            {isSaving
              ? editingEmployee
                ? 'Updating...'
                : 'Saving...'
              : editingEmployee
                ? 'Update Employee'
                : 'Save Employee'}
          </button>
        </div>
      </form>

      <AddMasterOptionModal
        optionType={optionModalType}
        form={optionForm}
        isSaving={isSavingOption}
        onClose={onCloseOptionModal}
        onChange={onOptionFormChange}
        onSubmit={onOptionFormSubmit}
      />
    </div>
  );
}
