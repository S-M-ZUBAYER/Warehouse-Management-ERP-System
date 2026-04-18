// import { useRef, useEffect, useState } from "react";
// import { Search, ChevronDown } from "lucide-react";
// import Topbar from "../../../components/layout/Topbar";
// import InvFooter from "../shared/components/InvFooter";
// import { SKU_TYPES } from "../shared/mockData";
// import AddMerchantSKUModal from "./AddMerchantSKUModal";
// import { useProductList } from "../../productManagement/hooks/useProductList";
// import { ConfirmModal } from "../../productManagement/productList/component/ProductModals";

// export default function MerchantSKUPage() {
//   const [skuType, setSkuType] = useState("SKU");
//   const [openActionId, setOpenActionId] = useState(null);
//   const [showBulkDrop, setShowBulkDrop] = useState(false);
//   const actionRefs = useRef({});
//   const bulkRef = useRef(null);

//   const {
//     search,
//     setSearch,
//     products,
//     pagination,
//     page,
//     setPage,
//     listLoading,
//     listFetching,
//     selectedIds,
//     toggleSelect,
//     toggleAll,
//     allSelected,
//     someSelected,
//     showAddModal,
//     setShowAddModal,
//     openDeleteModal,
//     handleBulkAction,
//     deleteTarget,
//     showDeleteModal,
//     setShowDeleteModal,
//     confirmDelete,
//     deleting,
//     bulkDeleteConfirm,
//     setBulkDeleteConfirm,
//     confirmBulkDelete,
//     bulkDeleting,
//     form,
//     errors,
//     fileInputRef,
//     handleFormChange,
//     handlePhotoChange,
//     handleWarehouseSelect,
//     handleSave,
//     handleCloseModal,
//     saving,
//     warehouseSearch,
//     setWarehouseSearch,
//     modalWarehouses,
//     warehouseLoading,
//   } = useProductList();

//   const modalProps = {
//     form,
//     errors,
//     fileInputRef,
//     handleFormChange,
//     handlePhotoChange,
//     handleWarehouseSelect,
//     handleSave,
//     handleCloseModal,
//     saving,
//     warehouseSearch,
//     setWarehouseSearch,
//     modalWarehouses,
//     warehouseLoading,
//   };
//   console.log(showAddModal);

//   useEffect(() => {
//     const handler = (e) => {
//       if (openActionId !== null) {
//         const ref = actionRefs.current[openActionId];
//         if (ref && !ref.contains(e.target)) setOpenActionId(null);
//       }
//       if (bulkRef.current && !bulkRef.current.contains(e.target))
//         setShowBulkDrop(false);
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, [openActionId]);

//   return (
//     <div className="space-y-4 font-body">
//       <Topbar PageTitle="Merchant SKU" />

//       {/* Search bar */}
//       <div className="bg-white rounded-xl border border-surface-border p-7 flex items-center gap-3">
//         <div className="relative">
//           <select
//             value={skuType}
//             onChange={(e) => setSkuType(e.target.value)}
//             className="appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border
//                        rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer w-28"
//           >
//             {SKU_TYPES.map((t) => (
//               <option key={t}>{t}</option>
//             ))}
//           </select>
//           <ChevronDown
//             size={13}
//             className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
//           />
//         </div>
//         <div className="relative flex-1 max-w-xs">
//           <Search
//             size={14}
//             className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//           />
//           <input
//             type="text"
//             placeholder="Search"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg
//                        text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
//           />
//         </div>
//         <button className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
//           Search
//         </button>
//       </div>

