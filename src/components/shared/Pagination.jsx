import { ChevronLeft, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Pagination — numbered pages with prev/next arrows
// ─────────────────────────────────────────────────────────────────────────────

export default function Pagination({
  currentPage,
  page,
  totalPages,
  onPageChange,
  totalItems,
  total,
  pageSize,
  limit,
}) {
  const activePage = currentPage ?? page ?? 1;
  const totalCount = totalItems ?? total ?? 0;
  const limitCount = pageSize ?? limit ?? 10;

  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left = Math.max(1, activePage - delta);
  const right = Math.min(totalPages, activePage + delta);

  for (let i = left; i <= right; i++) pages.push(i);

  const start = totalCount === 0 ? 0 : (activePage - 1) * limitCount + 1;
  const end = Math.min(activePage * limitCount, totalCount);

  return (
    <div className="flex items-center justify-between px-1 mt-4">
      {/* Count */}
      <p className="text-xs text-slate-500 font-body">
        Showing{" "}
        <span className="font-semibold text-slate-700">
          {start}–{end}
        </span>{" "}
        of <span className="font-semibold text-slate-700">{totalCount}</span>{" "}
        results
      </p>

      {/* Pages */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(activePage - 1)}
          disabled={activePage === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-surface-border
                     text-slate-500 hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {left > 1 && (
          <>
            <PageBtn page={1} current={activePage} onClick={onPageChange} />
            {left > 2 && <span className="text-xs text-slate-400 px-1">…</span>}
          </>
        )}

        {pages.map((p) => (
          <PageBtn
            key={p}
            page={p}
            current={activePage}
            onClick={onPageChange}
          />
        ))}

        {right < totalPages && (
          <>
            {right < totalPages - 1 && (
              <span className="text-xs text-slate-400 px-1">…</span>
            )}
            <PageBtn
              page={totalPages}
              current={activePage}
              onClick={onPageChange}
            />
          </>
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(activePage + 1)}
          disabled={activePage === totalPages}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-surface-border
                     text-slate-500 hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function PageBtn({ page, current, onClick }) {
  const isActive = page === current;
  return (
    <button
      onClick={() => onClick(page)}
      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors
        ${
          isActive
            ? "bg-primary text-white border border-primary font-body"
            : "border border-surface-border text-slate-600 hover:bg-surface-card font-body"
        }`}
    >
      {page}
    </button>
  );
}
