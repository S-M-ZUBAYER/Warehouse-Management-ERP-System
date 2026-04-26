// import { useState, useRef, useEffect, useMemo } from "react";
// import { Search, ChevronDown, Plus, Calendar, Trash2 } from "lucide-react";
// import Topbar from "../../../components/layout/Topbar";
// import {
//   MOCK_MANUAL_INBOUND,
//   WAREHOUSES,
//   TIME_OPTS,
//   INBOUND_OPTS,
// } from "../shared/inventoryListMockData";
// import SelectMerchantSKUModal from "./component/SelectMerchantSKUModal";

// // ─────────────────────────────────────────────────────────────────────────────
// // ManualInboundPage — Images 6, 7, 8, 9
// //
// // Image 6: Manual Inbound List — filter bar + table (Inbound ID / Image / Product Name / Warehouse / Details / Actions)
// // Image 7: Dropdown filters open — Select Time + Inbound No. dropdowns
// // Image 8: Create Manual Inbound page — *Select Warehouse + Manual Inbound List table + Select Merchant SKU btn
// // Image 9: Select Merchant SKU modal — two-panel with qty inputs
// // ─────────────────────────────────────────────────────────────────────────────

// export default function ManualInboundPage() {
//   const [showCreatePage, setShowCreatePage] = useState(false);

//   if (showCreatePage) {
//     return <CreateManualInboundPage onBack={() => setShowCreatePage(false)} />;
//   }

//   return <ManualInboundList onCreateClick={() => setShowCreatePage(true)} />;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Sub-component: List page (Images 6 & 7)
// // ─────────────────────────────────────────────────────────────────────────────
// function ManualInboundList({ onCreateClick }) {
//   const [warehouse, setWarehouse] = useState("Warehouse name here");
//   const [timeFilter, setTimeFilter] = useState("All");
//   const [inboundNo, setInboundNo] = useState("Inbound No.");
//   const [search, setSearch] = useState("");
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [expandedId, setExpandedId] = useState(null);
//   const [openActionId, setOpenActionId] = useState(null);

//   // Dropdown open states (Image 7)
//   const [showTimeDrop, setShowTimeDrop] = useState(false);
//   const [showInboundDrop, setShowInboundDrop] = useState(false);
//   const timeRef = useRef(null);
//   const inboundRef = useRef(null);
//   const actionRefs = useRef({});

//   useEffect(() => {
//     const handler = (e) => {
//       if (timeRef.current && !timeRef.current.contains(e.target))
//         setShowTimeDrop(false);
//       if (inboundRef.current && !inboundRef.current.contains(e.target))
//         setShowInboundDrop(false);
//       if (openActionId !== null) {
//         const ref = actionRefs.current[openActionId];
//         if (ref && !ref.contains(e.target)) setOpenActionId(null);
//       }
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, [openActionId]);

//   const filtered = useMemo(() => {
//     if (!search.trim()) return MOCK_MANUAL_INBOUND;
//     const q = search.toLowerCase();
//     return MOCK_MANUAL_INBOUND.filter(
//       (m) =>
//         m.inboundId.toLowerCase().includes(q) ||
//         m.productName.toLowerCase().includes(q),
//     );
//   }, [search]);

//   const toggleSelect = (id) =>
//     setSelectedIds((p) =>
//       p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
//     );

//   return (
//     <div className="space-y-4 font-body">
//       <Topbar PageTitle="Manual Inbound" />

//       {/* ── Filter Bar ── */}
//       <div className="bg-white rounded-xl border border-surface-border p-4">
//         <div className="flex items-center gap-2.5 flex-wrap">
//           {/* Select Warehouse */}
//           <div className="flex-1 min-w-40">
//             <p className="text-xs font-semibold text-slate-600 mb-1.5">
//               Select Warehouse
//             </p>
//             <div className="relative">
//               <select
//                 value={warehouse}
//                 onChange={(e) => setWarehouse(e.target.value)}
//                 className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
//               >
//                 {WAREHOUSES.map((w) => (
//                   <option key={w}>{w}</option>
//                 ))}
//               </select>
//               <ChevronDown
//                 size={13}
//                 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
//               />
//             </div>
//           </div>

//           {/* Select Time dropdown (Image 7) */}
//           <div className="w-28 relative" ref={timeRef}>
//             <p className="text-xs font-semibold text-slate-600 mb-1.5">
//               Select Time
//             </p>
//             <button
//               onClick={() => setShowTimeDrop((p) => !p)}
//               className="w-full flex items-center justify-between pl-3 pr-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 hover:border-primary/40 transition-colors"
//             >
//               <span>{timeFilter}</span>
//               <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />
//             </button>
//             {showTimeDrop && (
//               <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 min-w-full w-36">
//                 {TIME_OPTS.map((t) => (
//                   <button
//                     key={t}
//                     onClick={() => {
//                       setTimeFilter(t);
//                       setShowTimeDrop(false);
//                     }}
//                     className={`w-full text-left px-4 py-2 text-sm transition-colors ${timeFilter === t ? "text-primary font-semibold bg-blue-50" : "text-slate-700 hover:bg-surface-card"}`}
//                   >
//                     {t}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Date range */}
//           <div className="mt-5">
//             <button className="flex items-center gap-2 px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-500 hover:border-primary/40 transition-colors whitespace-nowrap">
//               <Calendar size={13} className="text-slate-400" />
//               01 Oct 2025 - 31 Oct 2025
//               <ChevronDown size={12} className="text-slate-400" />
//             </button>
//           </div>