//       {/* SKU List card */}
//       <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
//         <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
//           <h2 className="text-base font-bold text-slate-800 font-display">
//             SKU List
//           </h2>
//           <div className="flex items-center gap-2">
//             {/* Bulk Action */}
//             <div className="relative" ref={bulkRef}>
//               <button
//                 onClick={() => setShowBulkDrop((p) => !p)}
//                 className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border
//                            border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
//               >
//                 Bulk Action <ChevronDown size={13} className="text-slate-400" />
//               </button>
//               {showBulkDrop && (
//                 <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-40">
//                   <button
//                     onClick={() => {
//                       handleBulkAction("delete");
//                       setShowBulkDrop(false);
//                     }}
//                     disabled={selectedIds.length === 0}
//                     className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
//                   >
//                     Delete Selected
//                   </button>
//                   <button
//                     onClick={() => setShowBulkDrop(false)}
//                     className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors"
//                   >
//                     Export Selected
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Add Merchant SKU */}
//             <button
//               onClick={() => setShowAddModal(true)}
//               className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
//                          bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
//             >
//               Add Merchant SKU{" "}
//               <ChevronDown size={13} className="text-white/70" />
//             </button>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="overflow-x-auto relative">
//           {listFetching && !listLoading && (
//             <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
//               <div className="h-full bg-primary animate-pulse w-1/3" />
//             </div>
//           )}
//           <table className="w-full text-sm font-body">
//             <thead>
//               <tr className="border-b border-surface-border">
//                 <th className="py-3 pl-5 w-36 text-left">
//                   <label className="flex items-center gap-2 cursor-pointer select-none">
//                     <input
//                       type="checkbox"
//                       checked={allSelected}
//                       ref={(el) => {
//                         if (el) el.indeterminate = someSelected && !allSelected;
//                       }}
//                       onChange={toggleAll}
//                       className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                     />
//                     <span className="pl-2 text-base font-semibold text-primary-text">
//                       Select All
//                     </span>
//                   </label>
//                 </th>
//                 {[
//                   "Image",
//                   "SKU Name",
//                   "SKU Title",
//                   "Weight",
//                   "Size",
//                   "Creation Time",
//                   "Update Time",
//                   "Details",
//                   "Actions",
//                 ].map((h) => (
//                   <th
//                     key={h}
//                     className="py-3 pr-4 text-left text-xs font-semibold text-slate-600"
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-surface-border">
//               {listLoading ? (
//                 Array.from({ length: 5 }).map((_, i) => (
//                   <tr key={i} className="animate-pulse">
//                     <td className="pl-5 py-3">
//                       <div className="w-4 h-4 bg-slate-200 rounded" />
//                     </td>
//                     <td className="py-3 pr-4">
//                       <div className="w-9 h-9 bg-slate-200 rounded-lg" />
//                     </td>
//                     {Array.from({ length: 8 }).map((_, j) => (
//                       <td key={j} className="py-3 pr-4">
//                         <div className="h-3 bg-slate-200 rounded w-20" />
//                       </td>
//                     ))}
//                   </tr>
//                 ))
//               ) : products.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={11}
//                     className="py-16 text-center text-slate-400 text-sm"
//                   >
//                     No SKUs found
//                   </td>
//                 </tr>
//               ) : (
//                 products.map((sku) => (
//                   <tr
//                     key={sku.id}
//                     className={`hover:bg-surface/50 transition-colors ${
//                       selectedIds.includes(sku.id) ? "bg-blue-50/40" : ""
//                     }`}
//                   >
//                     <td className="pl-5 py-3">
//                       <input
//                         type="checkbox"
//                         checked={selectedIds.includes(sku.id)}
//                         onChange={() => toggleSelect(sku.id)}
//                         className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                       />
//                     </td>
//                     <td className="py-3 pr-4">
//                       <img
//                         src={sku.image_url || sku.image}
//                         alt={sku.sku_name || sku.skuName}
//                         className="w-9 h-9 rounded-lg object-cover"
//                         onError={(e) => {
//                           e.target.src =
//                             "https://placehold.co/36x36/E6ECF0/004368?text=?";
//                         }}
//                       />
//                     </td>
//                     <td className="py-3 pr-4 font-medium text-slate-800">
//                       {sku.sku_name || sku.skuName}
//                     </td>
//                     <td className="py-3 pr-4 text-slate-700">
//                       {sku.sku_title || sku.skuTitle}
//                     </td>
//                     <td className="py-3 pr-4 text-slate-600">
//                       {sku.weight ? `${sku.weight} kg` : "—"}
//                     </td>
//                     <td className="py-3 pr-4 text-slate-600 font-mono text-xs">
//                       {sku.length && sku.width && sku.height
//                         ? `${sku.length}×${sku.width}×${sku.height}`
//                         : sku.size || "—"}
//                     </td>
//                     <td className="py-3 pr-4 text-slate-500 text-xs">
//                       {sku.created_at
//                         ? new Date(sku.created_at).toLocaleDateString()
//                         : sku.createdAt || "—"}
//                     </td>
//                     <td className="py-3 pr-4 text-slate-500 text-xs">
//                       {sku.updated_at
//                         ? new Date(sku.updated_at).toLocaleDateString()
//                         : sku.updatedAt || "—"}
//                     </td>
//                     <td className="py-3 pr-4">
//                       <button className="text-xs font-semibold text-primary hover:underline">
//                         Details
//                       </button>
//                     </td>
//                     <td className="py-3 pr-5">
//                       <div
//                         className="relative"
//                         ref={(el) => (actionRefs.current[sku.id] = el)}
//                       >
//                         <button
//                           onClick={() =>
//                             setOpenActionId(
//                               openActionId === sku.id ? null : sku.id,
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
//                         {openActionId === sku.id && (
//                           <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-28">
//                             <button
//                               onClick={() => setOpenActionId(null)}
//                               className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-surface-card transition-colors"
//                             >
//                               Edit
//                             </button>
//                             <button
//                               onClick={() => {
//                                 setOpenActionId(null);
//                                 openDeleteModal(sku);
//                               }}
//                               className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
//                             >
//                               Delete
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//         <InvFooter
//           page={page}
//           totalPages={pagination.totalPages}
//           total={pagination.total}
//           onPageChange={setPage}
//         />
//       </div>

