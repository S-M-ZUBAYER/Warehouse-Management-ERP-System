import { ChevronLeft, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Pagination — numbered pages with prev/next arrows
// ─────────────────────────────────────────────────────────────────────────────

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left = Math.max(1, currentPage - delta);
  const right = Math.min(totalPages, currentPage + delta);

  for (let i = left; i <= right; i++) pages.push(i);

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-1 mt-4">
      {/* Count */}
      <p
        className="text-xs text-slate-500"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        Showing{" "}
        <span className="font-semibold text-slate-700">
          {start}–{end}
        </span>{" "}
        of <span className="font-semibold text-slate-700">{totalItems}</span>{" "}
        results
      </p>

      {/* Pages */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-surface-border
                     text-slate-500 hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {left > 1 && (
          <>
            <PageBtn page={1} current={currentPage} onClick={onPageChange} />
            {left > 2 && <span className="text-xs text-slate-400 px-1">…</span>}
          </>
        )}

        {pages.map((p) => (
          <PageBtn
            key={p}
            page={p}
            current={currentPage}
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
              current={currentPage}
              onClick={onPageChange}
            />
          </>
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
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
            ? "bg-primary text-white border border-primary"
            : "border border-surface-border text-slate-600 hover:bg-surface-card"
        }`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {page}
    </button>
  );
}
