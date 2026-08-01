import { useRef, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Printer,
  Pencil,
  Ship,
  X,
  Package,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Topbar from "../../../../components/layout/Topbar";
import OutboundFilterBar from "../draft/component/OutboundFilterBar";
import OutboundTable from "../draft/component/OutboundTable";
import { useOutboundList } from "../hooks/useOutboundList";
import { useOutboundDropdowns } from "../hooks/useOutboundDropdowns";
import { useReceiveOutbound } from "../hooks/useReceiveOutbound";
import { exportRowsToCsv, exportRowsToXlsx, printRows } from "../../../../utils/tableOutput";
import ExportMenu from "../../../../components/shared/ExportMenu";
import ListPageSizePagination from "../../../../components/shared/ListPageSizePagination";
import {
  buildOutboundOutputRows,
  outboundOutputColumns,
} from "../../shared/outboundOutput";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// OutboundOnTheWayPage — On The Way list + Receive modal
// ─────────────────────────────────────────────────────────────────────────────

export default function OutboundOnTheWayPage() {
  const [showBulkDrop, setShowBulkDrop] = useState(false);
  const bulkRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (bulkRef.current && !bulkRef.current.contains(e.target))
        setShowBulkDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const {
    warehouseId,
    setWarehouseId,
    timeType,
    setTimeType,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    outboundType,
    setOutboundType,
    search,
    setSearch,
    page,
    setPage,
    pageSizeInput,
    setPageSizeInput,
    applyPageSize,
    items,
    pagination,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    selectedIds,
    selectedItems: selectedOutboundItems,
    selectionLoading,
    toggleSelect,
    toggleAll,
    clearSelected,
  } = useOutboundList({ status: "on_the_way" });

  const { warehouseOptions, warehouseLoading } = useOutboundDropdowns();

  const {
    openReceiveModal,
    showReceiveModal,
    setShowReceiveModal,
    receiveTarget,
    lines,
    detailLoading,
    bulkDetails,
    bulkDetailLoading,
    receivedQtys,
    receiveNotes,
    setReceiveNotes,
    handleReceivedQtyChange,
    fillAllExpected,
    confirmReceive,
    canConfirmReceive,
    receiving,
  } = useReceiveOutbound({ onSuccess: clearSelected });

  const selectedItems = useMemo(
    () => selectedOutboundItems.length === selectedIds.length
      ? selectedOutboundItems
      : items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds, selectedOutboundItems],
  );
  const outputItems = selectedItems.length > 0 ? selectedItems : items;

  const openSelectedReceiveModal = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one outbound order");
      return;
    }

    openReceiveModal(selectedItems);
  };

  // 3-dot action items for on_the_way rows
  const actionItems = [
    { label: "Receive", icon: Package, onClick: openReceiveModal },
  ];
  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Outbound" />

      <OutboundFilterBar
        warehouseId={warehouseId}
        setWarehouseId={setWarehouseId}
        warehouseOptions={warehouseOptions}
        warehouseLoading={warehouseLoading}
        timeType={timeType}
        setTimeType={setTimeType}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        outboundType={outboundType}
        setOutboundType={setOutboundType}
        search={search}
        setSearch={setSearch}
        onSearch={() => setPage(1)}
      />

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-base font-bold text-slate-800 font-display mb-4">
            Outbound List
          </h2>

          <div className="flex items-center gap-2 mb-4">
            <div className="relative" ref={bulkRef}>
              <button
                onClick={() => setShowBulkDrop((p) => !p)}
                disabled={selectedIds.length === 0 || receiving}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-50"
              >
                Bulk Action
                <ChevronDown
                  size={13}
                  className={`text-slate-400 transition-transform ${showBulkDrop ? "rotate-180" : ""}`}
                />
              </button>
              {showBulkDrop && (
                <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-28">
                  {["Receive"].map((a) => (
                    <button
                      key={a}
                      onClick={() => {
                        setShowBulkDrop(false);
                        if (a === "Receive") openSelectedReceiveModal();
                      }}
                      className="w-full text-left px-4 py-2 text-sm transition-colors text-slate-700 hover:bg-surface-card"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedIds.length > 0 && (
              <span className="text-xs text-slate-500 bg-surface-card px-2.5 py-1 rounded-full">
                {selectedIds.length} selected
              </span>
            )}
          </div>
        </div>

        <OutboundTable
          items={items}
          selectedIds={selectedIds}
          selectionLoading={selectionLoading}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          actionItems={actionItems}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          errorMessage={
            error?.response?.data?.message ??
            "Failed to load on-the-way outbounds"
          }
          onRetry={() => {
            setPage(1);
            refetch?.();
          }}
        />

        {false && !isLoading && !isError && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border">
            <p className="text-xs text-slate-500">
              {(page - 1) * pagination.limit + 1}–
              {Math.min(page * pagination.limit, pagination.total)} of{" "}
              {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-surface-border rounded-lg disabled:opacity-40 hover:bg-surface-card transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages}
                className="px-3 py-1 text-xs border border-surface-border rounded-lg disabled:opacity-40 hover:bg-surface-card transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
        <ListPageSizePagination
          page={page}
          limit={pagination.limit || 10}
          total={pagination.total || 0}
          itemLabel="Inventory items"
          pageSizeInput={pageSizeInput}
          onPageChange={setPage}
          onPageSizeInputChange={setPageSizeInput}
          onApplyPageSize={applyPageSize}
          loading={isFetching}
        />

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
          <ExportMenu
            onExportCsv={() => exportRowsToCsv(buildOutboundOutputRows(outputItems), outboundOutputColumns, "on-the-way-outbounds.csv", "outbound")}
            onExportXlsx={() => exportRowsToXlsx(buildOutboundOutputRows(outputItems), outboundOutputColumns, "on-the-way-outbounds.xlsx", "outbound")}
          />
          <button
            onClick={() => printRows(buildOutboundOutputRows(outputItems), outboundOutputColumns, "On The Way Outbounds", "outbound")}
            className="px-16 py-2.5 text-base font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors"
          >
            Print
          </button>
        </div>
      </div>

      {/* Receive Modal */}
      {showReceiveModal && receiveTarget && (
        <ReceiveModal
          target={receiveTarget}
          lines={lines}
          loading={detailLoading}
          bulkDetails={bulkDetails}
          bulkLoading={bulkDetailLoading}
          receivedQtys={receivedQtys}
          notes={receiveNotes}
          onNotesChange={setReceiveNotes}
          onQtyChange={handleReceivedQtyChange}
          onFillAll={fillAllExpected}
          onConfirm={confirmReceive}
          canConfirm={canConfirmReceive}
          onCancel={() => setShowReceiveModal(false)}
          receiving={receiving}
        />
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Receive Modal — warehouse counts each line
// ─────────────────────────────────────────────────────────────────────────────
function ReceiveModal({
  target,
  lines,
  loading,
  bulkDetails = [],
  bulkLoading = false,
  receivedQtys,
  notes,
  onNotesChange,
  onQtyChange,
  onFillAll,
  onConfirm,
  canConfirm,
  onCancel,
  receiving,
}) {
  const targetCount = Array.isArray(target) ? target.length : target ? 1 : 0;
  const isBulkTarget = targetCount > 1;
  const targetLabel = isBulkTarget
    ? `${targetCount} selected outbound orders`
    : target?.outbound_id ?? "selected outbound";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(200,210,220,0.55)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
        style={{ animation: "popIn 0.15s ease both" }}
      >
        <div className="px-7 pt-7 pb-4 border-b border-surface-border flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">
              Receive Outbound
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter actual quantities received for{" "}
              <span className="font-semibold">{targetLabel}</span>
            </p>
          </div>
          <button
            onClick={onFillAll}
            className="text-xs font-semibold text-primary hover:text-primary-dark border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
          >
            Fill all expected
          </button>
        </div>

        <div className="px-7 py-4 max-h-80 overflow-y-auto">
          {isBulkTarget ? (
            bulkLoading ? (
              <div className="flex items-center justify-center h-24 gap-2 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin text-primary" />{" "}
                Loading lines...
              </div>
            ) : (
              <div className="space-y-5">
                {bulkDetails.map((detail) => (
                  <div key={detail.id} className="rounded-xl border border-surface-border overflow-hidden">
                    <div className="bg-surface-card px-4 py-2.5">
                      <p className="text-xs font-semibold text-slate-700">
                        Outbound ID: {detail.outbound_id ?? detail.id}
                      </p>
                    </div>
                    {detail.lines?.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                          <tr className="border-b border-surface-border">
                            {["Product", "SKU", "Expected", "Received"].map((h) => (
                              <th
                                key={h}
                                className="py-2 pr-3 text-left text-xs font-semibold text-slate-500 first:pl-4"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {detail.lines.map((line) => {
                            const received = receivedQtys[line.id] ?? line.qty_expected;
                            const hasDiscrepancy = Number(received) !== line.qty_expected;

                            return (
                              <tr key={line.id}>
                                <td className="py-2.5 pl-4 pr-3 text-slate-700 text-xs truncate max-w-[180px]">
                                  {line.merchantSku?.sku_title ?? "-"}
                                </td>
                                <td className="py-2.5 pr-3 font-mono text-xs text-slate-500">
                                  {line.merchantSku?.sku_name ?? "-"}
                                </td>
                                <td className="py-2.5 pr-3 text-xs font-semibold text-slate-700">
                                  {line.qty_expected}
                                </td>
                                <td className="py-2.5 pr-3">
                                  <input
                                    type="number"
                                    min={0}
                                    value={received}
                                    onChange={(e) => onQtyChange(line.id, e.target.value)}
                                    className={`w-20 px-2 py-1 text-xs border rounded-lg text-center outline-none focus:border-primary transition-all ${
                                      hasDiscrepancy ? "border-amber-400 bg-amber-50 text-amber-700" : "border-surface-border"
                                    }`}
                                  />
                                  {hasDiscrepancy && (
                                    <p className="text-xs text-amber-600 mt-0.5">
                                      Discrepancy
                                    </p>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <p className="py-6 text-center text-sm text-slate-400">No lines found</p>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : loading ? (
            <div className="flex items-center justify-center h-24 gap-2 text-xs text-slate-400">
              <Loader2 size={14} className="animate-spin text-primary" />{" "}
              Loading lines...
            </div>
          ) : lines.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No lines found
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                <tr className="border-b border-surface-border">
                  {["Product", "SKU", "Expected", "Received"].map((h) => (
                    <th
                      key={h}
                      className="py-2 pr-3 text-left text-xs font-semibold text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {lines.map((line) => {
                  const received = receivedQtys[line.id] ?? "";
                  const hasDiscrepancy =
                    received !== "" && Number(received) !== line.qty_expected;
                  return (
                    <tr key={line.id}>
                      <td className="py-2.5 pr-3 text-slate-700 text-xs truncate max-w-[180px]">
                        {line.merchantSku?.sku_title ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs text-slate-500">
                        {line.merchantSku?.sku_name ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3 text-xs font-semibold text-slate-700">
                        {line.qty_expected}
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="number"
                          min={0}
                          value={received}
                          onChange={(e) => onQtyChange(line.id, e.target.value)}
                          placeholder={String(line.qty_expected)}
                          className={`w-20 px-2 py-1 text-xs border rounded-lg text-center outline-none focus:border-primary transition-all
                                                        ${hasDiscrepancy ? "border-amber-400 bg-amber-50 text-amber-700" : "border-surface-border"}`}
                        />
                        {hasDiscrepancy && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            Discrepancy
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-7 pb-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Any additional notes about this receipt..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none resize-none focus:border-primary"
          />
        </div>

        <div className="flex justify-end gap-3 px-7 py-4 border-t border-surface-border">
          <button
            onClick={onCancel}
            disabled={receiving}
            className="px-6 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 hover:bg-surface-card disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={receiving || loading || !canConfirm}
            className="px-6 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl disabled:opacity-60 flex items-center gap-2"
          >
            {receiving && <Loader2 size={13} className="animate-spin" />}
            {receiving ? "Confirming..." : "Confirm Receipt"}
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmClass,
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
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
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
            className="px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 hover:bg-surface-card disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-60 flex items-center gap-2 ${confirmClass}`}
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
