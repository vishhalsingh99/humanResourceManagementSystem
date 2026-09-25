import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { getEmployeeFormSections } from '../config/employeeForm.config';
import { getPhoneErrorMessage } from '../../../utils/phoneValidation';
import { getAadhaarErrorMessage, getPanErrorMessage, getSalaryErrorMessage } from '../../../utils/formValidation';
import { uploadEmployeeResume } from '../services/employees.api';
import AddMasterOptionModal from './AddMasterOptionModal';
import EmployeeFormSection from './EmployeeFormSection';

export default function EmployeeForm({
  editingEmployee, form, onClose, onFieldChange, onSubmit, isSaving = false,
  roles = [], departmentOptions, designationOptions, onAddOption,
  optionModalType, optionForm, isSavingOption, onOptionFormChange, onOptionFormSubmit, onCloseOptionModal,
}) {
  const [fieldErrors, setFieldErrors] = useState({ phone: '', emergencyContact: '', salary: '', aadhaarNumber: '', panNumber: '', resumeFile: '', email: '' });

  const handleFieldChange = async (field, value) => {
    if (field === 'resumeFile') {
      if (value.error) { setFieldErrors((p) => ({ ...p, resumeFile: value.error })); return; }
      try {
        const response = await uploadEmployeeResume(value.file);
        onFieldChange('resumeFile', response.data.resumeFile);
        setFieldErrors((p) => ({ ...p, resumeFile: '' }));
      } catch (error) {
        setFieldErrors((p) => ({ ...p, resumeFile: error.response?.data?.error || 'Unable to upload resume' }));
      }
      return;
    }
    const normalized = field === 'panNumber' ? value.toUpperCase() : value;
    onFieldChange(field, normalized);
    if (field === 'phone' || field === 'emergencyContact') setFieldErrors((p) => ({ ...p, [field]: value ? getPhoneErrorMessage(value) : '' }));
    if (field === 'salary')       setFieldErrors((p) => ({ ...p, salary: getSalaryErrorMessage(value) }));
    if (field === 'aadhaarNumber') setFieldErrors((p) => ({ ...p, aadhaarNumber: getAadhaarErrorMessage(value) }));
    if (field === 'panNumber')    setFieldErrors((p) => ({ ...p, panNumber: getPanErrorMessage(normalized) }));
  };

  const sections = getEmployeeFormSections(departmentOptions, designationOptions, Boolean(editingEmployee));
  const selectedRole = roles.find((r) => String(r.id) === String(form.roleId)) || roles.find((r) => r.name === 'Employee') || roles[0];
  const selectedPermissions = selectedRole?.permissions || [];

  return (
    <div className="mt-4 p-4 sm:p-6 lg:p-10">
      <form
        onSubmit={(e) => { if (isSaving) { e.preventDefault(); return; } onSubmit(e); }}
        className="ui-card rounded-2xl p-5 sm:p-7"
      >
        <div className="flex flex-col gap-4 border-b t-divider pb-6 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button" onClick={onClose} disabled={isSaving}
            className="flex cursor-pointer items-center gap-2 self-start rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowLeft size={18} />Back
          </button>
          <div className="text-left lg:text-right">
            <h2 className="text-3xl font-medium t-text-heading">{editingEmployee ? 'Update Employee' : 'Add Employee'}</h2>
            <p className="mt-2 font-mono text-sm t-text-subtle">Employee Details Form</p>
          </div>
        </div>

        {sections.map((section, index) => (
          <EmployeeFormSection
            key={section.title}
            section={{ ...section, sectionClassName: index === 0 ? 'mt-8' : section.sectionClassName }}
            form={form}
            onFieldChange={handleFieldChange}
            onAddOption={onAddOption}
            fieldErrors={fieldErrors}
          />
        ))}

        {/* Access & Role */}
        <section className="mt-8">
          <h3 className="mb-6 border-b t-divider pb-3 text-2xl font-medium t-text-heading">Access & Role</h3>
          <div className="grid gap-6 lg:grid-cols-[minmax(220px,320px)_1fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold t-text-secondary">Role *</label>
              <select
                value={form.roleId || selectedRole?.id || ''}
                onChange={(e) => handleFieldChange('roleId', e.target.value)}
                className="ui-input w-full rounded-xl px-3 py-2.5 text-sm"
              >
                {!roles.length && <option value="">Employee</option>}
                {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </div>
            <div className="rounded-xl border t-border bg-[var(--bg-input)] p-4">
              <p className="text-sm font-semibold t-text-primary">Permissions inherited from role</p>
              {selectedPermissions.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedPermissions.map((p) => (
                    <span key={p} className="font-mono text-sm t-text-muted">✓ {p.replace('.', ' ')}</span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm t-text-subtle">No permissions assigned.</p>
              )}
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-col-reverse gap-3 border-t t-divider pt-6 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isSaving}
            className="cursor-pointer rounded-xl border t-border px-5 py-3 text-sm font-semibold t-text-secondary transition hover:scale-[1.02] hover:bg-[var(--bg-row-hover)] disabled:cursor-not-allowed disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={isSaving}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:scale-[1.02] hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-70">
            {isSaving && <Loader2 size={18} className="animate-spin" />}
            {isSaving ? (editingEmployee ? 'Updating...' : 'Saving...') : (editingEmployee ? 'Update Employee' : 'Save Employee')}
          </button>
        </div>
      </form>

      <AddMasterOptionModal
        optionType={optionModalType} form={optionForm} isSaving={isSavingOption}
        onClose={onCloseOptionModal} onChange={onOptionFormChange} onSubmit={onOptionFormSubmit}
      />
    </div>
  );
}