//           {/* Inbound No. dropdown (Image 7) */}
//           <div className="w-32 relative mt-5" ref={inboundRef}>
//             <button
//               onClick={() => setShowInboundDrop((p) => !p)}
//               className="w-full flex items-center justify-between pl-3 pr-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 hover:border-primary/40 transition-colors"
//             >
//               <span>{inboundNo}</span>
//               <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />
//             </button>
//             {showInboundDrop && (
//               <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 min-w-full">
//                 {INBOUND_OPTS.map((opt) => (
//                   <button
//                     key={opt}
//                     onClick={() => {
//                       setInboundNo(opt);
//                       setShowInboundDrop(false);
//                     }}
//                     className={`w-full text-left px-4 py-2 text-sm transition-colors ${inboundNo === opt ? "text-primary font-semibold bg-blue-50" : "text-slate-700 hover:bg-surface-card"}`}
//                   >
//                     {opt}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Search */}
//           <div className="flex-1 min-w-32 relative mt-5">
//             <Search
//               size={14}
//               className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//             />
//             <input
//               type="text"
//               placeholder="Search"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
//             />
//           </div>

//           <button className="mt-5 px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
//             Search
//           </button>
//         </div>
//       </div>

//       {/* ── Manual Inbound List Card ── */}
//       <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
//         <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
//           <h2 className="text-base font-bold text-slate-800 font-display">
//             Manual Inbound List
//           </h2>
//           <button
//             onClick={onCreateClick}
//             className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
//           >
//             <Plus size={14} />
//             Create Manual Inbound
//           </button>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full text-sm font-body">
//             <thead>
//               <tr className="border-b border-surface-border">
//                 <th className="py-3 pl-5 w-32 text-left">
//                   <label className="flex items-center gap-2 cursor-pointer select-none">
//                     <input
//                       type="checkbox"
//                       checked={
//                         filtered.length > 0 &&
//                         filtered.every((p) => selectedIds.includes(p.id))
//                       }
//                       onChange={() => {
//                         const ids = filtered.map((m) => m.id);
//                         setSelectedIds(
//                           ids.every((id) => selectedIds.includes(id))
//                             ? []
//                             : ids,
//                         );
//                       }}
//                       className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                     />
//                     <span className="text-sm font-semibold text-slate-700 tracking-wide">
//                       Select All
//                     </span>
//                   </label>
//                 </th>
//                 {[
//                   "Inbound ID",
//                   "Image",
//                   "Product Name",
//                   "Warehouse Name",
//                   "Details",
//                   "Actions",
//                 ].map((h) => (
//                   <th
//                     key={h}
//                     className="py-3 pr-4 text-left text-sm font-semibold text-slate-700"
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-surface-border">
//               {filtered.map((item) => (
//                 <>
//                   <tr
//                     key={item.id}
//                     className={`hover:bg-surface/50 transition-colors ${selectedIds.includes(item.id) ? "bg-blue-50/40" : ""}`}
//                   >
//                     <td className="pl-5 py-3">
//                       <input
//                         type="checkbox"
//                         checked={selectedIds.includes(item.id)}
//                         onChange={() => toggleSelect(item.id)}
//                         className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                       />
//                     </td>
//                     <td className="py-3 pr-4 font-mono text-xs text-slate-700">
//                       {item.inboundId}
//                     </td>
//                     <td className="py-3 pr-4">
//                       <img
//                         src={item.image}
//                         alt={item.inboundId}
//                         className="w-9 h-9 rounded-lg object-cover"
//                         onError={(e) => {
//                           e.target.src =
//                             "https://placehold.co/36x36/E6ECF0/004368?text=?";
//                         }}
//                       />
//                     </td>
//                     <td className="py-3 pr-4 text-slate-700">
//                       {item.productName}
//                     </td>
//                     <td className="py-3 pr-4 text-slate-700">
//                       {item.warehouseName}
//                     </td>
//                     <td className="py-3 pr-4">
//                       <button
//                         onClick={() =>
//                           setExpandedId(expandedId === item.id ? null : item.id)
//                         }
//                         className="text-slate-400 hover:text-slate-600 transition-colors"
//                       >
//                         <ChevronDown
//                           size={16}
//                           className={`transition-transform ${expandedId === item.id ? "rotate-180" : ""}`}
//                         />
//                       </button>
//                     </td>
//                     <td className="py-3 pr-5">
//                       <div
//                         className="relative"
//                         ref={(el) => (actionRefs.current[item.id] = el)}
//                       >
//                         <button
//                           onClick={() =>
//                             setOpenActionId(
//                               openActionId === item.id ? null : item.id,
//                             )
//                           }
//                           className="flex items-center gap-0.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-surface-card transition-colors"
//                         >
//                           {[1, 2, 3].map((d) => (
//                             <span
//                               key={d}
//                               className="w-1 h-1 rounded-full bg-current mx-px"
//                             />
//                           ))}
//                         </button>
//                         {openActionId === item.id && (
//                           <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-28">
//                             {["Edit", "Delete"].map((a) => (
//                               <button
//                                 key={a}
//                                 onClick={() => setOpenActionId(null)}
//                                 className={`w-full text-left px-4 py-2 text-xs transition-colors ${a === "Delete" ? "text-red-500 hover:bg-red-50" : "text-slate-700 hover:bg-surface-card"}`}
//                               >
//                                 {a}
//                               </button>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                   {expandedId === item.id && (
//                     <tr className="bg-surface/50">
//                       <td colSpan={8} className="px-8 py-3">
//                         <div className="grid grid-cols-3 gap-4 text-xs">
//                           <div>
//                             <p className="text-slate-400 mb-0.5">Inbound ID</p>
//                             <p className="font-semibold text-slate-700">
//                               {item.inboundId}
//                             </p>
//                           </div>
//                           <div>
//                             <p className="text-slate-400 mb-0.5">Warehouse</p>
//                             <p className="font-semibold text-slate-700">
//                               {item.warehouseName}
//                             </p>
//                           </div>
//                           <div>
//                             <p className="text-slate-400 mb-0.5">Status</p>
//                             <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
//                               Completed
//                             </span>
//                           </div>
//                         </div>
//                       </td>
//                     </tr>
//                   )}
//                 </>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
//           <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
//             Export <ChevronDown size={13} className="text-slate-400" />
//           </button>
//           <button className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">
//             Print
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Sub-component: Create Manual Inbound page (Image 8 + 9)
// // ─────────────────────────────────────────────────────────────────────────────
// function CreateManualInboundPage({ onBack }) {
//   const [warehouse, setWarehouse] = useState("Warehouse name here");
//   const [addedItems, setAddedItems] = useState(
//     MOCK_MANUAL_INBOUND.map((m) => ({
//       id: m.id,
//       image: m.image,
//       productName: m.productName,
//       merchantSku: m.inboundId,
//       qty: [15, 20, 0, 30, 35, 40, 9, 50, 55, 0][m.id - 1] ?? 0,
//     })),
//   );
//   const [showSkuModal, setShowSkuModal] = useState(false);
//   const [saving, setSaving] = useState(false);