//       {/* Single Delete Confirm */}

//       {showDeleteModal && deleteTarget && (
//         <ConfirmModal
//           title="Delete Product"
//           message={
//             <>
//               Are you sure you want to delete{" "}
//               <span className="font-semibold text-slate-800">
//                 {deleteTarget.sku_title}
//               </span>{" "}
//               ({deleteTarget.sku_name})?
//               <br />
//               <span className="text-red-500 text-xs mt-1 block">
//                 This action cannot be undone.
//               </span>
//             </>
//           }
//           confirmLabel={deleting ? "Deleting..." : "Delete"}
//           confirmClass="bg-red-500 hover:bg-red-600 text-white"
//           onCancel={() => setShowDeleteModal(false)}
//           onConfirm={confirmDelete}
//           loading={deleting}
//         />
//       )}

//       {/* Bulk Delete Confirm */}
//       {bulkDeleteConfirm && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center p-4"
//           style={{
//             background: "rgba(200,210,220,0.55)",
//             backdropFilter: "blur(3px)",
//           }}
//         >
//           <div className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-sm">
//             <h3 className="text-base font-bold text-slate-800 mb-2">
//               Delete Selected SKUs?
//             </h3>
//             <p className="text-sm text-slate-500 mb-6">
//               This will permanently delete{" "}
//               <span className="font-semibold text-red-500">
//                 {selectedIds.length}
//               </span>{" "}
//               selected SKU(s).
//             </p>
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setBulkDeleteConfirm(false)}
//                 className="px-5 py-2 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 hover:bg-surface-card transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmBulkDelete}
//                 disabled={bulkDeleting}
//                 className="px-5 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60"
//               >
//                 {bulkDeleting ? "Deleting…" : "Delete"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add Modal */}
//       {showAddModal && <AddMerchantSKUModal {...modalProps} />}
//     </div>
//   );
// }

