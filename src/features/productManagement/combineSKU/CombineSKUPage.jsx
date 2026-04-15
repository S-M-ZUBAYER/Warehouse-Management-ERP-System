import {
  Search,
  Plus,
  ChevronDown,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCombineSKUList } from "../hooks/useCombineSKUList";
import Topbar from "../../../components/layout/Topbar";

// ─────────────────────────────────────────────────────────────────────────────
// CombineSKUPage
// ─────────────────────────────────────────────────────────────────────────────

export default function CombineSKUPage() {
  const navigate = useNavigate();

  const {
    search,
    setSearch,
    page,
    setPage,
    bundles,
    pagination,
    isLoading,
    isFetching,
    isError,
    error,
    selectedIds,
    toggleSelect,
    toggleAll,
    allSelected,
    someSelected,
    openDeleteModal,
    deleteTarget,
    showDeleteModal,
    setShowDeleteModal,
    confirmDelete,
    deleting,
    bulkDeleteConfirm,
    setBulkDeleteConfirm,
    confirmBulkDelete,
    bulkDeleting,
  } = useCombineSKUList();

  // ── Pagination helpers ────────────────────────────────────────────────────
  const { total, totalPages, limit } = pagination;
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  // Show at most 5 page buttons, centered around current page
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);
    for (let p = left; p <= right; p++) range.push(p);
    return range;
  };

  return (
    <div className="space-y-4 font-body">
      {/* ── Page Title ── */}
      <Topbar PageTitle="Product Management" />

      {/* ── Top Search Bar ── */}
      <div className="bg-white rounded-xl border border-surface-border p-4">
        <div className="flex items-center gap-3 max-w-sm">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-96 pl-9 pr-3 py-2 text-sm bg-white border border-surface-border rounded-lg
                text-slate-700 placeholder-slate-400 outline-none
                focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {isFetching && !isLoading && (
              <Loader2
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin"
              />
            )}
          </div>
          <button
            onClick={() => setPage(1)}
            className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* ── Combine SKUs card ── */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800 font-display">
              Combine SKUs
            </h2>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 bg-surface-card px-2.5 py-1 rounded-full">
                  {selectedIds.length} selected
                </span>
                <button
                  onClick={() => setBulkDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 size={12} /> Delete selected
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() =>
              navigate("/warehouse_management/products/combine_sku/add")
            }
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <Plus size={14} /> Add Combine SKU
          </button>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <TableSkeleton />
          ) : isError ? (
            <TableError
              message={
                error?.response?.data?.message ??
                error?.message ??
                "Failed to load combine SKUs"
              }
              onRetry={() => setPage(1)}
            />
          ) : (
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-surface-border bg-white">
                  <th className="py-3 pl-5 text-left w-32">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el)
                            el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                      />
                      <span className="pl-2 text-base font-semibold text-primary-text whitespace-nowrap">
                        Select All
                      </span>
                    </div>
                  </th>
                  <th className="w-16 py-3 text-left">
                    <span className="font-semibold text-base text-primary-text">
                      Image
                    </span>
                  </th>
                  <th className="w-28 py-3 text-left pr-4">
                    <span className="font-semibold text-base text-primary-text">
                      SKU
                    </span>
                  </th>
                  <th className="py-3 text-left pr-4">
                    <span className="font-semibold text-base text-primary-text">
                      Bundle SKU Name
                    </span>
                  </th>
                  <th className="w-28 py-3 text-left pr-4">
                    <span className="font-semibold text-base text-primary-text">
                      Stock
                    </span>
                  </th>
                  <th className="w-24 py-3 text-left pr-4">
                    <span className="font-semibold text-base text-primary-text">
                      Details
                    </span>
                  </th>
                  <th className="w-24 py-3 text-left pr-5">
                    <span className="font-semibold text-base text-primary-text">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-surface-border">
                {bundles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Search size={32} className="opacity-30" />
                        <p className="text-sm font-medium">
                          No combine SKUs found
                        </p>
                        {search && (
                          <button
                            onClick={() => {
                              setSearch("");
                              setPage(1);
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  bundles.map((bundle) => {
                    const isChecked = selectedIds.includes(bundle.id);
                    const imageUrl =
                      bundle.image_url ??
                      bundle.items?.[0]?.merchantSku?.image_url ??
                      null;
                    return (
                      <tr
                        key={bundle.id}
                        className={`transition-colors hover:bg-surface/60 ${
                          isChecked ? "bg-blue-50/40" : ""
                        }`}
                      >
                        <td className="pl-5 py-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(bundle.id)}
                            className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="py-2">
                          <img
                            src={
                              imageUrl ||
                              `https://placehold.co/36x36/E6ECF0/004368?text=${
                                bundle.combine_sku_code?.[0] ?? "C"
                              }`
                            }
                            alt={bundle.combine_name}
                            className="w-9 h-9 rounded-lg object-cover border border-surface-border"
                            onError={(e) => {
                              e.target.src =
                                "https://placehold.co/36x36/E6ECF0/004368?text=?";
                            }}
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <span className="text-sm font-mono font-semibold text-slate-700">
                            {bundle.combine_sku_code}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <p
                            className="text-sm text-slate-700 truncate max-w-[240px]"
                            title={bundle.combine_name}
                          >
                            {bundle.combine_name}
                          </p>
                          {bundle.items?.length > 0 && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {bundle.items.length} item(s)
                            </p>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`text-sm font-semibold ${
                              (bundle.computed_quantity ?? 0) === 0
                                ? "text-red-500"
                                : (bundle.computed_quantity ?? 0) < 10
                                  ? "text-amber-500"
                                  : "text-emerald-600"
                            }`}
                          >
                            {(bundle.computed_quantity ?? 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <button
                            onClick={() =>
                              navigate(
                                `/warehouse_management/products/combine_sku/${bundle.id}`,
                              )
                            }
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Details
                          </button>
                        </td>
                        <td className="py-2 pr-5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                navigate(
                                  `/warehouse_management/products/combine_sku/${bundle.id}/edit`,
                                )
                              }
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Edit"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openDeleteModal(bundle)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination — shows when more than 1 page ── */}
        {!isLoading && !isError && totalPages >= 1 && total > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-surface-border">
            {/* Range label */}
            <p className="text-xs text-slate-500">
              Showing {rangeStart}–{rangeEnd} of {total}
            </p>

            {/* Page controls */}
            <div className="flex items-center gap-1">
              {/* Previous */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600
                  hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {/* First page + ellipsis if needed */}
              {getPageNumbers()[0] > 1 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    className="w-8 h-8 text-xs rounded-lg border border-surface-border text-slate-600 hover:bg-surface-card transition-colors"
                  >
                    1
                  </button>
                  {getPageNumbers()[0] > 2 && (
                    <span className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">
                      …
                    </span>
                  )}
                </>
              )}

              {/* Page number buttons */}
              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  disabled={isFetching}
                  className={`w-8 h-8 text-xs rounded-lg border transition-colors
                    ${
                      page === p
                        ? "bg-primary text-white border-primary"
                        : "border-surface-border text-slate-600 hover:bg-surface-card"
                    }`}
                >
                  {p}
                </button>
              ))}

              {/* Last page + ellipsis if needed */}
              {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                <>
                  {getPageNumbers()[getPageNumbers().length - 1] <
                    totalPages - 1 && (
                    <span className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">
                      …
                    </span>
                  )}
                  <button
                    onClick={() => setPage(totalPages)}
                    className="w-8 h-8 text-xs rounded-lg border border-surface-border text-slate-600 hover:bg-surface-card transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isFetching}
                className="px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600
                  hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Footer: Export + Print ── */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
          <button className="flex items-center gap-2 px-14 py-2 text-base font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
            Export <ChevronDown size={13} className="text-slate-400" />
          </button>
          <button className="px-16 py-2 text-base font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">
            Print
          </button>
        </div>
      </div>

      {/* ── Delete single confirm ── */}
      {showDeleteModal && deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Combine SKU"
          message={
            <>
              Delete{" "}
              <span className="font-semibold">{deleteTarget.combine_name}</span>{" "}
              ({deleteTarget.combine_sku_code})?
              <br />
              <span className="text-red-500 text-xs">
                This action cannot be undone.
              </span>
            </>
          }
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          loading={deleting}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
        />
      )}

      {/* ── Bulk delete confirm ── */}
      {bulkDeleteConfirm && (
        <ConfirmDeleteModal
          title="Delete Selected"
          message={
            <>
              Delete{" "}
              <span className="font-semibold">
                {selectedIds.length} Combine SKU(s)
              </span>
              ?
              <br />
              <span className="text-red-500 text-xs">
                This action cannot be undone.
              </span>
            </>
          }
          confirmLabel={
            bulkDeleting ? "Deleting..." : `Delete ${selectedIds.length}`
          }
          loading={bulkDeleting}
          onCancel={() => setBulkDeleteConfirm(false)}
          onConfirm={confirmBulkDelete}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="w-4 h-4 bg-slate-200 rounded" />
          <div className="w-9 h-9 bg-slate-200 rounded-lg" />
          <div className="w-20 h-4 bg-slate-200 rounded" />
          <div className="flex-1 h-4 bg-slate-200 rounded" />
          <div className="w-16 h-4 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function TableError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle size={36} className="text-red-400 opacity-70" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
      >
        <RefreshCw size={12} /> Retry
      </button>
    </div>
  );
}

function ConfirmDeleteModal({
  title,
  message,
  confirmLabel,
  loading,
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(200,210,220,0.55)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7"
        style={{ animation: "popIn 0.15s ease both" }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">
              {title}
            </h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
