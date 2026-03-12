import { ArrowLeft, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAddCombineSKU } from "../hooks/useAddCombineSKU";
import ConfirmModal from "../../../components/shared/ConfirmModal";
import Topbar from "../../../components/layout/Topbar";

// ─────────────────────────────────────────────────────────────────────────────
// AddCombineSKUPage — Matches Figma Image 3 exactly:
//   • "← Back to Combine SKU" header (replaces Topbar title on this page)
//   • Top fields: Combine SKU Name | GTIN
//   • Middle two panels side by side:
//       Left  — "Add Combine SKU" (dashed blue border) — searchable SKU table
//       Right — "Preview selection" + Clear all — shows selected with qty inputs
//   • Bottom: Weight | Size (L/W/H) | Select Warehouse
//   • Footer: Cancel | Save
//   • Image 4 popup: "Are you sure you want to save?" modal
// ─────────────────────────────────────────────────────────────────────────────

export default function AddCombineSKUPage() {
  const navigate = useNavigate();

  const {
    skuSearch,
    setSkuSearch,
    filteredSkus,
    selectedIds,
    selectedSkus,
    quantities,
    toggleSku,
    updateQty,
    removeFromPreview,
    clearAll,
    form,
    handleFormChange,
    showSaveModal,
    setShowSaveModal,
    saving,
    handleSaveClick,
    confirmSave,
    allTableSelected,
    toggleAll,
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
            className="flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={18} />
            Back to Combine SKU
          </span>
        }
      />
      {/* ── Top: Combine SKU Name + GTIN ── */}
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <div className="grid grid-cols-2 gap-4 max-w-xl">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Combine SKU Name
            </p>
            <input
              type="text"
              name="combineSKUName"
              placeholder="SKU name here"
              value={form.combineSKUName}
              onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm bg-white border border-surface-border rounded-lg
                         text-slate-700 placeholder-slate-400 outline-none
                         focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">GTIN</p>
            <input
              type="text"
              name="gtin"
              placeholder="GTIN here"
              value={form.gtin}
              onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm bg-white border border-surface-border rounded-lg
                         text-slate-700 placeholder-slate-400 outline-none
                         focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Middle Two Panels ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT PANEL — Add Combine SKU (dashed blue border) */}
        <div className="bg-white rounded-xl overflow-hidden">
          {/* Panel header + search */}
          <div className="px-4 pt-4 pb-3 ">
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
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-surface-border rounded-lg
                               text-slate-700 placeholder-slate-400 outline-none w-72
                               focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                  />
                </div>
                <button
                  className="px-4 py-1.5 text-xs font-semibold bg-primary hover:bg-primary-dark
                             text-white rounded-lg transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* SKU selection table */}
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full text-xs font-body">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="">
                  {/* <th className="w-10 pl-4 pr-8 py-2.5 text-left">
                    <th
                      type="checkbox"
                      checked={allTableSelected}
                      onChange={toggleAll}
                      className="w-3.5 h-3.5 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                  </th> */}
                  <th
                    onChange={toggleAll}
                    onClick={allTableSelected}
                    className="w-10 pl-4 pr-8 py-2.5 text-left"
                  >
                    <span className="font-semibold text-primary-text text-base tracking-wide">
                      Select
                    </span>
                  </th>
                  <th className="w-12 py-2.5 text-left">
                    <span className="font-semibold text-primary-text text-base tracking-wide">
                      Image
                    </span>
                  </th>
                  <th className="py-2.5 text-left">
                    <span className="font-semibold text-primary-text text-base tracking-wide">
                      Bundle SKU Name
                    </span>
                  </th>
                  <th className="w-20 py-2.5 text-left">
                    <span className="font-semibold text-primary-text text-base tracking-wide">
                      SKU
                    </span>
                  </th>
                  <th className="w-48 py-2.5 pr-1 text-left">
                    <span className="font-semibold text-primary-text text-base tracking-wide">
                      Available in Inventory
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="">
                {filteredSkus.map((sku) => {
                  const isChecked = selectedIds.includes(sku.id);
                  return (
                    <tr
                      key={sku.id}
                      onClick={() => toggleSku(sku.id)}
                      className={`cursor-pointer transition-colors hover:bg-surface/70
                        ${isChecked ? "bg-blue-50/50" : ""}`}
                    >
                      <td className="pl-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded border-slate-300 accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5">
                        <img
                          src={sku.image}
                          alt={sku.name}
                          className="w-8 h-8 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/32x32/E6ECF0/004368?text=?";
                          }}
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="text-slate-700">{sku.name}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="font-medium text-slate-700">
                          {sku.sku}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-slate-600">
                          {sku.availableInventory} units
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT PANEL — Preview selection */}
        <div className="bg-white rounded-xl border  border-surface-border overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-4 ">
            <h3 className="text-xl font-bold text-primary-text font-display">
              Preview selection
            </h3>
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-base font-semibold text-slate-500
                         hover:text-red-500 transition-colors"
            >
              <Trash2 size={12} />
              Clear all
            </button>
          </div>

          {/* Preview table */}
          <div className="overflow-auto max-h-[600px]">
            {selectedSkus.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-xs text-slate-400">
                No SKUs selected
              </div>
            ) : (
              <table className="w-full text-xs font-body">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="">
                    <th className="w-12 pl-4 py-2.5 text-left">
                      <span className="font-semibold text-primary-text text-base tracking-wide">
                        Image
                      </span>
                    </th>
                    <th className="py-2.5 text-left pr-3">
                      <span className="font-semibold text-primary-text text-base tracking-wide">
                        Bundle SKU Name
                      </span>
                    </th>
                    <th className="w-20 py-2.5 text-left pr-3">
                      <span className="font-semibold text-primary-text text-base tracking-wide">
                        Quantity
                      </span>
                    </th>
                    <th className="w-10 py-2.5 text-left pr-3">
                      <span className="font-semibold text-primary-text text-base tracking-wide">
                        Action
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="">
                  {selectedSkus.map((sku) => (
                    <tr
                      key={sku.id}
                      className="hover:bg-surface/50 transition-colors"
                    >
                      <td className="pl-4 py-2.5">
                        <img
                          src={sku.image}
                          alt={sku.name}
                          className="w-8 h-8 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/32x32/E6ECF0/004368?text=?";
                          }}
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="text-slate-700">{sku.name}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="number"
                          min={1}
                          value={quantities[sku.id] ?? 1}
                          onChange={(e) => updateQty(sku.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-14 px-2 py-1 text-xs border border-surface-border rounded-lg
                                     text-slate-700 outline-none text-center
                                     focus:border-primary focus:ring-1 focus:ring-primary/10"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <button
                          onClick={() => removeFromPreview(sku.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
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

      {/* ── Bottom: Weight + Size + Warehouse ── */}
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <div className="grid grid-cols-5 gap-3">
          {/* Weight */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Weight
            </p>
            <input
              type="text"
              name="weight"
              placeholder="Product weight here"
              value={form.weight}
              onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm bg-white border border-surface-border rounded-lg
                         text-slate-700 placeholder-slate-400 outline-none
                         focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Size — 3 fields */}
          <div className="col-span-2">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Size</p>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                name="length"
                placeholder="Length"
                value={form.length}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm bg-white border border-surface-border rounded-lg
                           text-slate-700 placeholder-slate-400 outline-none
                           focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <input
                type="text"
                name="width"
                placeholder="Width"
                value={form.width}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm bg-white border border-surface-border rounded-lg
                           text-slate-700 placeholder-slate-400 outline-none
                           focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <input
                type="text"
                name="height"
                placeholder="Height"
                value={form.height}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm bg-white border border-surface-border rounded-lg
                           text-slate-700 placeholder-slate-400 outline-none
                           focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          {/* Select Warehouse */}
          <div className="col-span-2">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Warehouse
            </p>
            <input
              type="text"
              name="warehouse"
              placeholder="Warehouse name here"
              value={form.warehouse}
              onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm bg-white border border-surface-border rounded-lg
                         text-slate-700 placeholder-slate-400 outline-none
                         focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Footer: Cancel + Save ── */}
      <div className="flex justify-end gap-3 pt-1">
        <button
          onClick={() => navigate("/warehouse_management/products/combine_sku")}
          className="px-6 py-2.5 text-sm font-semibold border border-surface-border
                     rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveClick}
          className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary
                     hover:bg-primary-dark text-white transition-colors"
        >
          Save
        </button>
      </div>

      {/* ── Save Confirmation Modal (Image 4) ── */}
      <ConfirmModal
        isOpen={showSaveModal}
        title="Are you sure you want to save?"
        message="This will save all the changes you've made so far."
        confirmLabel="Save"
        cancelLabel="Cancel"
        loading={saving}
        onConfirm={confirmSave}
        onCancel={() => setShowSaveModal(false)}
      />
    </div>
  );
}
