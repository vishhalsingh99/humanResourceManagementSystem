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
      className="ui-modal-overlay fixed inset-0 z-[1000]"
      onClick={loading ? undefined : onCancel}
      role="presentation"
    >
      <div
        className="ui-modal-box w-full max-w-sm rounded-2xl px-7 py-6 text-center"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-400/80 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <AlertCircle size={32} strokeWidth={2} />
        </div>

        <h2 id="confirm-modal-title" className="mt-4 text-2xl font-semibold t-text-heading">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-5 t-text-muted">{message}</p>

        <div className="mt-7 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer rounded-xl border t-border bg-[var(--bg-input)] px-4 py-3 text-sm font-semibold t-text-secondary transition hover:bg-[var(--bg-row-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.25)] transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Saving...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
