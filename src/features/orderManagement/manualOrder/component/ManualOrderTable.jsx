import { useState } from "react";
import { AlertCircle, Eye, Loader2, MoreHorizontal, Pencil, RefreshCw } from "lucide-react";
import { translateStaticText } from "../../../../i18nDomTranslator";

const statusClass = (statusCode = "") => {
  const value = String(statusCode).toUpperCase();
  if (["DELIVERED"].includes(value)) return "text-emerald-600";
  if (["CANCELLED", "BOOKING_FAILED", "RETURNED"].includes(value)) return "text-red-500";
  if (["COLLECTED", "DELIVERY_IN_TRANSIT", "DROP_OFF"].includes(value)) return "text-indigo-600";
  if (["SCHEDULE_IN_ARRANGEMENT", "TO_BE_COLLECTED", "DELIVERY_ON_HOLD", "BOOKING_PENDING"].includes(value)) return "text-blue-600";
  return "text-primary-text";
};

const getStatusCode = (order) => String(order?.statusCode || order?.shipmentStatus || "").toUpperCase();
const canPush = (status) => ["CREATED", "BOOKING_FAILED"].includes(status);
const canPwbAgain = (status) => ["SCHEDULE_IN_ARRANGEMENT", "TO_BE_COLLECTED", "DROP_OFF"].includes(status);
const canRefresh = (status) => ["SCHEDULE_IN_ARRANGEMENT", "TO_BE_COLLECTED", "DROP_OFF", "COLLECTED", "DELIVERY_IN_TRANSIT", "DELIVERY_ON_HOLD"].includes(status);
const canCancel = (status) => ["SCHEDULE_IN_ARRANGEMENT", "TO_BE_COLLECTED", "DROP_OFF"].includes(status);
const isManualDelivery = (order, status) => status === "MANUAL_DELIVERY" || order?.manualDelivery || String(order?.bookingStatus || "").toUpperCase() === "MANUAL_DELIVERY";

