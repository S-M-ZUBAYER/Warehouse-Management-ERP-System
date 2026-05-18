import {
  Search,
  Plus,
  ChevronDown,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCombineSKUList } from "../hooks/useCombineSKUList";
import Topbar from "../../../components/layout/Topbar";
import { exportRowsToCsv, exportRowsToXlsx, printRows } from "../../../utils/tableOutput";
import ExportMenu from "../../../components/shared/ExportMenu";

// ─────────────────────────────────────────────────────────────────────────────
// CombineSKUPage
// ─────────────────────────────────────────────────────────────────────────────

export default function CombineSKUPage() {
  const navigate = useNavigate();
  const [detailBundle, setDetailBundle] = useState(null);

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

  console.log(bundles,"Combine");
  

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
                // setPage(1);
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
              <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
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
                    const items = getSortedItems(bundle.items);
                    const imageUrl =
                      bundle.image_url ??
                      getMerchantSku(items[0])?.image_url ??
                      getMerchantSku(items[0])?.image ??
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
                            {(bundle.computed_quantity ?? 0).toLocaleString()} units
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <button
                            onClick={() => setDetailBundle(bundle)}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Details
                          </button>
                        </td>
                        <td className="py-2 pr-5">
                          <button
                            onClick={() => openDeleteModal(bundle)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
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
          <ExportMenu
            className="flex items-center gap-2 px-14 py-2 text-base font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
            onExportCsv={() => exportRowsToCsv(bundles.filter((bundle) => selectedIds.includes(bundle.id)), [
              { label: "Combine SKU", key: "combine_sku_code" },
              { label: "Name", key: "combine_name" },
              { label: "Stock", key: "computed_quantity" },
              { label: "Items", render: (row) => row.items?.length || 0 },
            ], "combine-skus.csv", "combine SKU")}
            onExportXlsx={() => exportRowsToXlsx(bundles.filter((bundle) => selectedIds.includes(bundle.id)), [
              { label: "Combine SKU", key: "combine_sku_code" },
              { label: "Name", key: "combine_name" },
              { label: "Stock", key: "computed_quantity" },
              { label: "Items", render: (row) => row.items?.length || 0 },
            ], "combine-skus.xlsx", "combine SKU")}
          />
          <button onClick={() => printRows(bundles.filter((bundle) => selectedIds.includes(bundle.id)), [
            { label: "Combine SKU", key: "combine_sku_code" },
            { label: "Name", key: "combine_name" },
            { label: "Stock", key: "computed_quantity" },
            { label: "Items", render: (row) => row.items?.length || 0 },
          ], "Selected Combine SKUs", "combine SKU")} className="px-16 py-2 text-base font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">
            Print
          </button>
        </div>
      </div>

      <CombineSkuDetailModal
        open={!!detailBundle}
        bundle={detailBundle}
        onClose={() => setDetailBundle(null)}
      />

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

const fallbackText = (value) =>
  value === null || value === undefined || value === "" ? "—" : value;

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const getMerchantSku = (item) => item?.merchantSku ?? item?.merchant_sku ?? {};

const getItemOrder = (item, fallbackIndex = 0) => {
  const order = item?.order ?? item?.sortOrder ?? item?.sort_order ?? item?.position ?? item?.item_order;
  if (order !== null && order !== undefined && order !== "") return Number(order);
  return Number(item?.id ?? fallbackIndex);
};

const getSortedItems = (items) =>
  Array.isArray(items)
    ? [...items].sort((a, b) => getItemOrder(a) - getItemOrder(b))
    : [];

const getItemStock = (sku) => {
  if (Array.isArray(sku?.stock) && sku.stock.length) {
    return sku.stock.reduce(
      (sum, stock) => sum + Number(stock?.qty_on_hand ?? stock?.available_in_inventory ?? 0),
      0
    );
  }
  return Number(sku?.available_in_inventory ?? sku?.qty_on_hand ?? 0);
};

function DetailField({ label, value }) {
  return (
    <div className="rounded-xl border border-surface-border bg-slate-50/60 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-1">
        {label}
      </p>
      <p className="text-sm text-slate-800 break-words">{fallbackText(value)}</p>
    </div>
  );
}

function CombineSkuDetailModal({ open, bundle, onClose }) {
  if (!open || !bundle) return null;

  const items = getSortedItems(bundle.items);
  const warehouseName = fallbackText(bundle.warehouse?.name ?? bundle.warehouse_name);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-5xl max-h-[88vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-surface-border">
          <div>
            <h3 className="text-lg font-bold text-slate-800 font-display">
              Combine SKU Details
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {fallbackText(bundle.combine_sku_code)} · {warehouseName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <DetailField label="Combine SKU" value={bundle.combine_sku_code} />
            <DetailField label="Bundle Name" value={bundle.combine_name} />
            <DetailField
              label="Computed Stock"
              value={`${Number(bundle.computed_quantity ?? 0).toLocaleString()} units`}
            />
            <DetailField label="Warehouse" value={warehouseName} />
            <DetailField label="Item Count" value={items.length} />
            <DetailField label="Status" value={bundle.status} />
            <DetailField label="Created" value={formatDateTime(bundle.createdAt ?? bundle.created_at)} />
            <DetailField label="Updated" value={formatDateTime(bundle.updatedAt ?? bundle.updated_at)} />
          </div>

          <div className="rounded-xl border border-surface-border overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-border bg-slate-50">
              <h4 className="text-sm font-bold text-slate-800">
                Merchant SKU Items
              </h4>
            </div>

            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                No merchant SKU items found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white border-b border-surface-border">
                    <tr>
                      {["Image", "SKU Name", "SKU Title", "Quantity", "Stock", "Warehouse"].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-left text-xs font-bold text-slate-600">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {items.map((item) => {
                      const sku = getMerchantSku(item);
                      const imageUrl = sku.image_url || sku.image;
                      const stock = getItemStock(sku);
                      return (
                        <tr key={item.id ?? item.merchant_sku_id ?? sku.id}>
                          <td className="px-4 py-3">
                            <img
                              src={imageUrl || `https://placehold.co/44x44/E6ECF0/004368?text=${sku.sku_name?.[0] ?? "?"}`}
                              alt={sku.sku_name || "Merchant SKU"}
                              className="w-11 h-11 rounded-lg object-cover border border-surface-border"
                              onError={(e) => {
                                e.currentTarget.src = "https://placehold.co/44x44/E6ECF0/004368?text=?";
                              }}
                            />
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                            {fallbackText(sku.sku_name)}
                          </td>
                          <td className="px-4 py-3 text-slate-700 min-w-64">
                            {fallbackText(sku.sku_title)}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {Number(item.quantity ?? 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-emerald-600 font-semibold">
                            {stock.toLocaleString()} units
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {fallbackText(sku.warehouse?.name ?? sku.warehouse_name ?? bundle.warehouse?.name)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-surface-border">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark"
          >
            Close
          </button>
        </div>
      </div>
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