//   const removeItem = (id) => setAddedItems((p) => p.filter((x) => x.id !== id));

//   const handleConfirmSku = (selected) => {
//     setAddedItems((prev) => {
//       const existingIds = prev.map((p) => p.id);
//       const newItems = selected
//         .filter((s) => !existingIds.includes(s.id))
//         .map((s) => ({
//           id: s.id,
//           image: s.image,
//           productName: s.name,
//           merchantSku: s.sku,
//           qty: s.qty ?? 1,
//         }));
//       return [...prev, ...newItems];
//     });
//   };

//   const handleSave = async () => {
//     if (!warehouse || warehouse === "Warehouse name here") return;
//     setSaving(true);
//     await new Promise((r) => setTimeout(r, 700));
//     setSaving(false);
//     onBack();
//   };

//   return (
//     <div className="space-y-4 font-body">
//       <Topbar PageTitle="Back to Manual Inbound" showBack onBack={onBack} />

//       {/* Warehouse select */}
//       <div className="bg-white rounded-xl border border-surface-border p-5">
//         <label className="block text-xs font-semibold text-slate-700 mb-1.5">
//           <span className="text-slate-700 mr-0.5">*</span>Select Warehouse
//         </label>
//         <div className="relative w-64">
//           <select
//             value={warehouse}
//             onChange={(e) => setWarehouse(e.target.value)}
//             className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
//           >
//             {WAREHOUSES.map((w) => (
//               <option key={w}>{w}</option>
//             ))}
//           </select>
//           <ChevronDown
//             size={13}
//             className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
//           />
//         </div>
//       </div>

