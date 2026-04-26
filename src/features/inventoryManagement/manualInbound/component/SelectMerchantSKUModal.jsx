// import { useState, useMemo } from "react";
// import { Search, ChevronDown, Trash2 } from "lucide-react";
// import { MOCK_MERCHANT_SKUS } from "../../shared/inventoryListMockData";

// // ─────────────────────────────────────────────────────────────────────────────
// // SelectMerchantSKUModal — Image 9
// // Two-panel: Select Merchant SKU (left) + Preview selection with qty (right)
// // ─────────────────────────────────────────────────────────────────────────────

// const INITIAL_PREVIEW = [1, 2, 3, 4, 5, 6]; // pre-selected matching Figma image 9

// export default function SelectMerchantSKUModal({ open, onClose, onConfirm }) {
//   const [skuType, setSkuType] = useState("SKU Name");
//   const [search, setSearch] = useState("");
//   const [selectedIds, setSelectedIds] = useState(INITIAL_PREVIEW);
//   const [quantities, setQuantities] = useState(
//     Object.fromEntries(INITIAL_PREVIEW.map((id) => [id, 1])),
//   );

//   const filteredSkus = useMemo(() => {
//     if (!search.trim()) return MOCK_MERCHANT_SKUS;
//     const q = search.toLowerCase();
//     return MOCK_MERCHANT_SKUS.filter(
//       (s) =>
//         s.name.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q),
//     );
//   }, [search]);

//   const previewItems = MOCK_MERCHANT_SKUS.filter((s) =>
//     selectedIds.includes(s.id),
//   );

//   const toggleSku = (id) => {
//     setSelectedIds((prev) => {
//       if (prev.includes(id)) return prev.filter((x) => x !== id);
//       setQuantities((q) => ({ ...q, [id]: 1 }));
//       return [...prev, id];
//     });
//   };

//   const updateQty = (id, val) => {
//     setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Number(val) || 1) }));
//   };

//   const removePreview = (id) => {
//     setSelectedIds((prev) => prev.filter((x) => x !== id));
//   };

//   const clearAll = () => {
//     setSelectedIds([]);
//     setQuantities({});
//   };

//   const handleConfirm = () => {
//     const selected = previewItems.map((s) => ({
//       ...s,
//       qty: quantities[s.id] ?? 1,
//     }));
//     onConfirm?.(selected);
//     onClose();
//   };

//   if (!open) return null;

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center p-4"
//       style={{
//         background: "rgba(180,195,210,0.55)",
//         backdropFilter: "blur(3px)",
//       }}
//       onClick={(e) => e.target === e.currentTarget && onClose()}
//     >
//       <div
//         className="bg-white rounded-2xl shadow-2xl w-full font-body overflow-hidden"
//         style={{ maxWidth: "1100px", animation: "popIn 0.18s ease both" }}
//       >
//         {/* ── Search bar at top ── */}
//         <div className="px-6 py-4 border-b border-surface-border flex items-center gap-3">
//           <div className="relative w-36">
//             <select
//               value={skuType}
//               onChange={(e) => setSkuType(e.target.value)}
//               className="w-full appearance-none pl-3 pr-7 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
//             >
//               {["SKU Name", "Product Name", "SKU Code"].map((t) => (
//                 <option key={t}>{t}</option>
//               ))}
//             </select>
//             <ChevronDown
//               size={12}
//               className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
//             />
//           </div>
//           <div className="relative flex-1 max-w-sm">
//             <Search
//               size={14}
//               className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//             />
//             <input
//               type="text"
//               placeholder="Search"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
//             />
//           </div>
//           <button className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
//             Search
//           </button>
//         </div>