export default function ManualOrderTable({
  orders = [],
  loading = false,
  isError = false,
  selectedIds = [],
  selectionLoading = false,
  onToggleSelect,
  onToggleAll,
  onDetails,
  onPush,
  onCancel,
  onRefreshStatus,
  onUpdateManualDelivery,
  onRetry,
  pushLoadingId = "",
  cancelLoadingId = "",
  refreshLoadingId = "",
}) {
  const tr = (text) => translateStaticText(text);
  const [openMenuId, setOpenMenuId] = useState("");
  const allSelected = orders.length > 0 && orders.every((order) => selectedIds.includes(order.id));
  const someSelected = orders.some((order) => selectedIds.includes(order.id)) && !allSelected;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm font-body">
        <thead>
          <tr className="border-b border-surface-border bg-white text-left text-xs font-bold text-slate-800">
            <th className="py-3 pl-5 pr-4">
              {selectionLoading ? (
                <Loader2 size={16} className="text-primary animate-spin" />
              ) : (
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={loading || isError || orders.length === 0}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={() => onToggleAll?.({ allPages: true })}
                  className="h-4 w-4 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
              )}
            </th>
            <th className="py-3 pl-5 pr-4">Order No</th>
            <th className="py-3 pr-4">Country</th>
            <th className="py-3 pr-4">Receiver</th>
            <th className="py-3 pr-4">Payment</th>
            <th className="py-3 pr-4">Courier</th>
            <th className="py-3 pr-4">Tracking Number</th>
            <th className="py-3 pr-4">Shipment Status</th>
            <th className="py-3 pr-4">Created</th>
            <th className="py-3 pr-5">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border bg-white">
          {loading ? (
            <ManualOrderTableSkeleton />
          ) : isError ? (
            <tr>
              <td colSpan={10} className="py-20 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <AlertCircle size={36} className="text-red-400 opacity-70" />
                  <p className="text-sm font-medium text-slate-700">Failed to load manual orders</p>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
                    >
                      <RefreshCw size={12} /> Retry
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr><td colSpan={10} className="py-8 text-center text-xs text-slate-400">No manual orders found for this status.</td></tr>
          ) : (
            orders.map((order, index) => {
              const rowId = order.id;
              const statusCode = getStatusCode(order);
              const pushing = String(pushLoadingId) === String(rowId);
              const cancelling = String(cancelLoadingId) === String(rowId);
              const refreshing = String(refreshLoadingId) === String(rowId);
              const manualDelivery = isManualDelivery(order, statusCode);
              const country = order.sender?.country || order.easyparcelCountry || order.raw?.easyparcel_country || "-";
              const receiverName = order.buyer?.name || order.buyer?.buyerName || "-";
              const receiverPhone = order.buyer?.phone || "";
              const awb = order.awbNumber || order.trackingNo || "-";
              const openMenuUp = index >= Math.max(0, orders.length - 2);
              return (
                <tr key={rowId} className="transition-colors hover:bg-surface/50">
                  <td className="py-3 pl-5 pr-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(rowId)}
                      onChange={() => onToggleSelect?.(rowId)}
                      className="h-4 w-4 accent-primary"
                    />
                  </td>
                  <td className="py-3 pl-5 pr-4 font-mono text-xs text-primary-text">{order.orderNo}</td>
                  <td className="py-3 pr-4 text-xs text-slate-600">{country}</td>
                  <td className="py-3 pr-4 text-xs text-slate-700">
                    <span className="block max-w-36 truncate font-medium">{receiverName}</span>
                    <span className="block max-w-36 truncate text-slate-400">{receiverPhone}</span>
                  </td>
                  <td className="py-3 pr-4 text-xs font-semibold text-slate-700">{order.paymentType}</td>
                  <td className="py-3 pr-4 text-xs text-slate-600">
                    <span className="block">{order.logisticCompany || order.logistics?.logisticsName || "-"}</span>
                    {manualDelivery && (
                      <span className="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        {tr("Self-arranged")}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-500">{awb}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-semibold ${statusClass(statusCode)}`}>{order.status}</span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-500">{order.createdAt}</td>
                  <td className="relative py-3 pr-5">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId((current) => (current === rowId ? "" : rowId))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary"
                        aria-label={tr("Actions")}
                      >
                        <MoreHorizontal size={17} />
                      </button>
                      {openMenuId === rowId && (
                        <div className={`absolute right-5 z-30 w-40 overflow-hidden rounded-xl border border-surface-border bg-white py-1 shadow-lg ${openMenuUp ? "bottom-10" : "top-10"}`}>
                          {manualDelivery && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId("");
                                onUpdateManualDelivery?.(order);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-surface-card"
                            >
                              <Pencil size={13} className="text-amber-600" />
                              {tr("Edit")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId("");
                              onDetails?.(order);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-surface-card"
                          >
                            <Eye size={13} className="text-primary" />
                            {tr("Details")}
                          </button>
                          {canPush(statusCode) && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId("");
                                onPush?.(order);
                              }}
                              disabled={pushing}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-primary hover:bg-surface-card disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                              {pushing ? tr("Processing...") : statusCode === "BOOKING_FAILED" ? tr("Retry Shipment") : tr("Submit Shipment")}
                            </button>
                          )}
                          {canPwbAgain(statusCode) && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId("");
                                onPush?.(order);
                              }}
                              disabled={pushing}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-primary hover:bg-surface-card disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                              {pushing ? tr("Processing...") : tr("PWB again")}
                            </button>
                          )}
                          {canRefresh(statusCode) && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId("");
                                onRefreshStatus?.(order);
                              }}
                              disabled={refreshing || (!order.awbNumber && !order.trackingNo && !order.providerShipmentNumber)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-surface-card disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                              {tr("Refresh")}
                            </button>
                          )}
                          {canCancel(statusCode) && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId("");
                                onCancel?.(order);
                              }}
                              disabled={cancelling}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                              {cancelling ? tr("Cancelling...") : tr("Cancel")}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function ManualOrderTableSkeleton() {
  return Array.from({ length: 6 }).map((_, index) => (
    <tr key={index} className="animate-pulse">
      <td className="py-3 pl-5 pr-4">
        <div className="h-4 w-32 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-14 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="space-y-1.5">
          <div className="h-4 w-28 rounded bg-slate-200" />
          <div className="h-3 w-24 rounded bg-slate-200" />
        </div>
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-16 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-24 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-16 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-28 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-24 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-24 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-28 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-5">
        <div className="h-4 w-32 rounded bg-slate-200" />
      </td>
    </tr>
  ));
}
