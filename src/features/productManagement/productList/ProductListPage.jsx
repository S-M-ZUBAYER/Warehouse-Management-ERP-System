// import { Search, ChevronDown, Plus, X, UploadCloud } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useProductList } from "../hooks/useProductList";
// import SelectDropdown from "../../../components/shared/SelectDropdown";
// import Topbar from "../../../components/layout/Topbar";
// import { useState } from "react";
// import { WAREHOUSES } from "../../inventoryManagement/shared/mockData";

// // ─────────────────────────────────────────────────────────────────────────────
// // ProductListPage — Matches Figma Image 1 exactly:
// //   • Top filter bar: Select Warehouse | Product Status | Select Country | SKU
// //   • "Product list" section header
// //   • Search + Bulk Action | Add Products (right)
// //   • Table: Select | Image | SKU | Product Name | Available in Inventory |
// //            In transit Inventory | Details | Actions
// //   • Footer: Export (dropdown) | Print
// // ─────────────────────────────────────────────────────────────────────────────

// export default function ProductListPage() {
//   const navigate = useNavigate();

//   const {
//     search,
//     setSearch,
//     warehouse,
//     setWarehouse,
//     productStatus,
//     setProductStatus,
//     country,
//     setCountry,
//     sku,
//     setSku,
//     bulkAction,
//     setBulkAction,
//     products,
//     selectedIds,
//     toggleSelect,
//     toggleAll,
//     allSelected,
//     someSelected,
//     warehouses,
//     statuses,
//     countries,
//     form,
//     setForm,
//     handleSave,
//     handleFormChange,
//     handlePhotoChange,
//     showAddModal,
//     setShowAddModal,
//     saving,
//     setSaving,
//     errors,
//   } = useProductList();

//   return (
//     <div className="space-y-4 font-body">
//       {/* ── Page Title ── */}
//       <Topbar PageTitle="Product Management"></Topbar>
//       {/* ── Top Filter Bar ── */}
//       <div className="bg-white rounded-xl border border-surface-border p-4">
//         <div className="grid grid-cols-4 gap-3">
//           <SelectDropdown
//             label="Select Warehouse"
//             placeholder="Warehouse name here"
//             options={warehouses}
//             value={warehouse}
//             onChange={setWarehouse}
//           />
//           <SelectDropdown
//             label="Product Status"
//             placeholder="Product Status here"
//             options={statuses}
//             value={productStatus}
//             onChange={setProductStatus}
//           />
//           <SelectDropdown
//             label="Select Country"
//             placeholder="Country name here"
//             options={countries}
//             value={country}
//             onChange={setCountry}
//           />
//           {/* SKU input */}
//           <div>
//             <p className="text-xs font-semibold text-slate-600 mb-1.5">SKU</p>
//             <input
//               type="text"
//               placeholder="SKU"
//               value={sku}
//               onChange={(e) => setSku(e.target.value)}
//               className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm
//                          text-slate-700 placeholder-slate-400 outline-none
//                          focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
//             />
//           </div>
//         </div>
//       </div>

//       {/* ── Product list card ── */}
//       <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
//         {/* Card header */}
//         <div className="px-5 py-4 ">
//           <h2 className="text-xl font-bold text-slate-800 font-display">
//             Product list
//           </h2>
//         </div>

//         {/* Toolbar */}
//         <div className="flex items-center justify-between px-5 py-3 pb-7 border-b border-surface-border gap-3">
//           {/* Left: Search + Bulk Action */}
//           <div className="flex items-center gap-3">
//             {/* Search */}
//             <div className="relative">
//               <Search
//                 size={14}
//                 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//               />
//               <input
//                 type="text"
//                 placeholder="Search"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="pl-8 pr-3 py-2 text-sm bg-white border border-surface-border rounded-lg
//                            text-slate-700 placeholder-slate-400 outline-none w-80
//                            focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
//               />
//             </div>

//             {/* Bulk Action */}
//             <div className="relative">
//               <button
//                 className="flex items-center gap-2 px-3 py-2 text-sm border border-surface-border
//                            rounded-lg text-slate-600 bg-white hover:bg-surface-card transition-colors"
//               >
//                 Bulk Action
//                 <ChevronDown size={13} className="text-slate-400" />
//               </button>
//             </div>
//           </div>

//           {/* Right: Add Products */}
//           <button
//             onClick={() => setShowAddModal(true)}
//             className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
//                        bg-white border border-surface-border rounded-lg text-slate-700
//                        hover:bg-surface-card transition-colors"
//           >
//             Add Products
//             <ChevronDown size={13} className="text-slate-400" />
//           </button>
//         </div>

