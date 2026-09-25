import { Loader2, X } from 'lucide-react';
import InputField from '../../../components/common/InputField';
import TextareaField from '../../../components/common/TextareaField';

export default function AddMasterOptionModal({ optionType, form, isSaving, onClose, onChange, onSubmit }) {
  if (!optionType) return null;

  const isDepartment = optionType === 'department';
  const title      = isDepartment ? 'Add Department' : 'Add Designation';
  const nameLabel  = isDepartment ? 'Department Name' : 'Designation Name';
  const codeLabel  = isDepartment ? 'Department Code' : 'Designation Code';

  return (
    <div
      className="ui-modal-overlay fixed inset-0 z-[1000]"
      onClick={isSaving ? undefined : onClose}
    >
      <form
        onSubmit={onSubmit}
        className="ui-modal-box w-full max-w-lg rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between border-b t-divider pb-4">
          <h3 className="text-xl font-semibold t-text-heading">{title}</h3>
          <button
            type="button" onClick={onClose} disabled={isSaving}
            className="flex h-9 w-9 items-center justify-center rounded-xl t-text-muted transition hover:bg-[var(--bg-row-hover)] hover:t-text-primary disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-5">
          <InputField label={nameLabel} value={form.name} onChange={(e) => onChange('name', e.target.value)} required />
          <InputField label={codeLabel} value={form.code} onChange={(e) => onChange('code', e.target.value)} />
          <TextareaField label="Description" value={form.description} onChange={(e) => onChange('description', e.target.value)} rows={4} />
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 border-t t-divider pt-5 sm:flex-row sm:justify-end">
          <button
            type="button" onClick={onClose} disabled={isSaving}
            className="rounded-xl border t-border px-5 py-3 text-sm font-semibold t-text-secondary transition hover:bg-[var(--bg-row-hover)]"
          >
            Cancel
          </button>
          <button
            type="submit" disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
