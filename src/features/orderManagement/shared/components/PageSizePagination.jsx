export default function PageSizePagination({
  page,
  limit,
  total,
  onPageChange,
  pageSizeInput,
  onPageSizeInputChange,
  onApplyPageSize,
  loading = false,
}) {
  if (!total) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="grid grid-cols-1 items-center gap-3 border-t border-surface-border px-5 py-4 md:grid-cols-3">
      <div className="flex flex-wrap items-center gap-3 md:justify-start">
        <p className="text-xs text-slate-500">
          Showing {start}-{end} of {total} orders
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
        <label className="flex items-center gap-2">
          <span>Orders per page</span>
          <input
            type="number"
            min="1"
            value={pageSizeInput ?? limit}
            onChange={(event) => onPageSizeInputChange?.(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onApplyPageSize?.();
            }}
            className="h-8 w-20 rounded-lg border border-surface-border bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
          />
        </label>
        <button
          type="button"
          onClick={() => onApplyPageSize?.()}
          disabled={loading}
          className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
      <div className="flex items-center gap-1 md:justify-end">
        <button
          type="button"
          onClick={() => onPageChange?.((value) => Math.max(1, value - 1))}
          disabled={page === 1 || loading}
          className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-surface-card disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="px-3 py-1.5 text-xs font-semibold text-primary">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange?.((value) => Math.min(totalPages, value + 1))}
          disabled={page === totalPages || loading}
          className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-surface-card disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
