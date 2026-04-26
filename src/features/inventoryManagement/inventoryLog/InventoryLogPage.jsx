import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import Topbar from "../../../components/layout/Topbar";
import InvFooter from "../shared/components/InvFooter";
import {
  useInventoryLog,
  MOVEMENT_TYPE_OPTIONS,
} from "./hooks/useInventoryLog";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} ${hours}:${minutes}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton row
// ─────────────────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="border-b border-surface-border animate-pulse">
    {Array.from({ length: 7 }).map((_, i) => (
      <td key={i} className="py-4 pr-4 pl-2">
        <div className="h-3.5 bg-slate-100 rounded w-3/4" />
      </td>
    ))}
  </tr>
);

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────
const Pagination = ({ pagination, page, setPage, isFetching }) => {
  const { total = 0, totalPages = 1, limit = 10 } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build page numbers — show up to 5 around current page
  const getPages = () => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2)
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border">
      {/* Left: record count */}
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{from}</span>
        {" – "}
        <span className="font-semibold text-slate-700">{to}</span>
        {" of "}
        <span className="font-semibold text-slate-700">{total}</span>
        {" records"}
        {isFetching && (
          <span className="ml-2 inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin align-middle" />
        )}
      </p>

      {/* Right: page controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-surface-border bg-white text-slate-500 disabled:opacity-40 hover:border-primary hover:text-primary transition-all"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page numbers */}
        {getPages().map((pg) => (
          <button
            key={pg}
            onClick={() => setPage(pg)}
            className={`w-8 h-8 text-xs font-medium rounded-lg border transition-all ${
              pg === page
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-slate-600 border-surface-border hover:border-primary hover:text-primary"
            }`}
          >
            {pg}
          </button>
        ))}

        {/* Next */}
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-surface-border bg-white text-slate-500 disabled:opacity-40 hover:border-primary hover:text-primary transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// InventoryLogPage
// ─────────────────────────────────────────────────────────────────────────────
export default function InventoryLogPage() {
  const {
    warehouseId,
    setWarehouseId,
    movementType,
    setMovementType,
    skuName,
    setSkuName,
    handleSearch,
    page,
    setPage,
    items,
    pagination,
    warehouses,
    isLoading,
    isFetching,
    isError,
    error,
    selectedIds,
    toggleSelect,
    toggleAll,
    allSelected,
  } = useInventoryLog();

  console.log("items", items);

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Inventory log" />

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl border border-surface-border p-4">
        <div className="grid grid-cols-3 gap-3 max-w-2xl">
          {/* Type */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Type</p>
            <div className="relative">
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
              >
                {MOVEMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Select Warehouse */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Warehouse
            </p>
            <div className="relative">
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
              >
                <option value="">Warehouse name here</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Seller SKU */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Seller SKU
            </p>

            <div className="relative">
              <input
                type="text"
                placeholder="Input seller SKU here"
                value={skuName}
                onChange={(e) => setSkuName(e.target.value)}
                className="w-full pl-3 pr-10 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />

              {/* 🔍 Search Icon */}
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-100 transition"
              >
                <Search size={16} className="text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-600">
          Failed to load inventory log: {error?.message ?? "Unknown error"}
        </div>
      )}

      {/* ── Table card ── */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="py-3 pl-5 w-12 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                  />
                </th>
                {[
                  "SL No",
                  "Seller SKU",
                  "Stock In Quantity",
                  "Stock Out Quantity",
                  "Remaining Quantity",
                  "Operation Time",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 pr-4 text-left text-sm font-semibold text-slate-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-slate-400 text-sm"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                items.map((log, idx) => {
                  const delta = log.quantity_delta ?? 0;
                  const stockIn = delta > 0 ? delta : 0;
                  const stockOut = delta < 0 ? Math.abs(delta) : 0;
                  const remaining = log.qty_on_hand_after ?? 0;
                  const sl = String(
                    (page - 1) * pagination.limit + idx + 1,
                  ).padStart(2, "0");

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-surface/50 transition-colors ${
                        selectedIds.includes(log.id) ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <td className="pl-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(log.id)}
                          onChange={() => toggleSelect(log.id)}
                          className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 pr-4 text-slate-700">{sl}</td>
                      <td className="py-3.5 pr-4 font-mono text-slate-700">
                        {log.merchantSku?.sku_name ?? "—"}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-700">{stockIn}</td>
                      <td className="py-3.5 pr-4 text-slate-700">{stockOut}</td>
                      <td className="py-3.5 pr-4 text-slate-700">
                        {remaining.toLocaleString()}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-500 text-xs">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination (replaces InvFooter pagination) ── */}
        <Pagination
          pagination={pagination}
          page={page}
          setPage={setPage}
          isFetching={isFetching}
        />

        {/* ── Export / Print footer ── */}
        <InvFooter />
      </div>
    </div>
  );
}