//       {/* Manual Inbound List */}
//       <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
//         <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
//           <h2 className="text-base font-bold text-slate-800 font-display">
//             Manual Inbound List
//           </h2>
//           <button
//             onClick={() => setShowSkuModal(true)}
//             className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
//           >
//             <Plus size={14} />
//             Select Merchant SKU
//           </button>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full text-sm font-body">
//             <thead>
//               <tr className="border-b border-surface-border">
//                 {[
//                   "Image",
//                   "Product Name",
//                   "Merchant SKU",
//                   "Quantity",
//                   "Action",
//                 ].map((h) => (
//                   <th
//                     key={h}
//                     className="py-3 px-5 text-left text-sm font-semibold text-slate-700"
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-surface-border">
//               {addedItems.map((item) => (
//                 <tr
//                   key={item.id}
//                   className="hover:bg-surface/50 transition-colors"
//                 >
//                   <td className="py-3 px-5">
//                     <img
//                       src={item.image}
//                       alt={item.productName}
//                       className="w-9 h-9 rounded-lg object-cover"
//                       onError={(e) => {
//                         e.target.src =
//                           "https://placehold.co/36x36/E6ECF0/004368?text=?";
//                       }}
//                     />
//                   </td>
//                   <td className="py-3 px-5 text-slate-700">
//                     {item.productName}
//                   </td>
//                   <td className="py-3 px-5 font-mono text-xs text-slate-600">
//                     {item.merchantSku}
//                   </td>
//                   <td className="py-3 px-5 text-slate-700">
//                     {String(item.qty).padStart(2, "0")}
//                   </td>
//                   <td className="py-3 px-5">
//                     <button
//                       onClick={() => removeItem(item.id)}
//                       className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
//                     >
//                       <Trash2 size={15} />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="flex justify-end gap-3 pt-1">
//         <button
//           onClick={onBack}
//           className="px-7 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors"
//         >
//           Cancel
//         </button>
//         <button
//           onClick={handleSave}
//           disabled={saving}
//           className="px-7 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
//         >
//           {saving && (
//             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//           )}
//           Save
//         </button>
//       </div>

//       {/* Select Merchant SKU Modal (Image 9) */}
//       <SelectMerchantSKUModal
//         open={showSkuModal}
//         onClose={() => setShowSkuModal(false)}
//         onConfirm={handleConfirmSku}
//       />
//     </div>
//   );
// }

// import { useState, useRef, useEffect } from "react";
// import {
//   Plus,
//   ChevronDown,
//   Trash2,
//   Loader2,
//   Printer,
//   Download,
// } from "lucide-react";
// import { useManualInbound } from "./hooks/useManualInbound";
// import { useInboundDropdowns } from "../Inbound/hooks/useInboundDropdowns";
// import InboundFilterBar from "../Inbound/draft/component/InboundFilterBar";
// import ManualInboundTable from "./component/ManualInboundTable";
// import SelectMerchantSKUModal from "./component/SelectMerchantSKUModal";
// import { useInboundList } from "../Inbound/hooks/useInboundList";

// // ─────────────────────────────────────────────────────────────────────────────
// // Tiny reusable DropBtn
// // ─────────────────────────────────────────────────────────────────────────────
// function DropBtn({ value, onClick, open, className = "", loading = false, error = false }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={`flex items-center justify-between pl-3 pr-3 py-[9px] text-sm border rounded-lg bg-white text-slate-600 hover:border-primary/40 transition-colors ${error ? "border-red-400" : "border-surface-border"} ${className}`}
//     >
//       <span className={`truncate ${!value || value === "Warehouse name here" ? "text-slate-400" : "text-slate-700"}`}>
//         {value}
//       </span>
//       {loading ? (
//         <Loader2 size={13} className="text-primary animate-spin ml-2 flex-shrink-0" />
//       ) : (
//         <ChevronDown size={13} className={`text-slate-400 ml-2 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
//       )}
//     </button>
//   );
// }

// function DropMenu({ options, selected, onSelect }) {
//   return (
//     <div className="absolute left-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1 min-w-full w-max max-h-52 overflow-y-auto">
//       {options.map((opt) => (
//         <button
//           key={opt.value}
//           onClick={() => onSelect(opt)}
//           className={`w-full text-left px-4 py-2 text-sm transition-colors ${selected === opt.value ? "text-primary font-semibold bg-blue-50" : "text-slate-700 hover:bg-surface-card"}`}
//         >
//           {opt.label}
//         </button>
//       ))}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // LIST VIEW
// // ─────────────────────────────────────────────────────────────────────────────
// function ManualInboundListView({ onCreateClick }) {
//   const {
//     warehouseId, setWarehouseId,
//     search, setSearch,
//     items, isLoading, isFetching, isError, refetch,
//     selectedIds, toggleSelect, toggleAll,
//   } = useInboundList();

//   const { warehouseOptions, isLoading: warehouseLoading } = useInboundDropdowns();

//   const actionItems = [];

//   return (
//     <div className="p-5 font-body space-y-4">
//       <InboundFilterBar
//         warehouseId={warehouseId}
//         setWarehouseId={setWarehouseId}
//         warehouseOptions={warehouseOptions}
//         warehouseLoading={warehouseLoading}
//         search={search}
//         setSearch={setSearch}
//         onSearch={() => {}}
//       />