//         {/* ── Table ── */}
//         <div className="overflow-x-auto">
//           <table className="w-full text-lg font-body">
//             <thead>
//               <tr className="border-b border-surface-border bg-white">
//                 <th className="py-3 pl-5 w-36 text-left">
//                   <label className="flex items-center gap-2 cursor-pointer select-none">
//                     <input
//                       type="checkbox"
//                       checked={allSelected}
//                       ref={(el) => {
//                         if (el) {
//                           el.indeterminate = someSelected && !allSelected; // ✅ Fix: only indeterminate when SOME (not all) are selected
//                         }
//                       }}
//                       onChange={toggleAll}
//                       className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                     />
//                     <span className="pl-2 text-base font-semibold text-primary-text">
//                       Select All
//                     </span>
//                   </label>
//                 </th>
//                 <th className="w-16 py-3 text-left">
//                   <span className="text-base font-semibold text-primary-text  tracking-wide">
//                     Image
//                   </span>
//                 </th>
//                 <th className="w-24 py-3 text-left pr-4">
//                   <span className="text-base font-semibold text-primary-text  tracking-wide">
//                     SKU
//                   </span>
//                 </th>
//                 <th className="py-3 text-left pr-4">
//                   <span className="text-base font-semibold text-primary-text  tracking-wide">
//                     Product Name
//                   </span>
//                 </th>
//                 <th className="w-50 py-3 text-left pr-4">
//                   <span className="text-base font-semibold text-primary-text  tracking-wide">
//                     Available in Inventory
//                   </span>
//                 </th>
//                 <th className="w-50 py-3 text-left pr-4">
//                   <span className="text-base font-semibold text-primary-text  tracking-wide">
//                     In transit Inventory
//                   </span>
//                 </th>
//                 <th className="w-20 py-3 text-left pr-4">
//                   <span className="text-base font-semibold text-primary-text  tracking-wide">
//                     Details
//                   </span>
//                 </th>
//                 <th className="w-20 py-3 text-left pr-5">
//                   <span className="text-base font-semibold text-primary-text  tracking-wide">
//                     Actions
//                   </span>
//                 </th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-surface-border">
//               {products.map((product) => {
//                 const isChecked = selectedIds.includes(product.id);
//                 return (
//                   <tr
//                     key={product.id}
//                     className={`transition-colors hover:bg-surface/60 ${isChecked ? "bg-blue-50/40" : ""}`}
//                   >
//                     {/* Checkbox */}
//                     <td className="pl-5 py-2">
//                       <input
//                         type="checkbox"
//                         checked={isChecked}
//                         onChange={() => toggleSelect(product.id)}
//                         className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                       />
//                     </td>

//                     {/* Image */}
//                     <td className="py-2">
//                       <img
//                         src={product.image}
//                         alt={product.name}
//                         className="w-9 h-9 rounded-lg object-cover"
//                         onError={(e) => {
//                           e.target.src =
//                             "https://placehold.co/36x36/E6ECF0/004368?text=?";
//                         }}
//                       />
//                     </td>

//                     {/* SKU */}
//                     <td className="py-2 pr-4">
//                       <span className="text-sm font-medium text-slate-700">
//                         {product.sku}
//                       </span>
//                     </td>

//                     {/* Product Name */}
//                     <td className="py-2 pr-4">
//                       <span className="text-sm text-slate-700">
//                         {product.name}
//                       </span>
//                     </td>

//                     {/* Available in Inventory */}
//                     <td className="py-2 pr-4">
//                       <span className="text-sm text-slate-600">
//                         {product.availableInventory} units
//                       </span>
//                     </td>

//                     {/* In transit Inventory */}
//                     <td className="py-2 pr-4">
//                       <span className="text-sm text-slate-600">
//                         {product.inTransitInventory} units
//                       </span>
//                     </td>

//                     {/* Details link */}
//                     <td className="py-2 pr-4">
//                       <button className="text-sm font-medium text-primary hover:underline transition-colors">
//                         Details
//                       </button>
//                     </td>

