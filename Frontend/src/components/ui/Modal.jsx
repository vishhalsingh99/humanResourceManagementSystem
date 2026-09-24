export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-neutral-950/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800/80 bg-neutral-900/90 p-7 shadow-[0_0_40px_rgba(239,68,68,0.12)] backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between border-b border-neutral-800 pb-4">
          <h3 className="m-0 text-lg font-semibold text-neutral-100">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border-none bg-transparent text-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
