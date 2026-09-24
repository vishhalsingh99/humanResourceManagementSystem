import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
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
    email: ''
  });

  const handleFieldChange = async (field, value) => {
    if (field === 'resumeFile') {
      if (value.error) {
        setFieldErrors(prev => ({ ...prev, resumeFile: value.error }));
        return;
      }

      try {
        const response = await uploadEmployeeResume(value.file);
        onFieldChange('resumeFile', response.data.resumeFile);
        setFieldErrors(prev => ({ ...prev, resumeFile: '' }));
      } catch (error) {
        setFieldErrors(prev => ({
          ...prev,
          resumeFile: error.response?.data?.error || 'Unable to upload resume',
        }));
      }
      return;
    }

    const normalizedValue = field === 'panNumber' ? value.toUpperCase() : value;
    onFieldChange(field, normalizedValue);

    // Validate phone fields
    if (field === 'phone' || field === 'emergencyContact') {
      const error = value ? getPhoneErrorMessage(value) : '';
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    }

    if (field === 'salary') {
      setFieldErrors(prev => ({ ...prev, salary: getSalaryErrorMessage(value) }));
    }

    if (field === 'aadhaarNumber') {
      setFieldErrors(prev => ({ ...prev, aadhaarNumber: getAadhaarErrorMessage(value) }));
    }

    if (field === 'panNumber') {
      setFieldErrors(prev => ({ ...prev, panNumber: getPanErrorMessage(normalizedValue) }));
    }
  };

  const employeeFormSections = getEmployeeFormSections(
    departmentOptions,
    designationOptions,
    Boolean(editingEmployee)
  );
  const selectedRole = roles.find((role) => String(role.id) === String(form.roleId))
    || roles.find((role) => role.name === 'Employee')
    || roles[0];
  const selectedPermissions = selectedRole?.permissions || [];

  return (
    <div className="p-4 sm:p-6 mt-16 lg:p-10">
      <form
        onSubmit={(e) => {
          onSubmit(e);
        }}
        className="rounded-none bg-white p-5 shadow-[0_16px_28px_rgba(15,23,42,0.18)] sm:p-7"
      >
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 self-start rounded-none bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 cursor-pointer"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="text-left lg:text-right">
            <h2 className="text-3xl font-medium text-slate-900">
              {editingEmployee ? 'Update Employee' : 'Add Employee'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Employee Details Form</p>
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
          <h3 className="mb-6 border-b border-slate-200 pb-3 text-2xl font-medium text-slate-900">
            Access & Role
          </h3>
          <div className="grid gap-6 lg:grid-cols-[minmax(220px,320px)_1fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Role *</label>
              <select
                value={form.roleId || selectedRole?.id || ''}
                onChange={(event) => handleFieldChange('roleId', event.target.value)}
                className="w-full rounded-none border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
              >
                {!roles.length && <option value="">Employee</option>}
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>

            <div className="rounded border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Permissions inherited from role</p>
              {selectedPermissions.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedPermissions.map((permission) => (
                    <span key={permission} className="text-sm text-slate-700">✓ {permission.replace('.', ' ')}</span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No permissions assigned.</p>
              )}
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-none border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-none bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 cursor-pointer"
          >
            {editingEmployee ? 'Update Employee' : 'Save Employee'}
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
