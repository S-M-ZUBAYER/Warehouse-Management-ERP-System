import {
  ArrowLeft,
  ChevronDown,
  Search,
  Trash2,
  Loader2,
  AlertCircle,
  Warehouse,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAddCombineSKU } from "../hooks/useAddCombineSKU";
import ConfirmModal from "../../../components/shared/ConfirmModal";
import Topbar from "../../../components/layout/Topbar";

// ─────────────────────────────────────────────────────────────────────────────
// AddCombineSKUPage
// ─────────────────────────────────────────────────────────────────────────────

export default function AddCombineSKUPage() {
  const navigate = useNavigate();

  const {
    // SKU picker
    skuSearch,
    setSkuSearch,
    filteredSkus,
    pickerLoading,
    pickerFetching,
    isPickerError,

    // selection
    selectedIds,
    selectedSkus,
    quantities,
    toggleSku,
    updateQty,
    removeFromPreview,
    clearAll,
    allTableSelected,
    toggleAll,

    // warehouse
    warehouseSearch,
    setWarehouseSearch,
    warehouses,
    warehouseLoading,
    isWarehouseError,
    handleWarehouseSelect,

    // form
    form,
    errors,
    handleFormChange,

    // save
    showSaveModal,
    setShowSaveModal,
    saving,
    handleSaveClick,
    confirmSave,
  } = useAddCombineSKU();

  return (
    <div className="space-y-4 font-body">
      {/* ── Page Title ── */}
      <Topbar
        PageTitle={
          <span
            onClick={() =>
              navigate("/warehouse_management/products/combine_sku")
            }
            className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Combine SKU
          </span>
        }
      />

      {/* ── Top: Combine SKU Name + SKU Code + GTIN + Warehouse ── */}
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <div className="grid grid-cols-4 gap-4 max-w-6xl">
          {/* Combine SKU Name */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Combine SKU Name <span className="text-red-400">*</span>
            </p>
            <input
              type="text"
              name="combineSKUName"
              placeholder="SKU name here"
              value={form.combineSKUName}
              onChange={handleFormChange}
              disabled={saving}
              className={`w-full px-3 py-2 text-sm bg-white border rounded-lg text-slate-700
                placeholder-slate-400 outline-none transition-all disabled:opacity-60
                ${
                  errors.combineSKUName
                    ? "border-red-300 focus:border-red-400"
                    : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"
                }`}
            />
            {errors.combineSKUName && (
              <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.combineSKUName}
              </p>
            )}
          </div>

          {/* SKU Code */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              SKU Code <span className="text-red-400">*</span>
            </p>
            <input
              type="text"
              name="combineSkuCode"
              placeholder="e.g. CSKU-001"
              value={form.combineSkuCode}
              onChange={handleFormChange}
              disabled={saving}
              className={`w-full px-3 py-2 text-sm bg-white border rounded-lg text-slate-700
                placeholder-slate-400 outline-none transition-all disabled:opacity-60
                ${
                  errors.combineSkuCode
                    ? "border-red-300 focus:border-red-400"
                    : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"
                }`}
            />
            {errors.combineSkuCode && (
              <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.combineSkuCode}
              </p>
            )}
          </div>

          {/* GTIN */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              GTIN <span className="text-red-400">*</span>
            </p>
            <input
              type="text"
              name="gtin"
              placeholder="GTIN here"
              value={form.gtin}
              onChange={handleFormChange}
              disabled={saving}
              className={`w-full px-3 py-2 text-sm bg-white border rounded-lg text-slate-700
                placeholder-slate-400 outline-none transition-all disabled:opacity-60
                ${
                  errors.gtin
                    ? "border-red-300 focus:border-red-400"
                    : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"
                }`}
            />
            {errors.gtin && (
              <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.gtin}
              </p>
            )}
          </div>

          {/* Warehouse */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Warehouse <span className="text-red-400">*</span>
            </p>
            <div className="relative">
              {warehouseLoading ? (
                <div className="w-full px-3 py-2 text-xs border border-surface-border rounded-lg bg-white text-slate-400 flex items-center gap-2">
                  <Loader2 size={11} className="animate-spin text-primary" />
                  Loading warehouses...
                </div>
              ) : isWarehouseError ? (
                <p className="px-3 py-2 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={10} /> Failed to load warehouses
                </p>
              ) : (
                <>
                  <select
                    name="warehouseId"
                    value={form.warehouseId}
                    onChange={(e) => {
                      const selected = warehouses.find(
                        (wh) => String(wh.id) === e.target.value,
                      );
                      if (selected) handleWarehouseSelect(selected);
                      else
                        handleWarehouseSelect({ id: "", name: "", code: "" });
                    }}
                    disabled={saving}
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-lg text-slate-700
                      outline-none transition-all appearance-none cursor-pointer disabled:opacity-60
                      ${
                        errors.warehouseId
                          ? "border-red-300 focus:border-red-400"
                          : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"
                      }`}
                  >
                    <option value="">— Select a warehouse —</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={String(wh.id)}>
                        {wh.name}
                        {wh.code ? ` (${wh.code})` : ""}
                        {wh.is_default ? " ★ Default" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </>
              )}
            </div>

            {form.warehouseId && (
              <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {form.warehouseName}
              </p>
            )}
            {errors.warehouseId && (
              <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.warehouseId}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Middle Two Panels ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT PANEL — Add Combine SKU */}
        <div className="bg-white rounded-xl overflow-hidden border border-surface-border">
          {/* Header + search */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-slate-800 font-display">
                Add Combine SKU
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search"
                    value={skuSearch}
                    onChange={(e) => setSkuSearch(e.target.value)}
                    disabled={!form.warehouseId}
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-surface-border rounded-lg
                      text-slate-700 placeholder-slate-400 outline-none w-56
                      focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {pickerFetching && !pickerLoading && (
                    <Loader2
                      size={11}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary animate-spin"
                    />
                  )}
                </div>
                <button
                  disabled={!form.warehouseId}
                  className="px-4 py-1.5 text-xs font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Search
                </button>
              </div>
            </div>
            {errors.items && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.items}
              </p>
            )}
          </div>

          {/* SKU table */}
          <div className="overflow-auto max-h-[520px]">
            {/* ── Warehouse not selected guard ── */}
            {!form.warehouseId ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                  <Warehouse size={26} className="text-amber-400" />
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  Select a warehouse first
                </p>
                <p className="text-xs text-slate-400 text-center max-w-[220px]">
                  Merchant SKUs will load based on the selected warehouse above
                </p>
              </div>
            ) : pickerLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-slate-400 text-xs">
                <Loader2 size={16} className="animate-spin text-primary" />
                Loading SKUs...
              </div>
            ) : isPickerError ? (
              <div className="flex flex-col items-center py-12 gap-2 text-slate-400">
                <AlertCircle size={24} className="text-red-400" />
                <p className="text-xs">Failed to load SKUs</p>
              </div>
            ) : (
              <table className="w-full text-xs font-body">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-y-2 border-surface-border">
                    <th className="w-10 pl-4 pr-4 py-2.5 text-left">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={allTableSelected}
                          onChange={toggleAll}
                          className="w-3.5 h-3.5 rounded border-slate-300 accent-primary cursor-pointer"
                        />
                        <span className="font-semibold text-primary-text text-base tracking-wide">
                          Select
                        </span>
                      </div>
                    </th>
                    <th className="w-12 py-2.5 pr-6 text-left">
                      <span className="font-semibold text-primary-text text-base">
                        Image
                      </span>
                    </th>
                    <th className="py-2.5 text-left">
                      <span className="font-semibold text-primary-text text-base">
                        Bundle SKU Name
                      </span>
                    </th>
                    <th className="w-20 py-2.5 text-left">
                      <span className="font-semibold text-primary-text text-base">
                        SKU
                      </span>
                    </th>
                    <th className="w-36 py-2.5 pr-1 text-left">
                      <span className="font-semibold text-primary-text text-base">
                        Available
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSkus.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-xs text-slate-400"
                      >
                        No SKUs found
                      </td>
                    </tr>
                  ) : (
                    filteredSkus.map((sku) => {
                      const isChecked = selectedIds.includes(sku.id);
                      const available = sku.available_in_inventory ?? 0;
                      return (
                        <tr
                          key={sku.id}
                          onClick={() => toggleSku(sku.id)}
                          className={`cursor-pointer border-b border-surface-border transition-colors hover:bg-surface/70 ${
                            isChecked ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <td className="pl-4 py-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 rounded border-slate-300 accent-primary cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <img
                              src={
                                sku.image_url ||
                                `https://placehold.co/32x32/E6ECF0/004368?text=${sku.sku_name?.[0] ?? "?"}`
                              }
                              alt={sku.sku_title}
                              className="w-8 h-8 rounded-lg object-cover border border-surface-border"
                              onError={(e) => {
                                e.target.src =
                                  "https://placehold.co/32x32/E6ECF0/004368?text=?";
                              }}
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <p
                              className="text-slate-700 truncate max-w-[160px] font-medium"
                              title={sku.sku_title}
                            >
                              {sku.sku_title}
                            </p>
                          </td>
                          <td className="py-2.5 pr-2">
                            <span className="text-xs font-mono text-slate-500">
                              {sku.sku_name}
                            </span>
                          </td>
                          <td className="py-2.5 pr-2">
                            <span
                              className={`font-semibold text-xs ${
                                available === 0
                                  ? "text-red-500"
                                  : available < 50
                                    ? "text-amber-500"
                                    : "text-emerald-600"
                              }`}
                            >
                              {available.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Preview selection */}
        <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-surface-border flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800 font-display">
              Preview selection
              {selectedSkus.length > 0 && (
                <span className="ml-2 text-sm font-semibold text-primary">
                  ({selectedSkus.length})
                </span>
              )}
            </h3>
            {selectedSkus.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="overflow-auto max-h-[520px]">
            {selectedSkus.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-xs text-slate-400">
                No SKUs selected — pick from the left panel
              </div>
            ) : (
              <table className="w-full text-xs font-body">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-y-2 border-surface-border">
                    <th className="w-12 pl-4 py-2.5 pr-4 text-left">
                      <span className="font-semibold text-primary-text text-base">
                        Image
                      </span>
                    </th>
                    <th className="py-2.5 text-left pr-3">
                      <span className="font-semibold text-primary-text text-base">
                        Bundle SKU Name
                      </span>
                    </th>
                    <th className="w-20 py-2.5 text-left pr-3">
                      <span className="font-semibold text-primary-text text-base">
                        Quantity
                      </span>
                    </th>
                    <th className="w-10 py-2.5 text-left pr-3">
                      <span className="font-semibold text-primary-text text-base">
                        Action
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSkus.map((sku) => (
                    <tr
                      key={sku.id}
                      className="border-b border-surface-border hover:bg-surface/50 transition-colors"
                    >
                      <td className="pl-4 py-2.5">
                        <img
                          src={
                            sku.image_url ||
                            `https://placehold.co/32x32/E6ECF0/004368?text=?`
                          }
                          alt={sku.sku_title}
                          className="w-8 h-8 rounded-lg object-cover border border-surface-border"
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/32x32/E6ECF0/004368?text=?";
                          }}
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <p
                          className="text-slate-700 truncate max-w-[160px]"
                          title={sku.sku_title}
                        >
                          {sku.sku_title}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {sku.sku_name}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="number"
                          min={1}
                          value={quantities[sku.id] ?? 1}
                          onChange={(e) => updateQty(sku.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={saving}
                          className="w-14 px-2 py-1 text-xs border border-surface-border rounded-lg text-slate-700 outline-none text-center focus:border-primary focus:ring-1 focus:ring-primary/10 disabled:opacity-60"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <button
                          onClick={() => removeFromPreview(sku.id)}
                          disabled={saving}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom: Weight + Size ── */}
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <div className="grid grid-cols-5 gap-3">
          {/* Weight */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Weight (kg)
            </p>
            <input
              type="text"
              name="weight"
              placeholder="Product weight here"
              value={form.weight}
              onChange={handleFormChange}
              disabled={saving}
              className="w-full px-3 py-2 text-sm bg-white border border-surface-border rounded-lg
                text-slate-700 placeholder-slate-400 outline-none disabled:opacity-60
                focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Size */}
          <div className="col-span-2">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Size (cm)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["length", "Length"],
                ["width", "Width"],
                ["height", "Height"],
              ].map(([name, ph]) => (
                <input
                  key={name}
                  type="text"
                  name={name}
                  placeholder={ph}
                  value={form[name]}
                  onChange={handleFormChange}
                  disabled={saving}
                  className="w-full px-3 py-2 text-sm bg-white border border-surface-border rounded-lg
                    text-slate-700 placeholder-slate-400 outline-none disabled:opacity-60
                    focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer: Cancel + Save ── */}
      <div className="flex justify-end gap-3 pt-1">
        <button
          onClick={() => navigate("/warehouse_management/products/combine_sku")}
          disabled={saving}
          className="px-16 py-2.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveClick}
          disabled={saving}
          className="px-16 py-2.5 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save
        </button>
      </div>

      {/* ── Save Confirmation Modal ── */}
      <ConfirmModal
        isOpen={showSaveModal}
        title="Are you sure you want to save?"
        message="This will create the Combine SKU with all selected items and quantities."
        confirmLabel={saving ? "Saving..." : "Save"}
        cancelLabel="Cancel"
        loading={saving}
        onConfirm={confirmSave}
        onCancel={() => setShowSaveModal(false)}
      />
    </div>
  );
}