import { useRef, useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Topbar from "../../../components/layout/Topbar";
import InvFooter from "../shared/components/InvFooter";
import { SKU_TYPES } from "../shared/mockData";
import AddMerchantSKUModal from "./AddMerchantSKUModal";
import { useProductList } from "../../productManagement/hooks/useProductList";
import { ConfirmModal } from "../../productManagement/productList/component/ProductModals";
import { useEditSKU } from "./hooks/useMerchantSKUEdit";
import EditMerchantSKUModal from "./EditMerchantSKUModal";

export default function MerchantSKUPage() {
  const [skuType, setSkuType] = useState("SKU");
  const [openActionId, setOpenActionId] = useState(null);
  const [showBulkDrop, setShowBulkDrop] = useState(false);
  const actionRefs = useRef({});
  const bulkRef = useRef(null);

  const {
    search,
    setSearch,
    products,
    pagination,
    page,
    setPage,
    listLoading,
    listFetching,
    selectedIds,
    toggleSelect,
    toggleAll,
    allSelected,
    someSelected,
    showAddModal,
    setShowAddModal,
    openDeleteModal,
    handleBulkAction,
    deleteTarget,
    showDeleteModal,
    setShowDeleteModal,
    confirmDelete,
    deleting,
    bulkDeleteConfirm,
    setBulkDeleteConfirm,
    confirmBulkDelete,
    bulkDeleting,
    form,
    errors,
    fileInputRef,
    handleFormChange,
    handlePhotoChange,
    handleWarehouseSelect,
    handleSave,
    handleCloseModal,
    saving,
    warehouseSearch,
    setWarehouseSearch,
    modalWarehouses,
    warehouseLoading,
  } = useProductList();

  const modalProps = {
    form,
    errors,
    fileInputRef,
    handleFormChange,
    handlePhotoChange,
    handleWarehouseSelect,
    handleSave,
    handleCloseModal,
    saving,
    warehouseSearch,
    setWarehouseSearch,
    modalWarehouses,
    warehouseLoading,
  };
  const edit = useEditSKU();
  console.log(edit?.showEditModal, edit?.editingSku);

  useEffect(() => {
    const handler = (e) => {
      if (openActionId !== null) {
        const ref = actionRefs.current[openActionId];
        if (ref && !ref.contains(e.target)) setOpenActionId(null);
      }
      if (bulkRef.current && !bulkRef.current.contains(e.target))
        setShowBulkDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openActionId]);

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Merchant SKU" />

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-surface-border p-7 flex items-center gap-3">
        <div className="relative">
          <select
            value={skuType}
            onChange={(e) => setSkuType(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border
                       rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer w-28"
          >
            {SKU_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg
                       text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <button className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
          Search
        </button>
      </div>

      {/* SKU List card */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-slate-800 font-display">
            SKU List
          </h2>
          <div className="flex items-center gap-2">
            {/* Bulk Action */}
            <div className="relative" ref={bulkRef}>
              <button
                onClick={() => setShowBulkDrop((p) => !p)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border
                           border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                Bulk Action <ChevronDown size={13} className="text-slate-400" />
              </button>
              {showBulkDrop && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-40">
                  <button
                    onClick={() => {
                      handleBulkAction("delete");
                      setShowBulkDrop(false);
                    }}
                    disabled={selectedIds.length === 0}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setShowBulkDrop(false)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors"
                  >
                    Export Selected
                  </button>
                </div>
              )}
            </div>

            {/* Add Merchant SKU */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                         bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              Add Merchant SKU{" "}
              <ChevronDown size={13} className="text-white/70" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative">
          {listFetching && !listLoading && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
              <div className="h-full bg-primary animate-pulse w-1/3" />
            </div>
          )}
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="py-3 pl-5 w-36 text-left">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected;
                      }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                    <span className="pl-2 text-base font-semibold text-primary-text">
                      Select All
                    </span>
                  </label>
                </th>
                {[
                  "Image",
                  "SKU Name",
                  "SKU Title",
                  "Weight",
                  "Size",
                  "Creation Time",
                  "Update Time",
                  "Details",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 pr-4 text-left text-xs font-semibold text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {listLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="pl-5 py-3">
                      <div className="w-4 h-4 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="w-9 h-9 bg-slate-200 rounded-lg" />
                    </td>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="py-3 pr-4">
                        <div className="h-3 bg-slate-200 rounded w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="py-16 text-center text-slate-400 text-sm"
                  >
                    No SKUs found
                  </td>
                </tr>
              ) : (
                products.map((sku) => (
                  <tr
                    key={sku.id}
                    className={`hover:bg-surface/50 transition-colors ${
                      selectedIds.includes(sku.id) ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <td className="pl-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(sku.id)}
                        onChange={() => toggleSelect(sku.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <img
                        src={sku.image_url || sku.image}
                        alt={sku.sku_name || sku.skuName}
                        className="w-9 h-9 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/36x36/E6ECF0/004368?text=?";
                        }}
                      />
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {sku.sku_name || sku.skuName}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {sku.sku_title || sku.skuTitle}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {sku.weight ? `${sku.weight} kg` : "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 font-mono text-xs">
                      {sku.length && sku.width && sku.height
                        ? `${sku.length}×${sku.width}×${sku.height}`
                        : sku.size || "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">
                      {sku.created_at
                        ? new Date(sku.created_at).toLocaleDateString()
                        : sku.createdAt || "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">
                      {sku.updated_at
                        ? new Date(sku.updated_at).toLocaleDateString()
                        : sku.updatedAt || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <button className="text-xs font-semibold text-primary hover:underline">
                        Details
                      </button>
                    </td>
                    <td className="py-3 pr-5">
                      <div
                        className="relative"
                        ref={(el) => (actionRefs.current[sku.id] = el)}
                      >
                        <button
                          onClick={() =>
                            setOpenActionId(
                              openActionId === sku.id ? null : sku.id,
                            )
                          }
                          className="flex items-center gap-0.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-surface-card transition-colors"
                        >
                          {[1, 2, 3].map((d) => (
                            <span
                              key={d}
                              className="w-1 h-1 rounded-full bg-current mx-px"
                            />
                          ))}
                        </button>
                        {openActionId === sku.id && (
                          <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-28">
                            <button
                              onClick={() => {
                                setOpenActionId(null);
                                edit.setShowEditModal(true); // Call handleEdit instead of just closing
                                edit?.setEditingSku(sku);
                              }}
                              className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-surface-card transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setOpenActionId(null);
                                openDeleteModal(sku);
                              }}
                              className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Updated Pagination - matching ProductListPage style */}
        {!listLoading && pagination?.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-surface-border">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * (pagination.limit || 10) + 1}–
              {Math.min(page * (pagination.limit || 10), pagination.total || 0)}{" "}
              of {pagination.total || 0} SKUs
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600 hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs rounded-lg border transition-colors
                        ${
                          page === p
                            ? "bg-primary text-white border-primary"
                            : "border-surface-border text-slate-600 hover:bg-surface-card"
                        }`}
                    >
                      {p}
                    </button>
                  );
                },
              )}
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600 hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
          <button className="flex items-center gap-2 px-14 py-2.5 text-base font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
            Export <ChevronDown size={13} className="text-slate-400" />
          </button>
          <button className="px-16 py-2.5 text-base font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">
            Print
          </button>
        </div>
      </div>

      {/* Single Delete Confirm */}
      {showDeleteModal && deleteTarget && (
        <ConfirmModal
          title="Delete Product"
          message={
            <>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800">
                {deleteTarget.sku_title}
              </span>{" "}
              ({deleteTarget.sku_name})?
              <br />
              <span className="text-red-500 text-xs mt-1 block">
                This action cannot be undone.
              </span>
            </>
          }
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          confirmClass="bg-red-500 hover:bg-red-600 text-white"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          loading={deleting}
        />
      )}

      {/* Bulk Delete Confirm */}
      {bulkDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(200,210,220,0.55)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-sm">
            <h3 className="text-base font-bold text-slate-800 mb-2">
              Delete Selected SKUs?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              This will permanently delete{" "}
              <span className="font-semibold text-red-500">
                {selectedIds.length}
              </span>{" "}
              selected SKU(s).
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="px-5 py-2 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 hover:bg-surface-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                disabled={bulkDeleting}
                className="px-5 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60"
              >
                {bulkDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && <AddMerchantSKUModal {...modalProps} />}

      {/* Edit Modal */}
      {edit.showEditModal && (
        <EditMerchantSKUModal
          sku={edit.editingSku}
          onClose={edit.closeEditModal}
          onSave={edit.handleUpdateSKU}
          saving={edit.editSaving}
          warehouses={edit.editModalWarehouses}
          warehouseLoading={edit.warehouseLoading}
        />
      )}
    </div>
  );
}