//                     {/* Actions — 3-dot menu */}
//                     <td className="py-2 pr-5">
//                       <button className="flex items-center gap-0.5 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-surface-card">
//                         <span className="w-1 h-1 rounded-full bg-current" />
//                         <span className="w-1 h-1 rounded-full bg-current mx-0.5" />
//                         <span className="w-1 h-1 rounded-full bg-current" />
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* ── Footer: Export + Print ── */}
//         <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
//           <button
//             className="flex items-center gap-2 px-14 py-2.5 text-base font-semibold
//                        border border-surface-border rounded-lg text-slate-700 bg-white
//                        hover:bg-surface-card transition-colors"
//           >
//             Export
//             <ChevronDown size={13} className="text-slate-400" />
//           </button>
//           <button
//             className="px-16 py-2.5 text-base font-semibold rounded-lg bg-primary
//                        hover:bg-primary-dark text-white transition-colors"
//           >
//             Print
//           </button>
//         </div>
//       </div>
//       {/* ── Add Single Merchant SKU Modal (Image 2) ── */}
//       {showAddModal && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center p-4"
//           style={{
//             background: "rgba(200,210,220,0.55)",
//             backdropFilter: "blur(3px)",
//           }}
//           onClick={(e) =>
//             e.target === e.currentTarget && setShowAddModal(false)
//           }
//         >
//           <div
//             className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden"
//             style={{ maxWidth: "500px", animation: "popIn 0.18s ease both" }}
//           >
//             {/* Header */}
//             <div className="flex items-start justify-between px-7 pt-7 pb-2">
//               <div>
//                 <h2 className="text-lg font-bold text-slate-800 font-display">
//                   Add Single Merchant SKU
//                 </h2>
//                 <p className="text-xs text-slate-500 mt-1">
//                   Add a new Merchant SKU to your inventory.
//                 </p>
//               </div>
//               <button
//                 onClick={() => setShowAddModal(false)}
//                 className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-1"
//               >
//                 <X size={16} />
//               </button>
//             </div>

//             <div className="px-7 pb-7 space-y-4">
//               {/* Photo upload */}
//               <label className="flex flex-col items-center justify-center border-2 border-dashed border-surface-border rounded-xl py-6 cursor-pointer hover:border-primary/40 transition-colors bg-surface">
//                 <input
//                   type="file"
//                   accept="image/jpeg,image/png"
//                   onChange={handlePhotoChange}
//                   className="hidden"
//                 />
//                 {form.photoPreview ? (
//                   <img
//                     src={form.photoPreview}
//                     className="w-16 h-16 rounded-full object-cover mb-2"
//                   />
//                 ) : (
//                   <>
//                     <UploadCloud size={28} className="text-slate-400 mb-2" />
//                     <p className="text-sm font-semibold text-slate-700">
//                       Choose a file or drag & drop it here
//                     </p>
//                     <p className="text-xs text-slate-400 mt-0.5">
//                       JPEG or PNG, less than 5MB
//                     </p>
//                   </>
//                 )}
//                 <button
//                   type="button"
//                   className="mt-2 px-5 py-1.5 text-xs font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
//                 >
//                   Browse File
//                 </button>
//               </label>

//               {/* Form fields 2-col */}
//               <div className="grid grid-cols-2 gap-3">
//                 {[
//                   {
//                     label: "*Product Name",
//                     name: "productName",
//                     placeholder: "Write product name here",
//                     required: true,
//                   },
//                   {
//                     label: "*SKU Name",
//                     name: "skuName",
//                     placeholder: "Write SKU here",
//                     required: true,
//                   },
//                   {
//                     label: "*Product Details",
//                     name: "productDetails",
//                     placeholder: "Product details here",
//                     required: true,
//                   },
//                   { label: "GTIN", name: "gtin", placeholder: "GTIN here" },
//                   {
//                     label: "Product Price",
//                     name: "productPrice",
//                     placeholder: "$0000",
//                   },
//                   {
//                     label: "Weight",
//                     name: "weight",
//                     placeholder: "Product weight",
//                   },
//                 ].map(({ label, name, placeholder, required }) => (
//                   <div key={name}>
//                     <label className="block text-xs text-slate-600 mb-1">
//                       {label}
//                     </label>
//                     <input
//                       type="text"
//                       name={name}
//                       value={form[name]}
//                       onChange={handleFormChange}
//                       placeholder={placeholder}
//                       className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none transition-all
//                         ${errors[name] ? "border-red-300 focus:border-red-400" : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"}`}
//                     />
//                     {errors[name] && (
//                       <p className="text-xs text-red-500 mt-0.5">
//                         {errors[name]}
//                       </p>
//                     )}
//                   </div>
//                 ))}

//                 {/* Size */}
//                 <div>
//                   <label className="block text-xs text-slate-600 mb-1">
//                     Size
//                   </label>
//                   <div className="grid grid-cols-3 gap-1.5">
//                     {[
//                       ["length", "Length"],
//                       ["width", "Width"],
//                       ["height", "Height"],
//                     ].map(([name, ph]) => (
//                       <input
//                         key={name}
//                         type="text"
//                         name={name}
//                         value={form[name]}
//                         onChange={handleFormChange}
//                         placeholder={ph}
//                         className="w-full px-2 py-2 text-xs border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
//                       />
//                     ))}
//                   </div>
//                 </div>