//       <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
//         {/* Toolbar */}
//         <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
//           <h2 className="text-sm font-bold text-slate-800">Manual Inbound List</h2>
//           <button
//             onClick={onCreateClick}
//             className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
//           >
//             <Plus size={14} /> Create Inbound
//           </button>
//         </div>

//         {/* Manual Inbound Table */}
//         <ManualInboundTable
//           items={items}
//           selectedIds={selectedIds}
//           onToggleSelect={toggleSelect}
//           onToggleAll={toggleAll}
//           actionItems={actionItems}
//           isLoading={isLoading}
//           isFetching={isFetching}
//           isError={isError}
//           errorMessage="Failed to load manual inbound orders"
//           onRetry={refetch}
//         />

//         {/* Footer */}
//         <div className="flex justify-end gap-2.5 px-5 py-3.5 border-t border-surface-border">
//           <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors">
//             <Download size={13} /> Export <ChevronDown size={12} className="text-slate-400" />
//           </button>
//           <button className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
//             <Printer size={13} /> Print
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CREATE FORM VIEW
// // ─────────────────────────────────────────────────────────────────────────────
// function ManualInboundCreateView({ onCancel, onSaveSuccess }) {
//   const [skuModalOpen, setSkuModalOpen] = useState(false);

//   const { warehouseOptions, isLoading: warehouseLoading } = useInboundDropdowns();

//   const {
//     form, errors,
//     handleFormChange,
//     handleWarehouseSelect,
//     lines, removeLine, updateLineQty,
//     skuSearch, setSkuSearch,
//     pickerSkus, pickerLoading, pickerFetching, isPickerError,
//     selectedIds, quantities,
//     toggleSku, updatePickerQty, removeFromPicker, clearPickerAll,
//     pickerPreviewItems, confirmSkuSelection,
//     saving, handleSave,
//   } = useManualInbound({ onSuccess: onSaveSuccess });

//   // Warehouse dropdown
//   const [showWareDrop, setShowWareDrop] = useState(false);
//   const wareRef = useRef(null);
//   useEffect(() => {
//     const h = (e) => { if (wareRef.current && !wareRef.current.contains(e.target)) setShowWareDrop(false); };
//     document.addEventListener("mousedown", h);
//     return () => document.removeEventListener("mousedown", h);
//   }, []);

//   const selectedWarehouseLabel =
//     warehouseOptions.find((o) => o.value === form.warehouseId)?.label ?? "Warehouse name here";

//   // Guard: shake + open warehouse dropdown when SKU btn pressed without warehouse
//   const [wareShake, setWareShake] = useState(false);
//   const handleSelectSkuClick = () => {
//     if (!form.warehouseId) {
//       setWareShake(true);
//       setTimeout(() => setWareShake(false), 600);
//       setShowWareDrop(true);
//       return;
//     }
//     setSkuModalOpen(true);
//   };

//   return (
//     <div className="p-5 font-body space-y-4">
//       {/* ── Top form card ── */}
//       <div className="bg-white rounded-xl border border-surface-border p-5">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

//           {/* Select Warehouse */}
//           <div>
//             <p className="text-xs font-semibold text-slate-600 mb-1.5">
//               Select Warehouse <span className="text-red-500">*</span>
//             </p>
//             <div className={`relative ${wareShake ? "animate-shake" : ""}`} ref={wareRef}>
//               <DropBtn
//                 value={selectedWarehouseLabel}
//                 onClick={() => setShowWareDrop((p) => !p)}
//                 open={showWareDrop}
//                 loading={warehouseLoading}
//                 error={!!errors.warehouseId || wareShake}
//                 className="w-full"
//               />
//               {showWareDrop && (
//                 <DropMenu
//                   options={warehouseOptions.filter((o) => o.value !== "")}
//                   selected={form.warehouseId}
//                   onSelect={(opt) => {
//                     handleWarehouseSelect({ id: opt.value, name: opt.label });
//                     setShowWareDrop(false);
//                   }}
//                 />
//               )}
//             </div>
//             {(wareShake || errors.warehouseId) && (
//               <p className="mt-1 text-xs text-red-500">
//                 {wareShake ? "Please select a warehouse first" : errors.warehouseId}
//               </p>
//             )}
//           </div>

//           {/* Supplier Name */}
//           <div>
//             <p className="text-xs font-semibold text-slate-600 mb-1.5">Supplier Name</p>
//             <input
//               type="text" name="supplierName" placeholder="Supplier name"
//               value={form.supplierName} onChange={handleFormChange}
//               className="w-full px-3 py-[9px] text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
//             />
//           </div>

