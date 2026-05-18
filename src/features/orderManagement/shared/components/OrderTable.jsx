import { ChevronDown } from "lucide-react";
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
  selectedIds = [],
  onToggleSelect,
  onToggleAll,
  allSelected,
  actionLabel,
  onAction,
  onDetails,
  statusLabel = "Status",
  showActionsCol = true,
  compact = false,
}) {
  const someSelected =
    orders.some((o) => selectedIds.includes(o.id)) && !allSelected;
  const [detailOrder, setDetailOrder] = useState(null);
  const tableTextClass = compact ? "text-sm font-body" : "text-sm";
  const headerTextClass = compact
    ? "text-sm font-bold text-slate-800"
    : "text-base font-semibold text-primary-text";
  const smallCellTextClass = compact ? "text-sm" : "text-xs";

  return (
    <div className="overflow-x-auto font-body">
      <table className={`w-full ${tableTextClass}`}>
        <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
          <tr className="border-b border-surface-border">
            <th className="py-3 pl-5 text-left max-w-40 flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={onToggleAll}
                className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
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
          {orders.length === 0 ? (
            <tr>
              <td
                colSpan={11}
                className="py-14 text-center text-sm text-slate-400"
              >
                No orders found
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
                    <td className="py-3 pr-5">
                      <button
                        onClick={() => onAction?.(order)}
                        className={`${smallCellTextClass} font-semibold text-primary hover:underline transition-colors`}
                      >
                        {actionLabel}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
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