//         {/* ── Two-panel body ── */}
//         <div
//           className="grid grid-cols-2 divide-x divide-surface-border"
//           style={{ maxHeight: "460px" }}
//         >
//           {/* Left — Select Merchant SKU */}
//           <div className="flex flex-col overflow-hidden">
//             <div className="px-6 py-3 border-b border-surface-border">
//               <h3 className="text-sm font-bold text-slate-800 font-display">
//                 Select Merchant SKU
//               </h3>
//             </div>
//             <div className="overflow-auto flex-1">
//               <table className="w-full text-sm">
//                 <thead className="sticky top-0 bg-white z-10">
//                   <tr className="border-b border-surface-border">
//                     {[
//                       "Select",
//                       "Image",
//                       "Product Name",
//                       "SKU",
//                       "Available in Inventory",
//                     ].map((h) => (
//                       <th
//                         key={h}
//                         className="py-2.5 pl-4 text-left text-xs font-semibold text-slate-600"
//                       >
//                         {h}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-surface-border">
//                   {filteredSkus.map((sku) => {
//                     const isChecked = selectedIds.includes(sku.id);
//                     return (
//                       <tr
//                         key={sku.id}
//                         onClick={() => toggleSku(sku.id)}
//                         className={`cursor-pointer transition-colors hover:bg-surface/50 ${isChecked ? "bg-blue-50/50" : ""}`}
//                       >
//                         <td className="py-2.5 pl-4">
//                           <input
//                             type="checkbox"
//                             checked={isChecked}
//                             onChange={() => {}}
//                             className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                           />
//                         </td>
//                         <td className="py-2.5 pl-4">
//                           <img
//                             src={sku.image}
//                             alt={sku.name}
//                             className="w-8 h-8 rounded-lg object-cover"
//                             onError={(e) => {
//                               e.target.src =
//                                 "https://placehold.co/32x32/E6ECF0/004368?text=?";
//                             }}
//                           />
//                         </td>
//                         <td className="py-2.5 pl-4 text-xs text-slate-700 max-w-36 truncate">
//                           {sku.name}
//                         </td>
//                         <td className="py-2.5 pl-4 text-xs font-mono text-slate-600">
//                           {sku.sku}
//                         </td>
//                         <td className="py-2.5 pl-4 text-xs text-slate-600">
//                           {sku.available} units
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Right — Preview selection */}
//           <div className="flex flex-col overflow-hidden">
//             <div className="px-6 py-3 border-b border-surface-border flex items-center justify-between">
//               <h3 className="text-sm font-bold text-slate-800 font-display">
//                 Preview selection
//               </h3>
//               <button
//                 onClick={clearAll}
//                 className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors"
//               >
//                 <Trash2 size={12} /> Clear all
//               </button>
//             </div>
//             <div className="overflow-auto flex-1">
//               {previewItems.length === 0 ? (
//                 <div className="flex items-center justify-center h-32 text-sm text-slate-400">
//                   No items selected
//                 </div>
//               ) : (
//                 <table className="w-full text-sm">
//                   <thead className="sticky top-0 bg-white z-10">
//                     <tr className="border-b border-surface-border">
//                       {["Image", "Product Name", "Quantity", "Action"].map(
//                         (h) => (
//                           <th
//                             key={h}
//                             className="py-2.5 pl-4 text-left text-xs font-semibold text-slate-600"
//                           >
//                             {h}
//                           </th>
//                         ),
//                       )}
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-surface-border">
//                     {previewItems.map((sku) => (
//                       <tr
//                         key={sku.id}
//                         className="hover:bg-surface/50 transition-colors"
//                       >
//                         <td className="py-2.5 pl-4">
//                           <img
//                             src={sku.image}
//                             alt={sku.name}
//                             className="w-8 h-8 rounded-lg object-cover"
//                             onError={(e) => {
//                               e.target.src =
//                                 "https://placehold.co/32x32/E6ECF0/004368?text=?";
//                             }}
//                           />
//                         </td>
//                         <td className="py-2.5 pl-4 text-xs text-slate-700 max-w-36 truncate">
//                           {sku.name}
//                         </td>
//                         <td className="py-2.5 pl-4">
//                           <input
//                             type="number"
//                             min={1}
//                             value={quantities[sku.id] ?? 1}
//                             onChange={(e) => updateQty(sku.id, e.target.value)}
//                             onClick={(e) => e.stopPropagation()}
//                             className="w-14 px-2 py-1 text-xs border border-surface-border rounded-lg text-center text-slate-700 outline-none focus:border-primary"
//                           />
//                         </td>
//                         <td className="py-2.5 pl-4">
//                           <button
//                             onClick={() => removePreview(sku.id)}
//                             className="text-slate-400 hover:text-red-500 transition-colors"
//                           >
//                             <Trash2 size={13} />
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* ── Footer ── */}
//         <div className="flex justify-end gap-3 px-8 py-5 border-t border-surface-border">
//           <button
//             onClick={onClose}
//             className="px-8 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleConfirm}
//             className="px-8 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors"
//           >
//             Confirm
//           </button>
//         </div>
//       </div>
//       <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.97) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
//     </div>
//   );
// }