//           {/* Supplier Reference */}
//           <div>
//             <p className="text-xs font-semibold text-slate-600 mb-1.5">Supplier Reference / PO No.</p>
//             <input
//               type="text" name="supplierReference" placeholder="PO-001"
//               value={form.supplierReference} onChange={handleFormChange}
//               className="w-full px-3 py-[9px] text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
//             />
//           </div>
//         </div>
//       </div>

//       {/* ── SKU lines table card ── */}
//       <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
//         <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
//           <h2 className="text-sm font-bold text-slate-800">Draft List</h2>
//           <button
//             onClick={handleSelectSkuClick}
//             className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors
//               ${form.warehouseId
//                 ? "bg-primary hover:bg-primary-dark text-white"
//                 : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
//               }`}
//           >
//             <Plus size={14} /> Select Merchant SKU
//             {!form.warehouseId && (
//               <span className="ml-1 text-xs font-normal opacity-70">(select warehouse first)</span>
//             )}
//           </button>
//         </div>

//         {errors.lines && (
//           <div className="px-5 py-2 bg-red-50 border-b border-red-100 text-xs text-red-500">
//             {errors.lines}
//           </div>
//         )}

//         <table className="w-full text-sm">
//           <thead>
//             <tr className="border-b border-surface-border">
//               <th className="py-3 pl-5 text-left font-semibold text-slate-700">Image</th>
//               <th className="py-3 pl-4 text-left font-semibold text-slate-700">Product Name</th>
//               <th className="py-3 pl-4 text-left font-semibold text-slate-700">Merchant SKU</th>
//               <th className="py-3 pl-4 text-left font-semibold text-slate-700">Quantity</th>
//               <th className="py-3 pl-4 pr-5 text-left font-semibold text-slate-700">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-surface-border">
//             {lines.length === 0 ? (
//               <tr>
//                 <td colSpan={5} className="py-14 text-center text-slate-400 text-sm">
//                   {form.warehouseId
//                     ? `No SKUs added — click "Select Merchant SKU"`
//                     : "Select a warehouse to start adding SKUs"}
//                 </td>
//               </tr>
//             ) : (
//               lines.map((line) => (
//                 <tr key={line.id} className="hover:bg-slate-50/50 transition-colors">
//                   <td className="py-3 pl-5">
//                     <img
//                       src={line.image_url || "https://placehold.co/36x36/E6ECF0/004368?text=?"}
//                       alt={line.sku_title}
//                       className="w-9 h-9 rounded-lg object-cover"
//                       onError={(e) => { e.target.src = "https://placehold.co/36x36/E6ECF0/004368?text=?"; }}
//                     />
//                   </td>
//                   <td className="py-3 pl-4 text-slate-700 max-w-[200px] truncate" title={line.sku_title}>
//                     {line.sku_title}
//                   </td>
//                   <td className="py-3 pl-4 font-mono text-slate-500">{line.sku_name}</td>
//                   <td className="py-3 pl-4">
//                     <input
//                       type="number" min={1}
//                       value={line.qtyReceived}
//                       onChange={(e) => updateLineQty(line.id, e.target.value)}
//                       className="w-16 px-2 py-1.5 text-sm border border-surface-border rounded-lg text-center text-slate-700 outline-none focus:border-primary"
//                     />
//                   </td>
//                   <td className="py-3 pl-4 pr-5">
//                     <button onClick={() => removeLine(line.id)} className="text-slate-400 hover:text-red-500 transition-colors">
//                       <Trash2 size={15} />
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* ── Cancel / Save ── */}
//       <div className="flex justify-end gap-3">
//         <button
//           type="button" onClick={onCancel}
//           className="px-7 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors"
//         >
//           Cancel
//         </button>
//         <button
//           onClick={handleSave} disabled={saving}
//           className="flex items-center gap-2 px-7 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60"
//         >
//           {saving ? <Loader2 size={14} className="animate-spin" /> : null}
//           Save
//         </button>
//       </div>

//       {/* ── SKU picker modal ── */}
//       <SelectMerchantSKUModal
//         open={skuModalOpen}
//         onClose={() => setSkuModalOpen(false)}
//         onConfirm={confirmSkuSelection}
//         skuSearch={skuSearch}
//         setSkuSearch={setSkuSearch}
//         pickerSkus={pickerSkus}
//         pickerLoading={pickerLoading}
//         pickerFetching={pickerFetching}
//         isPickerError={isPickerError}
//         selectedIds={selectedIds}
//         quantities={quantities}
//         toggleSku={toggleSku}
//         updatePickerQty={updatePickerQty}
//         removeFromPicker={removeFromPicker}
//         clearPickerAll={clearPickerAll}
//         pickerPreviewItems={pickerPreviewItems}
//       />

//       <style>{`
//         @keyframes shake {
//           0%, 100% { transform: translateX(0); }
//           20%       { transform: translateX(-5px); }
//           40%       { transform: translateX(5px); }
//           60%       { transform: translateX(-4px); }
//           80%       { transform: translateX(4px); }
//         }
//         .animate-shake { animation: shake 0.5s ease both; }
//       `}</style>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // ManualInboundPage
// // ─────────────────────────────────────────────────────────────────────────────
// export default function ManualInboundPage() {
//   const [view, setView] = useState("list");

