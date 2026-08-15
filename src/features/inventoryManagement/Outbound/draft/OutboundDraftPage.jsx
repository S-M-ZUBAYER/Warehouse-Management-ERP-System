import { useRef, useEffect, useMemo, useState } from "react";
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
  ArrowLeft,
} from "lucide-react";
import Topbar from "../../../../components/layout/Topbar";
import OutboundFilterBar from "./component/OutboundFilterBar";
import OutboundTable from "./component/OutboundTable";
import SelectMerchantSKUModal from "./component/SelectMerchantSKUModal";
import { useOutboundList } from "../hooks/useOutboundList";
import { useOutboundDropdowns } from "../hooks/useOutboundDropdowns";
import { useCreateOutbound } from "../hooks/useCreateOutbound";
import { useShipOutbound } from "../hooks/useShipOutbound";
import { toast } from "sonner";
import { exportRowsToCsv, exportRowsToXlsx, printRows } from "../../../../utils/tableOutput";
import ExportMenu from "../../../../components/shared/ExportMenu";
import ListPageSizePagination from "../../../../components/shared/ListPageSizePagination";
import {
  buildOutboundOutputRows,
  outboundOutputColumns,
} from "../../shared/outboundOutput";

// ─────────────────────────────────────────────────────────────────────────────
// OutboundDraftPage — Draft List + Create Outbound sub-page
// ─────────────────────────────────────────────────────────────────────────────

