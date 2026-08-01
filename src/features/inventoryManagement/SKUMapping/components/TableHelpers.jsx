import { Search, Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TableSkeleton — animated loading rows
// ─────────────────────────────────────────────────────────────────────────────
export function TableSkeleton({ cols = 7, rows = 5 }) {
    return (
        <div className="p-5 space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-4 h-4 bg-slate-200 rounded" />
                    <div className="w-9 h-9 bg-slate-200 rounded-lg" />
                    {Array.from({ length: cols - 2 }).map((_, j) => (
                        <div key={j} className="h-4 bg-slate-200 rounded flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState — no results found
// ─────────────────────────────────────────────────────────────────────────────
export function EmptyState({ message = 'No items found', colSpan = 9 }) {
    return (
        <tr>
            <td colSpan={colSpan} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Search size={28} className="opacity-30" />
                    <p className="text-sm">{message}</p>
                </div>
            </td>
        </tr>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MappingActionBtn — Link2 icon: blue when mapped, gray when unmapped
// ─────────────────────────────────────────────────────────────────────────────
export function MappingActionBtn({ isMapped, onClick, title = 'Manage mapping' }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-1 rounded transition-colors ${
                isMapped
                    ? 'text-primary hover:text-primary-dark hover:bg-blue-50'
                    : 'text-slate-300 hover:text-slate-500 hover:bg-surface-card'
            }`}
        >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination — reusable prev/next/page buttons
// ─────────────────────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, total, limit, onPageChange }) {
    if (totalPages <= 1) return null;
    const from = ((page - 1) * limit) + 1;
    const to   = Math.min(page * limit, total);
    const visibleCount = Math.min(5, totalPages);
    const startPage = Math.min(
        Math.max(1, page - Math.floor(visibleCount / 2)),
        Math.max(1, totalPages - visibleCount + 1),
    );
    const pageNumbers = Array.from({ length: visibleCount }, (_, i) => startPage + i);

    return (
        <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border">
            <p className="text-xs text-slate-500">{from}–{to} of {total}</p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs border border-surface-border rounded-lg disabled:opacity-40 hover:bg-surface-card transition-colors"
                >Previous</button>
                {pageNumbers.map((p) => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`w-8 h-8 text-xs rounded-lg border transition-colors ${page === p ? 'bg-primary text-white border-primary' : 'border-surface-border text-slate-600 hover:bg-surface-card'}`}
                    >{p}</button>
                ))}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs border border-surface-border rounded-lg disabled:opacity-40 hover:bg-surface-card transition-colors"
                >Next</button>
            </div>
        </div>
    );
}
