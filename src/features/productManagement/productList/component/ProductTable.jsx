import {
  Search,
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Pencil,
  MoreHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

// ── Row Actions Dropdown ──────────────────────────────────────────────────────
function RowActions({ product, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        title="Actions"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-36 bg-white border border-surface-border rounded-xl shadow-lg overflow-hidden"
          style={{ animation: "fadeIn 0.1s ease both" }}
        >
          <button
            onClick={() => {
              setOpen(false);
              onEdit(product);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Pencil size={13} className="text-slate-400" />
            Edit
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete(product);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

// ── Stock Badge ───────────────────────────────────────────────────────────────
function StockBadge({ value }) {
  const num = value ?? 0;
  const color =
    num === 0
      ? "text-red-500"
      : num < 50
        ? "text-amber-500"
        : "text-emerald-600";
  return (
    <span className={`text-sm font-semibold ${color}`}>
      {num.toLocaleString()}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="w-4 h-4 bg-slate-200 rounded" />
          <div className="w-10 h-10 bg-slate-200 rounded-lg" />
          <div className="w-20 h-4 bg-slate-200 rounded" />
          <div className="flex-1 h-4 bg-slate-200 rounded" />
          <div className="w-16 h-4 bg-slate-200 rounded" />
          <div className="w-16 h-4 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Error State ───────────────────────────────────────────────────────────────
function TableError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
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

// ── Main Table ────────────────────────────────────────────────────────────────
export default function ProductTable({
  products,
  pagination,
  page,
  setPage,
  listLoading,
  listFetching,
  isListError,
  listError,
  selectedIds,
  toggleSelect,
  toggleAll,
  allSelected,
  someSelected,
  search,
  setSearch,
  bulkAction,
  handleBulkAction,
  hasActiveFilters,
  resetFilters,
  setShowAddModal,
  openDeleteModal,
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4">
        <h2 className="text-xl font-bold text-slate-800 font-display">
          Product list
        </h2>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 pb-7 border-b border-surface-border gap-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
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
              className="pl-8 pr-3 py-2 text-sm bg-white border border-surface-border rounded-lg
                         text-slate-700 placeholder-slate-400 outline-none w-80
                         focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {listFetching && !listLoading && (
              <Loader2
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin"
              />
            )}
          </div>

          {/* Bulk Action */}
          <div className="relative">
            <select
              value={bulkAction}
              onChange={(e) => handleBulkAction(e.target.value)}
              disabled={selectedIds.length === 0}
              className="appearance-none flex items-center gap-2 px-3 py-2 pr-7 text-sm border border-surface-border
                         rounded-lg text-slate-600 bg-white hover:bg-surface-card transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer outline-none"
            >
              <option value="">Bulk Action</option>
              <option value="delete">
                Delete Selected ({selectedIds.length})
              </option>
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {selectedIds.length > 0 && (
            <span className="text-xs text-slate-500 bg-surface-card px-2.5 py-1 rounded-full">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                     bg-white border border-surface-border rounded-lg text-slate-700
                     hover:bg-surface-card transition-colors"
        >
          Add Products
          <ChevronDown size={13} className="text-slate-400" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {listLoading ? (
          <TableSkeleton />
        ) : isListError ? (
          <TableError
            message={
              listError?.response?.data?.message ??
              listError?.message ??
              "Failed to load products"
            }
            onRetry={() => setPage(1)}
          />
        ) : (
          <table className="w-full text-lg font-body">
            <thead>
              <tr className="border-b border-surface-border bg-white">
                <th className="py-3 pl-5 w-36 text-left">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected;
                      }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                    <span className="pl-2 text-base font-semibold text-primary-text">
                      Select All
                    </span>
                  </label>
                </th>
                {[
                  "Image",
                  "SKU",
                  "Product Name",
                  "Available in Inventory",
                  "In transit Inventory",
                  "Details",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="py-3 text-left pr-4">
                    <span className="text-base font-semibold text-primary-text">
                      {h}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Search size={32} className="opacity-30" />
                      <p className="text-sm font-medium">No products found</p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors hover:bg-blue-50/40 ${isSelected ? "bg-blue-50/60" : "bg-white"}`}
                    >
                      <td className="pl-5 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(product.id)}
                          className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-3">
                        <img
                          src={
                            product.image_url ||
                            `https://placehold.co/40x40/E6ECF0/004368?text=${product.sku_name?.[0] ?? "?"}`
                          }
                          alt={product.sku_title}
                          className="w-10 h-10 rounded-lg object-cover border border-surface-border"
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/40x40/E6ECF0/004368?text=?";
                          }}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm font-mono font-semibold text-slate-700">
                          {product.sku_name}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <p
                          className="text-sm font-medium text-slate-800 truncate max-w-[240px]"
                          title={product.sku_title}
                        >
                          {product.sku_title}
                        </p>
                        {product.warehouse && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {product.warehouse.name}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <StockBadge
                          value={product.available_in_inventory ?? 0}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm font-semibold text-blue-600">
                          {(product.in_transit_inventory ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() =>
                            navigate(`/inventory/merchant-skus/${product.id}`)
                          }
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          View
                        </button>
                      </td>
                      <td className="py-3 pr-4">
                        <RowActions
                          product={product}
                          onEdit={(p) =>
                            navigate(`/inventory/merchant-skus/${p.id}/edit`)
                          }
                          onDelete={openDeleteModal}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!listLoading && !isListError && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-surface-border">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * pagination.limit + 1}–
            {Math.min(page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} products
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600 hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs rounded-lg border transition-colors
                    ${page === p ? "bg-primary text-white border-primary" : "border-surface-border text-slate-600 hover:bg-surface-card"}`}
                  >
                    {p}
                  </button>
                );
              },
            )}
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600 hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
        <button className="flex items-center gap-2 px-14 py-2.5 text-base font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
          Export <ChevronDown size={13} className="text-slate-400" />
        </button>
        <button className="px-16 py-2.5 text-base font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">
          Print
        </button>
      </div>
    </div>
  );
}
