import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

const statusClass = (statusCode = "") => {
  const value = String(statusCode).toLowerCase();
  if (["created", "manifested"].includes(value)) return "text-emerald-600";
  if (["failed", "cancelled"].includes(value)) return "text-red-500";
  if (["creating", "manifesting", "cancelling"].includes(value)) return "text-blue-600";
  return "text-primary-text";
};

const getStatusCode = (order) => String(order?.statusCode || order?.afterShip?.status || order?.rawProviderStatus || "").toLowerCase();
const isCodOrder = (order) => String(order?.paymentType || "").toUpperCase() === "COD";
const canSubmit = (status) => !status || status === "failed";
const canPrint = (status) => ["created", "manifesting", "manifested"].includes(status);
const canRefresh = (status) => ["creating", "created", "cancelling", "manifesting", "manifested"].includes(status);
const canCancel = (status) => status === "created";
const canCreatePickup = (status) => status === "created";
const canMarkCodPaid = (order) => isCodOrder(order) && String(order?.liveStatus || "").toLowerCase() === "delivered" && String(order?.codStatus || "").toUpperCase() !== "COD_PAID_TO_COMPANY";

export default function ManualOrderAftershipTable({
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
  onCreatePickup,
  onMarkCodPaid,
  onRetry,
  pushLoadingId = "",
  cancelLoadingId = "",
  refreshLoadingId = "",
  pickupLoadingId = "",
  codSettlementLoadingId = "",
}) {
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
            <th className="py-3 pr-4">Label ID</th>
            <th className="py-3 pr-4">Tracking Number</th>
            <th className="py-3 pr-4">Courier</th>
            <th className="py-3 pr-4">AfterShip Status</th>
            <th className="py-3 pr-4">Live Status</th>
            <th className="py-3 pr-4">Payment</th>
            <th className="py-3 pr-4">Country</th>
            <th className="py-3 pr-4">Created</th>
            <th className="py-3 pr-5">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border bg-white">
          {loading ? (
            <tr><td colSpan={11} className="py-8 text-center text-xs text-slate-400">Loading AfterShip parcels...</td></tr>
          ) : isError ? (
            <tr>
              <td colSpan={11} className="py-20 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <AlertCircle size={36} className="text-red-400 opacity-70" />
                  <p className="text-sm font-medium text-slate-700">Failed to load AfterShip parcels</p>
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
            <tr><td colSpan={11} className="py-8 text-center text-xs text-slate-400">No AfterShip parcels found for this status.</td></tr>
          ) : (
            orders.map((order) => {
              const rowId = order.id;
              const statusCode = getStatusCode(order);
              const pushing = String(pushLoadingId) === String(rowId);
              const cancelling = String(cancelLoadingId) === String(rowId);
              const refreshing = String(refreshLoadingId) === String(rowId);
              const creatingPickup = String(pickupLoadingId) === String(rowId);
              const settlingCod = String(codSettlementLoadingId) === String(rowId);
              const country = order.country || order.sender?.country || order.afterShip?.country || order.raw?.country || "-";
              const awb = order.awbNumber || order.trackingNo || "-";
              const labelId = order.labelId || order.afterShip?.labelId || order.providerShipmentNumber || "-";
              const liveStatus = order.liveStatus || "-";
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
                  <td className="py-3 pr-4 font-mono text-xs text-slate-500">{labelId}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-500">{awb}</td>
                  <td className="py-3 pr-4 text-xs text-slate-600">{order.logisticCompany || order.logistics?.logisticsName || "-"}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-semibold ${statusClass(statusCode)}`}>{order.status}</span>
                  </td>
                  <td className="py-3 pr-4 text-xs font-semibold text-slate-600">{liveStatus}</td>
                  <td className="py-3 pr-4 text-xs font-semibold text-slate-700">{order.paymentType}</td>
                  <td className="py-3 pr-4 text-xs text-slate-600">{country}</td>
                  <td className="py-3 pr-4 text-xs text-slate-500">{order.createdAt}</td>
                  <td className="py-3 pr-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {canSubmit(statusCode) && (
                        <button
                          onClick={() => onPush?.(order)}
                          disabled={pushing}
                          className="text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-slate-300"
                        >
                          {pushing ? "Processing..." : "Submit"}
                        </button>
                      )}
                      {canPrint(statusCode) && (
                        <button
                          onClick={() => onPush?.(order)}
                          disabled={pushing}
                          className="text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-slate-300"
                        >
                          {pushing ? "Processing..." : "Print"}
                        </button>
                      )}
                      {canRefresh(statusCode) && (
                        <button
                          title="Refresh status"
                          onClick={() => onRefreshStatus?.(order)}
                          disabled={refreshing || (!order.awbNumber && !order.trackingNo && !order.providerShipmentNumber)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary disabled:cursor-not-allowed disabled:text-slate-300"
                        >
                          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                          Refresh
                        </button>
                      )}
                      {canCancel(statusCode) && (
                        <button
                          onClick={() => onCancel?.(order)}
                          disabled={cancelling}
                          className="text-xs font-semibold text-red-500 hover:underline disabled:cursor-not-allowed disabled:text-slate-300"
                        >
                          {cancelling ? "Cancelling..." : "Cancel"}
                        </button>
                      )}
                      {canCreatePickup(statusCode) && (
                        <button
                          onClick={() => onCreatePickup?.(order)}
                          disabled={creatingPickup}
                          className="text-xs font-semibold text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300"
                        >
                          {creatingPickup ? "Creating..." : "Pickup"}
                        </button>
                      )}
                      {canMarkCodPaid(order) && (
                        <button
                          onClick={() => onMarkCodPaid?.(order)}
                          disabled={settlingCod}
                          className="text-xs font-semibold text-emerald-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300"
                        >
                          {settlingCod ? "Saving..." : "Mark COD Paid"}
                        </button>
                      )}
                      <button
                        onClick={() => onDetails?.(order)}
                        className="text-xs font-semibold text-[#004368] hover:underline"
                      >
                        Details
                      </button>
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
