import { AlertCircle } from 'lucide-react';

export default function DeleteConfirmationModal({
  title,
  message,
  confirmLabel = 'Yes, Delete',
  cancelLabel = 'No, Cancel',
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white px-7 py-6 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-orange-400 text-orange-400">
          <AlertCircle size={32} strokeWidth={2} />
        </div>

        <h2 id="delete-confirmation-title" className="mt-4 text-2xl font-semibold text-slate-800">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-5 text-slate-500">{message}</p>

        <div className="mt-7 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border cursor-pointer border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md cursor-pointer bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
