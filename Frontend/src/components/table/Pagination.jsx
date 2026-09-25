export default function Pagination({ currentPage, totalItems, onPageChange, itemsPerPage = 10 }) {
  const totalPages  = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startEntry  = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endEntry    = Math.min(currentPage * itemsPerPage, totalItems);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end   = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-3 border-t t-divider bg-transparent px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="font-mono text-xs t-text-muted">
        Showing {startEntry} to {endEntry} of {totalItems} entries
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="cursor-pointer rounded-xl border t-border px-3 py-1.5 text-sm font-medium t-text-secondary transition hover:bg-[var(--bg-row-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm t-text-subtle">...</span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                currentPage === page
                  ? 'border-red-500 bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.3)]'
                  : 'border-[var(--border-base)] t-text-secondary hover:bg-[var(--bg-row-hover)]'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="cursor-pointer rounded-xl border t-border px-3 py-1.5 text-sm font-medium t-text-secondary transition hover:bg-[var(--bg-row-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