//   if (view === "create") {
//     return (
//       <ManualInboundCreateView
//         onCancel={() => setView("list")}
//         onSaveSuccess={() => setView("list")}
//       />
//     );
//   }

//   return <ManualInboundListView onCreateClick={() => setView("create")} />;
// }

import { useState, useRef, useEffect } from "react";
import { Plus, ChevronDown, Trash2, Loader2, Printer, Download } from "lucide-react";
import { useManualInbound } from "./hooks/useManualInbound";
import { useManualInboundList } from "./hooks/useManualInboundList";
import { useInboundDropdowns } from "../Inbound/hooks/useInboundDropdowns";
import InboundFilterBar from "../Inbound/draft/component/InboundFilterBar";
import ManualInboundTable from "./component/ManualInboundTable";
import SelectMerchantSKUModal from "./component/SelectMerchantSKUModal";

// ─────────────────────────────────────────────────────────────────────────────
// Tiny reusable DropBtn
// ─────────────────────────────────────────────────────────────────────────────
function DropBtn({ value, onClick, open, className = "", loading = false, error = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between pl-3 pr-3 py-[9px] text-sm border rounded-lg bg-white text-slate-600 hover:border-primary/40 transition-colors ${error ? "border-red-400" : "border-surface-border"} ${className}`}
    >
      <span className={`truncate ${!value || value === "Warehouse name here" ? "text-slate-400" : "text-slate-700"}`}>
        {value}
      </span>
      {loading ? (
        <Loader2 size={13} className="text-primary animate-spin ml-2 flex-shrink-0" />
      ) : (
        <ChevronDown size={13} className={`text-slate-400 ml-2 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      )}
    </button>
  );
}

