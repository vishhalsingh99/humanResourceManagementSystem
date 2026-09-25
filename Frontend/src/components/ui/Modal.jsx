export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="ui-modal-overlay fixed inset-0 z-[1000]"
      onClick={onClose}
    >
      <div
        className="ui-modal-box w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between border-b t-divider pb-4">
          <h3 className="m-0 text-lg font-semibold t-text-heading">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-lg t-text-muted transition hover:bg-[var(--bg-row-hover)] hover:t-text-primary"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
