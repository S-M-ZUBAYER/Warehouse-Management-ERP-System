import { useRef, useEffect, useState } from "react";
import {
  Plus,
  Printer,
  Pencil,
  Ship,
  X,
  Trash2,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Topbar from "../../../../components/layout/Topbar";
import InboundFilterBar from "./component/InboundFilterBar";
import InboundTable from "./component/InboundTable";
import SelectMerchantSKUModal from "./component/SelectMerchantSKUModal";
import { useInboundList } from "../hooks/useInboundList";
import { useInboundDropdowns } from "../hooks/useInboundDropdowns";
import { useCreateInbound } from "../hooks/useCreateInbound";
import { useShipInbound } from "../hooks/useShipInbound";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// InboundDraftPage — Draft List + Create Inbound sub-page
// ─────────────────────────────────────────────────────────────────────────────

export default function InboundDraftPage() {
  const [showCreatePage, setShowCreatePage] = useState(false);

  if (showCreatePage) {
    return <CreateInboundPage onBack={() => setShowCreatePage(false)} />;
  }
  return <DraftListPage onCreateClick={() => setShowCreatePage(true)} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Draft List
// ─────────────────────────────────────────────────────────────────────────────
function DraftListPage({ onCreateClick }) {
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
    timeFilter,
    setTimeFilter,
    inboundType,
    setInboundType,
    search,
    setSearch,
    page,
    setPage,
    items,
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
    openCancelModal,
    showCancelModal,
    setShowCancelModal,
    actionTarget,
    confirmCancel,
    cancelling,
  } = useInboundList({ status: "draft" });

  const { warehouseOptions, warehouseLoading } = useInboundDropdowns();
  const {
    openShipModal,
    showShipModal,
    setShowShipModal,
    shipForm,
    shipErrors,
    handleShipFormChange,
    confirmShip,
    shipping,
    shipTarget,
  } = useShipInbound();

  // 3-dot action items for draft rows
  const actionItems = [
    { label: "Ship", icon: Ship, onClick: openShipModal },
    { label: "Cancel", icon: X, onClick: openCancelModal, danger: true },
  ];

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Inbound" />

      <InboundFilterBar
        warehouseId={warehouseId}
        setWarehouseId={setWarehouseId}
        warehouseOptions={warehouseOptions}
        warehouseLoading={warehouseLoading}
        timeType={timeType}
        setTimeType={setTimeType}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        inboundType={inboundType}
        setInboundType={setInboundType}
        search={search}
        setSearch={setSearch}
        onSearch={() => setPage(1)}
      />

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-base font-bold text-slate-800 font-display mb-4">
            Draft List
          </h2>

          <div className="flex items-center gap-2 mb-4 justify-between">
            <div className="flex items-center gap-2">
              {/* Ship selected */}
              <button
                disabled={selectedIds.length === 0}
                className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-50"
              >
                Ship
              </button>

              {/* Bulk Action */}
              <div className="relative" ref={bulkRef}>
                <button
                  onClick={() => setShowBulkDrop((p) => !p)}
                  disabled={selectedIds.length === 0}
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
                    {["Ship", "Cancel"].map((a) => (
                      <button
                        key={a}
                        onClick={() => setShowBulkDrop(false)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${a === "Cancel" ? "text-red-500 hover:bg-red-50" : "text-slate-700 hover:bg-surface-card"}`}
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

            <button
              onClick={onCreateClick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              <Plus size={14} /> Create Inbound
            </button>
          </div>
        </div>

        <InboundTable
          items={items}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          actionItems={actionItems}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          errorMessage={
            error?.response?.data?.message ?? "Failed to load draft inbounds"
          }
          onRetry={() => setPage(1)}
        />

        {/* Pagination */}
        {!isLoading && !isError && pagination.totalPages > 1 && (
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

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
          <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
            Export <ChevronDown size={13} className="text-slate-400" />
          </button>
          <button className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">
            Print
          </button>
        </div>
      </div>

      {/* Cancel confirm modal */}
      {showCancelModal && actionTarget && (
        <ConfirmModal
          title="Cancel Inbound Order"
          message={
            <>
              Cancel inbound{" "}
              <span className="font-semibold">{actionTarget.inbound_id}</span>?
              This will reverse any qty_inbound already incremented.
            </>
          }
          confirmLabel={cancelling ? "Cancelling..." : "Cancel Order"}
          confirmClass="bg-red-500 hover:bg-red-600 text-white"
          loading={cancelling}
          onCancel={() => setShowCancelModal(false)}
          onConfirm={confirmCancel}
        />
      )}

      {/* Ship modal */}
      {showShipModal && (
        <ShipModal
          target={shipTarget}
          form={shipForm}
          errors={shipErrors}
          onChange={handleShipFormChange}
          onConfirm={confirmShip}
          onCancel={() => setShowShipModal(false)}
          loading={shipping}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Inbound sub-page
// ─────────────────────────────────────────────────────────────────────────────
function CreateInboundPage({ onBack }) {
  const [showSkuModal, setShowSkuModal] = useState(false);

  const {
    form,
    errors,
    handleFormChange,
    handleWarehouseSelect,
    lines,
    removeLine,
    updateLineQty,
    warehouseSearch,
    setWarehouseSearch,
    warehouses,
    warehouseLoading,
    isWarehouseError,
    skuSearch,
    setSkuSearch,
    pickerSkus,
    pickerLoading,
    pickerFetching,
    isPickerError,
    selectedIds,
    quantities,
    toggleSku,
    updatePickerQty,
    removeFromPicker,
    clearPickerAll,
    pickerPreviewItems,
    confirmSkuSelection,
    saving,
    handleSave,
  } = useCreateInbound({ onSuccess: onBack });

  const { warehouseOptions, warehouseLoading: ddLoading } =
    useInboundDropdowns();

  const handleConfirmModal = () => {
    confirmSkuSelection();
    setShowSkuModal(false);
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Back to Draft" showBack onBack={onBack} />

      {/* Warehouse selector + basic fields */}
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <div className="grid grid-cols-3 gap-4">
          {/* Warehouse */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Warehouse <span className="text-red-400">*</span>
            </p>
            <div className="relative mb-1.5">
              <select
                value={form.warehouseId}
                onChange={(e) => {
                  const opt = warehouseOptions.find(
                    (o) => o.value === e.target.value,
                  );
                  if (opt)
                    handleWarehouseSelect({ id: opt.value, name: opt.label });
                }}
                className={`w-full appearance-none pl-3 pr-8 py-2 text-sm border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer
                                    ${errors.warehouseId ? "border-red-300" : "border-surface-border"}`}
              >
                <option value="">Warehouse name here</option>
                {warehouseOptions.slice(1).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
            {errors.warehouseId && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.warehouseId}
              </p>
            )}
          </div>

          {/* Supplier Name */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Supplier Name
            </p>
            <input
              name="supplierName"
              value={form.supplierName}
              onChange={handleFormChange}
              placeholder="Supplier name"
              className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
            />
          </div>

          {/* Supplier Reference */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Supplier Reference / PO No.
            </p>
            <input
              name="supplierReference"
              value={form.supplierReference}
              onChange={handleFormChange}
              placeholder="PO-001"
              className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Draft items table */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div>
            <h2 className="text-base font-bold text-slate-800 font-display">
              Draft List
            </h2>
            {errors.lines && (
              <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.lines}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              if (form.warehouseId) {
                setShowSkuModal(true);
              } else {
                toast.error("Please select the warehouse first");
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <Plus size={14} /> Select Merchant SKU
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-surface-border">
                {[
                  "Image",
                  "Product Name",
                  "Merchant SKU",
                  "Quantity",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-5 text-left text-sm font-semibold text-slate-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-14 text-center text-sm text-slate-400"
                  >
                    No SKUs added — click "Select Merchant SKU"
                  </td>
                </tr>
              ) : (
                lines.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface/50 transition-colors"
                  >
                    <td className="py-3 px-5">
                      <img
                        src={
                          item.image_url ||
                          "https://placehold.co/36x36/E6ECF0/004368?text=?"
                        }
                        alt={item.sku_title}
                        className="w-9 h-9 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/36x36/E6ECF0/004368?text=?";
                        }}
                      />
                    </td>
                    <td className="py-3 px-5 text-slate-700">
                      {item.sku_title}
                    </td>
                    <td className="py-3 px-5 font-mono text-xs text-slate-600">
                      {item.sku_name}
                    </td>
                    <td className="py-3 px-5">
                      <input
                        type="number"
                        min={1}
                        value={item.qtyExpected}
                        onChange={(e) => updateLineQty(item.id, e.target.value)}
                        className="w-16 px-2 py-1 text-xs border border-surface-border rounded-lg text-center outline-none focus:border-primary"
                      />
                    </td>
                    <td className="py-3 px-5">
                      <button
                        onClick={() => removeLine(item.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-1">
        <button
          onClick={onBack}
          disabled={saving}
          className="px-7 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-7 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save
        </button>
      </div>
      <SelectMerchantSKUModal
        open={showSkuModal}
        onClose={() => setShowSkuModal(false)}
        onConfirm={handleConfirmModal}
        skuSearch={skuSearch}
        setSkuSearch={setSkuSearch}
        pickerSkus={pickerSkus}
        pickerLoading={pickerLoading}
        pickerFetching={pickerFetching}
        isPickerError={isPickerError}
        selectedIds={selectedIds}
        quantities={quantities}
        toggleSku={toggleSku}
        updatePickerQty={updatePickerQty}
        removeFromPicker={removeFromPicker}
        clearPickerAll={clearPickerAll}
        pickerPreviewItems={pickerPreviewItems}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ship Modal — same styling as other confirm modals
// ─────────────────────────────────────────────────────────────────────────────
function ShipModal({
  target,
  form,
  errors,
  onChange,
  onConfirm,
  onCancel,
  loading,
}) {
  const CURRENCIES = ["USD", "MYR", "SGD", "THB", "IDR", "PHP", "VND", "CNY"];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(200,210,220,0.55)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-96 p-7"
        style={{ animation: "popIn 0.15s ease both" }}
      >
        <h3 className="text-base font-bold text-slate-800 font-display mb-1">
          Ship Inbound
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Confirm shipment details for{" "}
          <span className="font-semibold">{target?.inbound_id}</span>
        </p>

        <div className="space-y-3">
          {[
            {
              label: "Tracking Number *",
              name: "trackingNumber",
              placeholder: "TRK-ABC123",
            },
            {
              label: "Estimated Arrival *",
              name: "estimatedArrival",
              type: "date",
            },
            {
              label: "Exchange Rate",
              name: "exchangeRate",
              placeholder: "4.65",
            },
            {
              label: "Shipping Cost",
              name: "shippingCost",
              placeholder: "25.00",
            },
          ].map(({ label, name, placeholder, type }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {label}
              </label>
              <input
                type={type ?? "text"}
                name={name}
                value={form[name]}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary transition-all
                                    ${errors[name] ? "border-red-300" : "border-surface-border"}`}
              />
              {errors[name] && (
                <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>
              )}
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Purchase Currency *
            </label>
            <select
              name="purchaseCurrency"
              value={form.purchaseCurrency}
              onChange={onChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-700 outline-none focus:border-primary ${errors.purchaseCurrency ? "border-red-300" : "border-surface-border"}`}
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {errors.purchaseCurrency && (
              <p className="text-xs text-red-500 mt-0.5">
                {errors.purchaseCurrency}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 hover:bg-surface-card transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {loading ? "Shipping..." : "Confirm Ship"}
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic Confirm Modal
// ─────────────────────────────────────────────────────────────────────────────
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
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2 ${confirmClass ?? "bg-primary hover:bg-primary-dark text-white"}`}
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
