import { Loader2, MoreHorizontal, Search } from "lucide-react";
import { useState } from "react";
import RecordDetailModal from "../../../../components/shared/RecordDetailModal";

// ─────────────────────────────────────────────────────────────────────────────
// OrderTable — shared table component for all order list pages
// Props:
//   orders, selectedIds, onToggleSelect, onToggleAll, allSelected
//   showActions — shows Push/Withdraw/Details action column
//   actionLabel — "Push" | "Withdraw" | "Details" etc
//   onAction — callback(order)
//   onDetails — callback(order)
//   extraColumns — additional columns beyond the standard set
// ─────────────────────────────────────────────────────────────────────────────

export default function OrderTable({
  orders,
  loading = false,
  isError = false,
  errorMessage = "Failed to load orders",
  selectedIds = [],
  onToggleSelect,
  onToggleAll,
  allSelected,
  pagination,
  page,
  setPage,
  actionLabel,
  onAction,
  rowActions,
  onDetails,
  statusLabel = "Status",
  showActionsCol = true,
  compact = false,
}) {
  const someSelected =
    orders.some((o) => selectedIds.includes(o.id)) && !allSelected;
  const [detailOrder, setDetailOrder] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const tableTextClass = compact ? "text-sm font-body" : "text-sm";
  const headerTextClass = compact
    ? "text-sm font-bold text-slate-800"
    : "text-base font-semibold text-primary-text";
  const smallCellTextClass = compact ? "text-sm" : "text-xs";
  const totalColumns = showActionsCol && actionLabel ? 11 : 10;

  return (
    <div className="font-body">
      <div className="overflow-x-auto">
        <table className={`w-full ${tableTextClass}`}>
          <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
            <tr className="border-b border-surface-border">
              <th className="py-3 pl-5 text-left max-w-40 flex items-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={loading || isError || orders.length === 0}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={onToggleAll}
                  className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span className={`pl-2 ${headerTextClass}`}>
                  Select All
                </span>
              </th>
              {[
                "Warehouse package No.",
                "Image",
                "SKU",
                "Order Number",
                "Tracking Number",
                "Price",
                "Create Time",
                statusLabel,
                "Details",
              ].map((h) => (
                <th
                  key={h}
                  className={`py-3 pr-4 text-left ${headerTextClass}`}
                >
                  {h}
                </th>
              ))}
              {showActionsCol && actionLabel && (
                <th className={`py-3 pr-5 text-left ${headerTextClass}`}>
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-surface-border">
            {loading ? (
              <TableSkeleton colSpan={totalColumns} />
            ) : isError ? (
              <tr>
                <td colSpan={totalColumns} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-red-400">
                    <p className="text-sm font-medium">{errorMessage}</p>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={totalColumns}
                  className="py-14 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Search size={30} className="opacity-30" />
                    <p className="text-sm font-medium">No orders found</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
              const isSelected = selectedIds.includes(order.id);
              return (
                <tr
                  key={order.id}
                  className={`transition-colors hover:bg-surface/50 ${isSelected ? "bg-blue-50/40" : ""}`}
                >
                  {/* Checkbox */}
                  <td className="pl-5 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(order.id)}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                  </td>

                  {/* Package No */}
                  <td className="py-3 pr-4 text-slate-700 font-medium">
                    {order.pkgNo}
                  </td>

                  {/* Image */}
                  <td className="py-3 pr-4">
                    <img
                      src={order.image}
                      alt={order.sku}
                      className="w-9 h-9 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://placehold.co/36x36/E6ECF0/004368?text=?";
                      }}
                    />
                  </td>

                  {/* SKU */}
                  <td className="py-3 pr-4 text-slate-700">{order.sku}</td>

                  {/* Order Number */}
                  <td className={`py-3 pr-4 text-primary-text font-mono ${smallCellTextClass}`}>
                    {order.orderNo}
                  </td>

                  {/* Tracking Number */}
                  <td className={`py-3 pr-4 text-slate-500 font-mono ${smallCellTextClass}`}>
                    {order.trackingNo}
                  </td>

                  {/* Price */}
                  <td className="py-3 pr-4 text-slate-700 font-medium">
                    {order.price}
                  </td>

                  {/* Create Time */}
                  <td className={`py-3 pr-4 text-slate-500 ${smallCellTextClass}`}>
                    {order.createdAt}
                  </td>

                  {/* Status */}
                  <td className="py-3 pr-4">
                    <span
                      className={`${smallCellTextClass} font-medium ${
                        order.status === "To Ship"
                          ? "text-amber-600"
                          : order.status === "Processed"
                            ? "text-blue-600"
                            : order.status === "Shipping"
                              ? "text-indigo-600"
                              : order.status === "Completed"
                                ? "text-emerald-600"
                                : order.status === "Shipped"
                                  ? "text-emerald-600"
                                  : order.status === "Cancelled"
                                    ? "text-red-500"
                                    : "text-primary-text"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  {/* Details */}
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => (onDetails ? onDetails(order) : setDetailOrder(order))}
                      className={`${smallCellTextClass} font-semibold text-[#004368] hover:underline transition-colors`}
                    >
                      Details
                    </button>
                  </td>

                  {/* Action */}
                  {showActionsCol && actionLabel && (
                    <td className="relative py-3 pr-5">
                      {rowActions?.length ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setOpenMenuId((current) => (current === order.id ? null : order.id))}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border text-slate-600 transition-colors hover:bg-surface-card"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {openMenuId === order.id && (
                            <div className="absolute right-5 top-10 z-20 min-w-32 overflow-hidden rounded-lg border border-surface-border bg-white py-1 shadow-lg">
                              {rowActions.map((action) => (
                                <button
                                  key={action.label}
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    action.onClick?.(order);
                                  }}
                                  className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-surface-card"
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => onAction?.(order)}
                          className={`${smallCellTextClass} font-semibold text-primary hover:underline transition-colors`}
                        >
                          {actionLabel}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && !isError && pagination?.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-surface-border">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * pagination.limit + 1}-
            {Math.min(page * pagination.limit, pagination.total)}
            {pagination.hasKnownTotal === false ? " orders" : ` of ${pagination.total} orders`}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage?.((value) => Math.max(1, value - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600 hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {pagination.serverPaginated ? (
              <span className="px-3 py-1.5 text-xs font-semibold text-primary">
                Page {page}
                {pagination.hasKnownTotal ? ` of ${pagination.totalPages}` : ""}
              </span>
            ) : (
              getPaginationPages(page, pagination.totalPages).map((item) =>
                item === "ellipsis" ? (
                  <span key={`${item}-${page}`} className="px-2 text-xs text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage?.(item)}
                    className={`w-8 h-8 text-xs rounded-lg border transition-colors ${
                      page === item
                        ? "bg-primary text-white border-primary"
                        : "border-surface-border text-slate-600 hover:bg-surface-card"
                    }`}
                  >
                    {item}
                  </button>
                )
              )
            )}
            <button
              type="button"
              onClick={() =>
                setPage?.((value) => Math.min(pagination.totalPages, value + 1))
              }
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600 hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <RecordDetailModal
        open={!!detailOrder}
        title="Order Details"
        subtitle={detailOrder?.orderNo}
        record={detailOrder}
        onClose={() => setDetailOrder(null)}
        fields={[
          { label: "Package No.", key: "pkgNo" },
          { label: "SKU", key: "sku" },
          { label: "Order Number", key: "orderNo" },
          { label: "Tracking Number", key: "trackingNo" },
          { label: "Price", key: "price" },
          { label: "Create Time", key: "createdAt" },
          { label: "Status", key: "status" },
        ]}
      />
    </div>
  );
}

function TableSkeleton({ colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-5">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 animate-pulse">
              <div className="w-4 h-4 bg-slate-200 rounded" />
              <div className="w-28 h-4 bg-slate-200 rounded" />
              <div className="w-10 h-10 bg-slate-200 rounded-lg" />
              <div className="w-20 h-4 bg-slate-200 rounded" />
              <div className="w-32 h-4 bg-slate-200 rounded" />
              <div className="w-24 h-4 bg-slate-200 rounded" />
              <div className="w-16 h-4 bg-slate-200 rounded" />
              <div className="w-28 h-4 bg-slate-200 rounded" />
              <Loader2 size={14} className="text-primary animate-spin" />
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}

function getPaginationPages(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);
  if (currentPage > 2) pages.add(currentPage - 1);
  if (currentPage < totalPages - 1) pages.add(currentPage + 1);

  return [...pages]
    .sort((a, b) => a - b)
    .reduce((items, pageNumber, index, sortedPages) => {
      if (index > 0 && pageNumber - sortedPages[index - 1] > 1) {
        items.push("ellipsis");
      }
      items.push(pageNumber);
      return items;
    }, []);
}
