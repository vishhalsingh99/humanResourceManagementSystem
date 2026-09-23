import { X } from 'lucide-react';
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
      className="fixed inset-0 z-1000 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg rounded-none bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
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

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-none border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-none bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