//                 {/* Select Warehouse */}
//                 <div>
//                   <label className="block text-xs text-slate-600 mb-1">
//                     Select Warehouse
//                   </label>
//                   <div className="relative">
//                     <select
//                       name="warehouse"
//                       value={form.warehouse}
//                       onChange={handleFormChange}
//                       className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
//                     >
//                       {WAREHOUSES.map((w) => (
//                         <option key={w}>{w}</option>
//                       ))}
//                     </select>
//                     <ChevronDown
//                       size={13}
//                       className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Footer */}
//               <div className="flex justify-end gap-3 pt-1">
//                 <button
//                   onClick={() => setShowAddModal(false)}
//                   className="px-6 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   disabled={saving}
//                   className="px-6 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
//                 >
//                   {saving && (
//                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   )}
//                   Save
//                 </button>
//               </div>
//             </div>
//           </div>
//           <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
//         </div>
//       )}
//     </div>
//   );
// }

import { useNavigate } from "react-router-dom";
import { useProductList } from "../hooks/useProductList";
import Topbar from "../../../components/layout/Topbar";
import ProductFilterBar from "./component/ProductFilterBar";
import ProductTable from "./component/ProductTable";
import { AddSkuModal, ConfirmModal } from "./component/ProductModals";

export default function ProductListPage() {
  const navigate = useNavigate();
  const {
    search,
    setSearch,
    warehouseFilter,
    warehouseFilterName,
    handleWarehouseFilterChange,
    productStatus,
    setProductStatus,
    country,
    setCountry,
    sku,
    setSku,
    bulkAction,
    handleBulkAction,
    warehouseOptions,
    statusOptions,
    countryOptions,
    products,
    pagination,
    page,
    setPage,
    listLoading,
    listFetching,
    isListError,
    listError,
    selectedIds,
    toggleSelect,
    toggleAll,
    allSelected,
    someSelected,
    resetFilters,
    hasActiveFilters,
    dropdownsLoading,
    showAddModal,
    setShowAddModal,
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
    isWarehouseError,
    deleteTarget,
    showDeleteModal,
    setShowDeleteModal,
    openDeleteModal,
    confirmDelete,
    deleting,
    bulkDeleteConfirm,
    setBulkDeleteConfirm,
    confirmBulkDelete,
    bulkDeleting,
  } = useProductList();

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Product Management" />

      <ProductFilterBar
        warehouseOptions={warehouseOptions}
        warehouseFilterName={warehouseFilterName}
        handleWarehouseFilterChange={handleWarehouseFilterChange}
        statusOptions={statusOptions}
        productStatus={productStatus}
        setProductStatus={setProductStatus}
        countryOptions={countryOptions}
        country={country}
        setCountry={setCountry}
        sku={sku}
        setSku={setSku}
        setPage={setPage}
        resetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
        dropdownsLoading={dropdownsLoading}
      />

      <ProductTable
        products={products}
        pagination={pagination}
        page={page}
        setPage={setPage}
        listLoading={listLoading}
        listFetching={listFetching}
        isListError={isListError}
        listError={listError}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        toggleAll={toggleAll}
        allSelected={allSelected}
        someSelected={someSelected}
        search={search}
        setSearch={setSearch}
        bulkAction={bulkAction}
        handleBulkAction={handleBulkAction}
        hasActiveFilters={hasActiveFilters}
        resetFilters={resetFilters}
        setShowAddModal={setShowAddModal}
        openDeleteModal={openDeleteModal}
      />

      {showAddModal && (
        <AddSkuModal
          form={form}
          errors={errors}
          fileInputRef={fileInputRef}
          handleFormChange={handleFormChange}
          handlePhotoChange={handlePhotoChange}
          handleWarehouseSelect={handleWarehouseSelect}
          handleSave={handleSave}
          handleCloseModal={handleCloseModal}
          saving={saving}
          warehouseSearch={warehouseSearch}
          setWarehouseSearch={setWarehouseSearch}
          modalWarehouses={modalWarehouses}
          warehouseLoading={warehouseLoading}
          isWarehouseError={isWarehouseError}
        />
      )}

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

      {bulkDeleteConfirm && (
        <ConfirmModal
          title="Delete Selected Products"
          message={
            <>
              Delete{" "}
              <span className="font-semibold text-slate-800">
                {selectedIds.length} product(s)
              </span>
              ?
              <br />
              <span className="text-red-500 text-xs mt-1 block">
                Products used in Combine SKUs or with stock on hand cannot be
                deleted.
              </span>
            </>
          }
          confirmLabel={
            bulkDeleting
              ? "Deleting..."
              : `Delete ${selectedIds.length} Products`
          }
          confirmClass="bg-red-500 hover:bg-red-600 text-white"
          onCancel={() => setBulkDeleteConfirm(false)}
          onConfirm={confirmBulkDelete}
          loading={bulkDeleting}
        />
      )}
    </div>
  );
}
