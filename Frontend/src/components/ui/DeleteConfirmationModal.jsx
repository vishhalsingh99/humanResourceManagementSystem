import { AlertCircle } from 'lucide-react';

export default function DeleteConfirmationModal({
  title,
  message,
  confirmLabel = 'Yes, Delete',
  cancelLabel = 'No, Cancel',
  onCancel,
  onConfirm,
  loading = false,
}) {
  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-neutral-950/70 px-4 backdrop-blur-md"
      onClick={loading ? undefined : onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-neutral-800/80 bg-neutral-900/90 px-7 py-6 text-center shadow-[0_0_40px_rgba(239,68,68,0.15)] backdrop-blur-md"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-400/80 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <AlertCircle size={32} strokeWidth={2} />
        </div>

        <h2 id="delete-confirmation-title" className="mt-4 text-2xl font-semibold text-neutral-100">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-5 text-neutral-400">{message}</p>

        <div className="mt-7 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-neutral-700 bg-neutral-950/50 px-4 py-3 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:bg-red-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Saving...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
