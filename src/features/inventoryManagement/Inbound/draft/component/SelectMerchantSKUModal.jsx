import { Search, ChevronDown, Trash2, Loader2, AlertCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// SelectMerchantSKUModal — two-panel SKU picker
// All state and API calls come from the parent via useCreateInbound hook
// ─────────────────────────────────────────────────────────────────────────────

export default function SelectMerchantSKUModal({
  open,
  onClose,
  onConfirm,
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
}) {
  const [skuType, setSkuType] = useState("SKU Name");
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(180,195,210,0.45)",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full flex flex-col overflow-hidden"
        style={{ maxWidth: "1060px", animation: "popIn 0.18s ease both" }}
      >
        {/* Search bar */}
        <div className="px-5 py-3.5 border-b border-surface-border flex items-center gap-2.5 flex-shrink-0">
          <div className="relative w-32">
            <select
              value={skuType}
              onChange={(e) => setSkuType(e.target.value)}
              className="w-full appearance-none pl-2.5 pr-6 py-1.5 text-xs border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
            >
              {["SKU Name", "Product Name", "SKU Code"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <ChevronDown
              size={10}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search"
              value={skuSearch}
              onChange={(e) => setSkuSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            {pickerFetching && !pickerLoading && (
              <Loader2
                size={11}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary animate-spin"
              />
            )}
          </div>
          <button className="px-5 py-1.5 text-xs font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
            Search
          </button>
        </div>

        {/* Two-panel body — KEY: flex+overflow-hidden on parent, overflow-y-auto on each panel's scroll area */}
        <div className="grid grid-cols-2 divide-x divide-surface-border min-h-0 flex-1">
          {/* Left panel */}
          <div className="flex flex-col min-h-0">
            <div className="px-5 py-2.5 border-b border-surface-border flex-shrink-0">
              <h3 className="text-xs font-semibold text-slate-800">
                Select Merchant SKU
              </h3>
            </div>
            {/* Scroll container — max-height triggers scroll when list overflows */}
            <div className="overflow-y-auto" style={{ maxHeight: "340px" }}>
              {pickerLoading ? (
                <div className="flex items-center justify-center h-32 gap-2 text-xs text-slate-400">
                  <Loader2 size={13} className="animate-spin text-primary" />{" "}
                  Loading SKUs...
                </div>
              ) : isPickerError ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <AlertCircle size={18} className="text-red-400" />
                  <p className="text-xs text-slate-400">Failed to load SKUs</p>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-surface-border">
                      {[
                        "Select",
                        "Image",
                        "Product Name",
                        "SKU",
                        "Available in Inventory",
                      ].map((h) => (
                        <th
                          key={h}
                          className="py-2 pl-4 text-left font-medium text-slate-500 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {pickerSkus.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-10 text-center text-slate-400"
                        >
                          No SKUs found
                        </td>
                      </tr>
                    ) : (
                      pickerSkus.map((sku) => {
                        const isChecked = selectedIds.includes(sku.id);
                        const available =
                          sku.available_in_inventory ?? sku.qty_on_hand ?? 0;
                        return (
                          <tr
                            key={sku.id}
                            onClick={() => toggleSku(sku.id)}
                            className={`cursor-pointer transition-colors hover:bg-slate-50 ${isChecked ? "bg-blue-50/60" : ""}`}
                          >
                            <td className="py-2 pl-4">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                              />
                            </td>
                            <td className="py-2 pl-4">
                              <img
                                src={
                                  sku.image_url ||
                                  "https://placehold.co/28x28/E6ECF0/004368?text=?"
                                }
                                alt={sku.sku_title}
                                className="w-7 h-7 rounded-md object-cover"
                                onError={(e) => {
                                  e.target.src =
                                    "https://placehold.co/28x28/E6ECF0/004368?text=?";
                                }}
                              />
                            </td>
                            <td
                              className="py-2 pl-4 text-slate-700 max-w-[130px] truncate"
                              title={sku.sku_title}
                            >
                              {sku.sku_title}
                            </td>
                            <td className="py-2 pl-4 font-mono text-slate-500">
                              {sku.sku_name}
                            </td>
                            <td className="py-2 pl-4">
                              <span
                                className={`font-semibold ${available === 0 ? "text-red-500" : available < 50 ? "text-amber-500" : "text-emerald-600"}`}
                              >
                                {available.toLocaleString()}
                              </span>
                              <span className="text-slate-400 ml-1">units</span>
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

          {/* Right panel */}
          <div className="flex flex-col min-h-0">
            <div className="px-5 py-2.5 border-b border-surface-border flex items-center justify-between flex-shrink-0">
              <h3 className="text-xs font-semibold text-slate-800">
                Preview selection
              </h3>
              <button
                onClick={clearPickerAll}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={11} /> Clear all
              </button>
            </div>
            {/* Scroll container — same max-height so both panels scroll at the same threshold */}
            <div className="overflow-y-auto" style={{ maxHeight: "340px" }}>
              {pickerPreviewItems.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-xs text-slate-400">
                  No items selected
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-surface-border">
                      {["Image", "Product Name", "Quantity", "Action"].map(
                        (h) => (
                          <th
                            key={h}
                            className="py-2 pl-4 text-left font-medium text-slate-500"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {pickerPreviewItems.map((sku) => (
                      <tr
                        key={sku.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-2 pl-4">
                          <img
                            src={
                              sku.image_url ||
                              "https://placehold.co/28x28/E6ECF0/004368?text=?"
                            }
                            alt={sku.sku_title}
                            className="w-7 h-7 rounded-md object-cover"
                            onError={(e) => {
                              e.target.src =
                                "https://placehold.co/28x28/E6ECF0/004368?text=?";
                            }}
                          />
                        </td>
                        <td
                          className="py-2 pl-4 text-slate-700 max-w-[140px] truncate"
                          title={sku.sku_title}
                        >
                          {sku.sku_title}
                        </td>
                        <td className="py-2 pl-4">
                          <input
                            type="number"
                            min={1}
                            value={quantities[sku.id] ?? 1}
                            onChange={(e) =>
                              updatePickerQty(sku.id, e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-12 px-1.5 py-1 text-xs border border-surface-border rounded-md text-center text-slate-700 outline-none focus:border-primary"
                          />
                        </td>
                        <td className="py-2 pl-4">
                          <button
                            onClick={() => removeFromPicker(sku.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} />
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

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-surface-border flex-shrink-0">
          <button
            onClick={onClose}
            className="px-7 py-2 text-xs font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            disabled={pickerPreviewItems.length === 0}
            className="px-7 py-2 text-xs font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-45"
          >
            Confirm
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.97) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

import { useState } from "react";
