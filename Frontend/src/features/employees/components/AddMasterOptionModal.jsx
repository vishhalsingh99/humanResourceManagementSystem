import { Loader2, X } from 'lucide-react';
import InputField from '../../../components/common/InputField';
import TextareaField from '../../../components/common/TextareaField';

export default function AddMasterOptionModal({
  optionType,
  form,
  isSaving,
  onClose,
  onChange,
  onSubmit,
}) {
  if (!optionType) return null;

  const isDepartment = optionType === 'department';
  const title = isDepartment ? 'Add Department' : 'Add Designation';
  const nameLabel = isDepartment ? 'Department Name' : 'Designation Name';
  const codeLabel = isDepartment ? 'Department Code' : 'Designation Code';

  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-md"
      onClick={isSaving ? undefined : onClose}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg rounded-2xl border border-neutral-800/80 bg-neutral-900/95 p-6 shadow-[0_0_40px_rgba(239,68,68,0.12)] backdrop-blur-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between border-b border-neutral-800 pb-4">
          <h3 className="text-xl font-semibold text-neutral-50">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-5">
          <InputField
            label={nameLabel}
            value={form.name}
            onChange={(event) => onChange('name', event.target.value)}
            required
          />
          <InputField
            label={codeLabel}
            value={form.code}
            onChange={(event) => onChange('code', event.target.value)}
          />
          <TextareaField
            label="Description"
            value={form.description}
            onChange={(event) => onChange('description', event.target.value)}
            rows={4}
          />
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-neutral-800 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-700 px-5 py-3 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-800"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