export default function OutboundDraftPage() {
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  if (showCreatePage) {
    return <CreateOutboundPage initialOrder={editTarget} onBack={() => { setShowCreatePage(false); setEditTarget(null); }} />;
  }
  return (
    <DraftListPage
      onCreateClick={() => { setEditTarget(null); setShowCreatePage(true); }}
      onEditClick={(item) => { setEditTarget(item); setShowCreatePage(true); }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Draft List
// ─────────────────────────────────────────────────────────────────────────────
function DraftListPage({ onCreateClick, onEditClick }) {
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
    openDeleteModal,
    showDeleteModal,
    setShowDeleteModal,
    actionTarget,
    confirmDelete,
    deleting,
  } = useOutboundList({ status: "draft" });

  const { warehouseOptions, warehouseLoading } = useOutboundDropdowns();
  const {
    openShipModal,
    showShipModal,
    setShowShipModal,
    shipForm,
    shipErrors,
    handleShipFormChange,
    requestShipConfirmation,
    confirmShip,
    shipping,
    shipTarget,
    showShipConfirmModal,
    setShowShipConfirmModal,
  } = useShipOutbound({ onSuccess: clearSelected });

  const selectedItems = useMemo(
    () => selectedOutboundItems.length === selectedIds.length
      ? selectedOutboundItems
      : items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds, selectedOutboundItems],
  );
  const outputItems = selectedItems.length > 0 ? selectedItems : items;

  const openSelectedShipModal = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one outbound order");
      return;
    }

    openShipModal(selectedItems);
  };

  const deleteTargetLabel = actionTarget?.outbound_id ?? "selected outbound";

  // 3-dot action items for draft rows
  const actionItems = [
    { label: "Ship", icon: Ship, onClick: openShipModal },
    { label: "Edit", icon: Pencil, onClick: onEditClick },
    { label: "Delete", icon: Trash2, onClick: openDeleteModal, danger: true },
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
            Draft List
          </h2>

          <div className="flex items-center gap-2 mb-4 justify-between">
            <div className="flex items-center gap-2">
              {/* Ship selected */}
              <button
                onClick={openSelectedShipModal}
                disabled={selectedIds.length === 0 || shipping}
                className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-50"
              >
                Ship
              </button>

              {/* Bulk Action */}
              <div className="relative" ref={bulkRef}>
                <button
                  onClick={() => setShowBulkDrop((p) => !p)}
                  disabled={selectedIds.length === 0 || shipping}
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
                    {["Ship"].map((a) => (
                      <button
                        key={a}
                        onClick={() => {
                          setShowBulkDrop(false);
                          if (a === "Ship") openSelectedShipModal();
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

            <button
              onClick={onCreateClick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              <Plus size={14} /> Create Outbound
            </button>
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
            error?.response?.data?.message ?? "Failed to load draft outbounds"
          }
          onRetry={() => {
            setPage(1);
            refetch?.();
          }}
        />

        {/* Pagination */}
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
            onExportCsv={() => exportRowsToCsv(buildOutboundOutputRows(outputItems), outboundOutputColumns, "draft-outbounds.csv", "outbound")}
            onExportXlsx={() => exportRowsToXlsx(buildOutboundOutputRows(outputItems), outboundOutputColumns, "draft-outbounds.xlsx", "outbound")}
          />
          <button
            onClick={() => printRows(buildOutboundOutputRows(outputItems), outboundOutputColumns, "Draft Outbounds", "outbound")}
            className="px-16 py-2.5 text-base font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors"
          >
            Print
          </button>
        </div>
      </div>

      {/* Delete confirm modal */}
      {showDeleteModal && actionTarget && (
        <ConfirmModal
          title="Delete Outbound Draft"
          message={
            <>
              Delete outbound draft{" "}
              <span className="font-semibold">{deleteTargetLabel}</span>?
              This action cannot be undone.
            </>
          }
          confirmLabel={deleting ? "Deleting..." : "Delete Draft"}
          confirmClass="bg-red-500 hover:bg-red-600 text-white"
          loading={deleting}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
        />
      )}

      {/* Ship modal */}
      {showShipModal && (
        <ShipModal
          target={shipTarget}
          form={shipForm}
          errors={shipErrors}
          onChange={handleShipFormChange}
          onConfirm={requestShipConfirmation}
          onCancel={() => setShowShipModal(false)}
          loading={shipping}
        />
      )}
      {showShipConfirmModal && (
        <ConfirmModal
          title="Confirm Ship Outbound"
          message="Are you sure you want to make this Outbound On The Way / shipped? After this, you cannot edit, delete, or undo it. Inventory and mapping quantities will be reduced immediately."
          confirmLabel={shipping ? "Shipping..." : "Confirm Ship Outbound"}
          loading={shipping}
          onCancel={() => setShowShipConfirmModal(false)}
          onConfirm={confirmShip}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Outbound sub-page
// ─────────────────────────────────────────────────────────────────────────────
function CreateOutboundPage({ onBack, initialOrder = null }) {
  const [showSkuModal, setShowSkuModal] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const {
    form,
    errors,
    handleFormChange,
    handleWarehouseSelect,
    lines,
    removeLine,
    updateLineQty,
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
  } = useCreateOutbound({ onSuccess: onBack, initialOrder });

  const { warehouseOptions, warehouses } = useOutboundDropdowns();
  const hasWarehouse = Boolean(form.warehouseId);

  const handleConfirmModal = () => {
    confirmSkuSelection();
    setShowSkuModal(false);
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar
        PageTitle={
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-primary-text hover:text-primary transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Draft
          </button>
        }
      />

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
                disabled={Boolean(initialOrder)}
                onChange={(e) => {
                  const opt = warehouseOptions.find((o) => o.value === e.target.value);
                  const warehouse = warehouses.find((item) => String(item.id) === e.target.value);
                  if (opt) {
                    handleWarehouseSelect({
                      id: opt.value,
                      name: opt.label,
                      location: warehouse?.location || "",
                    });
                  }
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
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Receiving Warehouse <span className="text-red-500">*</span>
            </p>
            <input
              name="receivingWarehouseName"
              value={form.receivingWarehouseName}
              onChange={handleFormChange}
              placeholder="Receiving warehouse"
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary ${errors.receivingWarehouseName ? "border-red-300" : "border-surface-border"}`}
            />
            {errors.receivingWarehouseName && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle size={10} /> {errors.receivingWarehouseName}
              </p>
            )}
          </div>
          <div className="col-span-2">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Receiving Warehouse Full Address <span className="text-red-500">*</span>
            </p>
            <input
              name="receivingWarehouseAddress"
              value={form.receivingWarehouseAddress}
              onChange={handleFormChange}
              placeholder="Full address"
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary ${errors.receivingWarehouseAddress ? "border-red-300" : "border-surface-border"}`}
            />
            {errors.receivingWarehouseAddress && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle size={10} /> {errors.receivingWarehouseAddress}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-600 mb-1.5">
            Outbound Notes
          </p>
          <input
            name="notes"
            value={form.notes}
            onChange={handleFormChange}
            placeholder="Outbound notes"
            className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
          />
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
            type="button"
            disabled={!hasWarehouse}
            onClick={() => {
              if (hasWarehouse) {
                setShowSkuModal(true);
              } else {
                toast.error("Please select the warehouse first");
              }
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:bg-slate-300"
          >
            <Plus size={14} /> Select Merchant SKU
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
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
                        max={item.qtyAvailable}
                        value={item.qtyExpected}
                        onChange={(e) => updateLineQty(item.id, e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value === "") updateLineQty(item.id, "1");
                        }}
                        className="w-16 px-2 py-1 text-xs border border-surface-border rounded-lg text-center outline-none focus:border-primary"
                      />
                      <p className="mt-0.5 text-[10px] text-slate-400">Max {item.qtyAvailable ?? "-"}</p>
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
          onClick={() => setShowSaveConfirm(true)}
          disabled={saving}
          className="px-7 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {initialOrder ? "Update" : "Save"}
        </button>
      </div>
      {showSaveConfirm && (
        <ConfirmModal
          title={initialOrder ? "Update Outbound Draft" : "Save Outbound Draft"}
          message="Are you sure you want to save this outbound draft? Inventory will not be reduced until you ship it."
          confirmLabel={saving ? "Saving..." : initialOrder ? "Update" : "Save"}
          loading={saving}
          onCancel={() => setShowSaveConfirm(false)}
          onConfirm={handleSave}
        />
      )}
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
  const targetCount = Array.isArray(target) ? target.length : target ? 1 : 0;
  const targetLabel =
    targetCount > 1
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
        className="bg-white rounded-2xl shadow-xl w-96 p-7"
        style={{ animation: "popIn 0.15s ease both" }}
      >
        <h3 className="text-base font-bold text-slate-800 font-display mb-1">
          Ship Outbound
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Confirm shipment details for{" "}
          <span className="font-semibold">{targetLabel}</span>
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
            {loading ? "Shipping..." : "Confirm Ship Outbound"}
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