function DropMenu({ options, selected, onSelect }) {
  return (
    <div className="absolute left-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1 min-w-full w-max max-h-52 overflow-y-auto">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt)}
          className={`w-full text-left px-4 py-2 text-sm transition-colors ${selected === opt.value ? "text-primary font-semibold bg-blue-50" : "text-slate-700 hover:bg-surface-card"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST VIEW
// ─────────────────────────────────────────────────────────────────────────────
function ManualInboundListView({ onCreateClick }) {
  const {
    warehouseId, setWarehouseId,
    timeType,    setTimeType,
    timeFilter,  setTimeFilter,
    inboundType, setInboundType,
    search,      setSearch,
    items,
    isLoading,
    isFetching,
    isError,
    refetch,
    selectedIds,
    toggleSelect,
    toggleAll,
  } = useManualInboundList();

  const { warehouseOptions, isLoading: warehouseLoading } = useInboundDropdowns();

  return (
    <div className="p-5 font-body space-y-4">
      {/* Filter bar — same component, same props shape as other inbound pages */}
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
        onSearch={() => {}}
      />

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-sm font-bold text-slate-800">Manual Inbound List</h2>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <Plus size={14} /> Create Inbound
          </button>
        </div>

        {/* Manual-specific table */}
        <ManualInboundTable
          items={items}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          actionItems={[]}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          errorMessage="Failed to load manual inbound orders"
          onRetry={refetch}
        />

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-5 py-3.5 border-t border-surface-border">
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors">
            <Download size={13} /> Export <ChevronDown size={12} className="text-slate-400" />
          </button>
          <button className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
            <Printer size={13} /> Print
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE FORM VIEW
// ─────────────────────────────────────────────────────────────────────────────
function ManualInboundCreateView({ onCancel, onSaveSuccess }) {
  const [skuModalOpen, setSkuModalOpen] = useState(false);

  const { warehouseOptions, isLoading: warehouseLoading } = useInboundDropdowns();

  const {
    form, errors,
    handleFormChange,
    handleWarehouseSelect,
    lines, removeLine, updateLineQty,
    skuSearch, setSkuSearch,
    pickerSkus, pickerLoading, pickerFetching, isPickerError,
    selectedIds, quantities,
    toggleSku, updatePickerQty, removeFromPicker, clearPickerAll,
    pickerPreviewItems, confirmSkuSelection,
    saving, handleSave,
  } = useManualInbound({ onSuccess: onSaveSuccess });

  // Warehouse dropdown
  const [showWareDrop, setShowWareDrop] = useState(false);
  const wareRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (wareRef.current && !wareRef.current.contains(e.target)) setShowWareDrop(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectedWarehouseLabel =
    warehouseOptions.find((o) => o.value === form.warehouseId)?.label ?? "Warehouse name here";

  // Guard: shake + open warehouse dropdown when SKU btn pressed without warehouse
  const [wareShake, setWareShake] = useState(false);
  const handleSelectSkuClick = () => {
    if (!form.warehouseId) {
      setWareShake(true);
      setTimeout(() => setWareShake(false), 600);
      setShowWareDrop(true);
      return;
    }
    setSkuModalOpen(true);
  };

  return (
    <div className="p-5 font-body space-y-4">
      {/* ── Top form card ── */}
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Select Warehouse */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Warehouse <span className="text-red-500">*</span>
            </p>
            <div className={`relative ${wareShake ? "animate-shake" : ""}`} ref={wareRef}>
              <DropBtn
                value={selectedWarehouseLabel}
                onClick={() => setShowWareDrop((p) => !p)}
                open={showWareDrop}
                loading={warehouseLoading}
                error={!!errors.warehouseId || wareShake}
                className="w-full"
              />
              {showWareDrop && (
                <DropMenu
                  options={warehouseOptions.filter((o) => o.value !== "")}
                  selected={form.warehouseId}
                  onSelect={(opt) => {
                    handleWarehouseSelect({ id: opt.value, name: opt.label });
                    setShowWareDrop(false);
                  }}
                />
              )}
            </div>
            {(wareShake || errors.warehouseId) && (
              <p className="mt-1 text-xs text-red-500">
                {wareShake ? "Please select a warehouse first" : errors.warehouseId}
              </p>
            )}
          </div>

          {/* Supplier Name */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Supplier Name</p>
            <input
              type="text" name="supplierName" placeholder="Supplier name"
              value={form.supplierName} onChange={handleFormChange}
              className="w-full px-3 py-[9px] text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Supplier Reference */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Supplier Reference / PO No.</p>
            <input
              type="text" name="supplierReference" placeholder="PO-001"
              value={form.supplierReference} onChange={handleFormChange}
              className="w-full px-3 py-[9px] text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── SKU lines table card ── */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-sm font-bold text-slate-800">Draft List</h2>
          <button
            onClick={handleSelectSkuClick}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors
              ${form.warehouseId
                ? "bg-primary hover:bg-primary-dark text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }`}
          >
            <Plus size={14} /> Select Merchant SKU
            {!form.warehouseId && (
              <span className="ml-1 text-xs font-normal opacity-70">(select warehouse first)</span>
            )}
          </button>
        </div>

        {errors.lines && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-100 text-xs text-red-500">
            {errors.lines}
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="py-3 pl-5 text-left font-semibold text-slate-700">Image</th>
              <th className="py-3 pl-4 text-left font-semibold text-slate-700">Product Name</th>
              <th className="py-3 pl-4 text-left font-semibold text-slate-700">Merchant SKU</th>
              <th className="py-3 pl-4 text-left font-semibold text-slate-700">Quantity</th>
              <th className="py-3 pl-4 pr-5 text-left font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-slate-400 text-sm">
                  {form.warehouseId
                    ? `No SKUs added — click "Select Merchant SKU"`
                    : "Select a warehouse to start adding SKUs"}
                </td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 pl-5">
                    <img
                      src={line.image_url || "https://placehold.co/36x36/E6ECF0/004368?text=?"}
                      alt={line.sku_title}
                      className="w-9 h-9 rounded-lg object-cover"
                      onError={(e) => { e.target.src = "https://placehold.co/36x36/E6ECF0/004368?text=?"; }}
                    />
                  </td>
                  <td className="py-3 pl-4 text-slate-700 max-w-[200px] truncate" title={line.sku_title}>
                    {line.sku_title}
                  </td>
                  <td className="py-3 pl-4 font-mono text-slate-500">{line.sku_name}</td>
                  <td className="py-3 pl-4">
                    <input
                      type="number" min={1}
                      value={line.qtyReceived}
                      onChange={(e) => updateLineQty(line.id, e.target.value)}
                      className="w-16 px-2 py-1.5 text-sm border border-surface-border rounded-lg text-center text-slate-700 outline-none focus:border-primary"
                    />
                  </td>
                  <td className="py-3 pl-4 pr-5">
                    <button onClick={() => removeLine(line.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Cancel / Save ── */}
      <div className="flex justify-end gap-3">
        <button
          type="button" onClick={onCancel}
          className="px-7 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-7 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : null}
          Save
        </button>
      </div>

      {/* ── SKU picker modal ── */}
      <SelectMerchantSKUModal
        open={skuModalOpen}
        onClose={() => setSkuModalOpen(false)}
        onConfirm={confirmSkuSelection}
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

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-5px); }
          40%       { transform: translateX(5px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease both; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ManualInboundPage
// ─────────────────────────────────────────────────────────────────────────────
export default function ManualInboundPage() {
  const [view, setView] = useState("list");

  if (view === "create") {
    return (
      <ManualInboundCreateView
        onCancel={() => setView("list")}
        onSaveSuccess={() => setView("list")}
      />
    );
  }

  return <ManualInboundListView onCreateClick={() => setView("create")} />;
}