import { useState } from "react";
import {
  Search,
  ChevronDown,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// SelectMerchantSKUModal
// Design matches Image 3 exactly — compact modal, two panels side by side
// All state comes from useManualInbound via parent
// ─────────────────────────────────────────────────────────────────────────────

const SKU_TYPES = ["SKU Name", "Product Name", "SKU Code"];

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
  const [showTypeDrop, setShowTypeDrop] = useState(false);

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(180,195,210,0.55)",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full font-body"
        style={{ maxWidth: "860px", animation: "popIn 0.18s ease both" }}
      >
        {/* ── Search bar ── */}
        <div className="px-5 py-3.5 border-b border-surface-border flex items-center gap-2.5">
          {/* SKU type — native select matching Image 3 */}
          <div className="relative">
            <select
              value={skuType}
              onChange={(e) => setSkuType(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-xs border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
            >
              {SKU_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <ChevronDown
              size={10}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Search input */}
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

        {/* ── Two-panel body ── */}
        <div className="grid grid-cols-2 divide-x divide-surface-border">
          {/* Left — Select Merchant SKU */}
          <div>
            <div className="px-5 py-2.5 border-b border-surface-border">
              <h3 className="text-xs font-semibold text-slate-800">
                Select Merchant SKU
              </h3>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "320px" }}>
              {pickerLoading ? (
                <div className="flex items-center justify-center h-28 gap-2 text-xs text-slate-400">
                  <Loader2 size={13} className="animate-spin text-primary" />{" "}
                  Loading SKUs...
                </div>
              ) : isPickerError ? (
                <div className="flex flex-col items-center justify-center h-28 gap-2">
                  <AlertCircle size={16} className="text-red-400" />
                  <p className="text-xs text-slate-400">Failed to load SKUs</p>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-surface-border">
                      <th className="py-2 pl-4 text-left font-medium text-slate-500">
                        Select
                      </th>
                      <th className="py-2 pl-3 text-left font-medium text-slate-500">
                        Image
                      </th>
                      <th className="py-2 pl-3 text-left font-medium text-slate-500">
                        Product Name
                      </th>
                      <th className="py-2 pl-3 text-left font-medium text-slate-500">
                        SKU
                      </th>
                      <th className="py-2 pl-3 pr-4 text-left font-medium text-slate-500 whitespace-nowrap">
                        Available in Inventory
                      </th>
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
                            className={`cursor-pointer transition-colors hover:bg-slate-50 ${isChecked ? "bg-blue-50/50" : ""}`}
                          >
                            <td className="py-2.5 pl-4">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 pl-3">
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
                              className="py-2.5 pl-3 text-slate-700 max-w-[110px] truncate"
                              title={sku.sku_title}
                            >
                              {sku.sku_title}
                            </td>
                            <td className="py-2.5 pl-3 font-mono text-slate-500">
                              {sku.sku_name}
                            </td>
                            <td className="py-2.5 pl-3 pr-4">
                              <span
                                className={`font-semibold ${available === 0 ? "text-red-500" : available < 50 ? "text-amber-500" : "text-emerald-600"}`}
                              >
                                {Number(available).toLocaleString()}
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

          {/* Right — Preview selection */}
          <div>
            <div className="px-5 py-2.5 border-b border-surface-border flex items-center justify-between">
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
            <div className="overflow-y-auto" style={{ maxHeight: "320px" }}>
              {pickerPreviewItems.length === 0 ? (
                <div className="flex items-center justify-center h-28 text-xs text-slate-400">
                  No items selected
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-surface-border">
                      <th className="py-2 pl-4 text-left font-medium text-slate-500">
                        Image
                      </th>
                      <th className="py-2 pl-3 text-left font-medium text-slate-500">
                        Product Name
                      </th>
                      <th className="py-2 pl-3 text-left font-medium text-slate-500">
                        Quantity
                      </th>
                      <th className="py-2 pl-3 pr-4 text-left font-medium text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {pickerPreviewItems.map((sku) => (
                      <tr
                        key={sku.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-2.5 pl-4">
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
                          className="py-2.5 pl-3 text-slate-700 max-w-[120px] truncate"
                          title={sku.sku_title}
                        >
                          {sku.sku_title}
                        </td>
                        <td className="py-2.5 pl-3">
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
                        <td className="py-2.5 pl-3 pr-4">
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

        {/* ── Footer ── */}
        <div className="flex justify-end gap-2.5 px-5 py-3.5 border-t border-surface-border">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={pickerPreviewItems.length === 0}
            className="px-6 py-2 text-xs font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-45"
          >
            Confirm
          </button>
        </div>
      </div>

      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.97) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
