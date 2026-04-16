// import { useState } from "react";
// import { X, UploadCloud, ChevronDown, Search } from "lucide-react";
// import { useProductList } from "../../productManagement/hooks/useProductList";

// export default function AddMerchantSKUModal() {
//   const {
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

//   const [showWarehousePicker, setShowWarehousePicker] = useState(false);

//   const fields = [
//     {
//       label: "*Product Name",
//       name: "productName",
//       placeholder: "Write product name here",
//     },
//     { label: "*SKU Name", name: "skuName", placeholder: "Write SKU here" },
//     {
//       label: "*Product Details",
//       name: "productDetails",
//       placeholder: "Product details here",
//     },
//     { label: "GTIN", name: "gtin", placeholder: "GTIN here" },
//     { label: "Product Price", name: "productPrice", placeholder: "$0000" },
//     { label: "Weight", name: "weight", placeholder: "Product weight" },
//   ];

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center p-4"
//       style={{
//         background: "rgba(200,210,220,0.55)",
//         backdropFilter: "blur(3px)",
//       }}
//       onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
//     >
//       <div
//         className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden"
//         style={{ maxWidth: "500px", animation: "popIn 0.18s ease both" }}
//       >
//         {/* Header */}
//         <div className="flex items-start justify-between px-7 pt-7 pb-2">
//           <div>
//             <h2 className="text-lg font-bold text-slate-800 font-display">
//               Add Single Merchant SKU
//             </h2>
//             <p className="text-xs text-slate-500 mt-1">
//               Add a new Merchant SKU to your inventory.
//             </p>
//           </div>
//           <button
//             onClick={handleCloseModal}
//             className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-1"
//           >
//             <X size={16} />
//           </button>
//         </div>

//         <div className="px-7 pb-7 space-y-4 max-h-[80vh] overflow-y-auto">
//           {/* Photo upload */}
//           <label className="flex flex-col items-center justify-center border-2 border-dashed border-surface-border rounded-xl py-6 cursor-pointer hover:border-primary/40 transition-colors bg-surface">
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/jpeg,image/png"
//               onChange={handlePhotoChange}
//               className="hidden"
//             />
//             {form.photoPreview ? (
//               <img
//                 src={form.photoPreview}
//                 alt="Preview"
//                 className="w-16 h-16 rounded-full object-cover mb-2"
//               />
//             ) : (
//               <>
//                 <UploadCloud size={28} className="text-slate-400 mb-2" />
//                 <p className="text-sm font-semibold text-slate-700">
//                   Choose a file or drag & drop it here
//                 </p>
//                 <p className="text-xs text-slate-400 mt-0.5">
//                   JPEG or PNG, less than 5MB
//                 </p>
//               </>
//             )}
//             <button
//               type="button"
//               onClick={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 fileInputRef.current?.click();
//               }}
//               className="mt-2 px-5 py-1.5 text-xs font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
//             >
//               Browse File
//             </button>
//           </label>

//           {/* Form fields 2-col */}
//           <div className="grid grid-cols-2 gap-3">
//             {fields.map(({ label, name, placeholder }) => (
//               <div key={name}>
//                 <label className="block text-xs text-slate-600 mb-1">
//                   {label}
//                 </label>
//                 <input
//                   type="text"
//                   name={name}
//                   value={form[name]}
//                   onChange={handleFormChange}
//                   placeholder={placeholder}
//                   className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none transition-all
//                     ${
//                       errors[name]
//                         ? "border-red-300 focus:border-red-400"
//                         : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"
//                     }`}
//                 />
//                 {errors[name] && (
//                   <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>
//                 )}
//               </div>
//             ))}

//             {/* Size */}
//             <div>
//               <label className="block text-xs text-slate-600 mb-1">Size</label>
//               <div className="grid grid-cols-3 gap-1.5">
//                 {[
//                   ["length", "Length"],
//                   ["width", "Width"],
//                   ["height", "Height"],
//                 ].map(([name, ph]) => (
//                   <input
//                     key={name}
//                     type="text"
//                     name={name}
//                     value={form[name]}
//                     onChange={handleFormChange}
//                     placeholder={ph}
//                     className="w-full px-2 py-2 text-xs border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
//                   />
//                 ))}
//               </div>
//             </div>

//             {/* Warehouse picker */}
//             <div className="relative">
//               <label className="block text-xs text-slate-600 mb-1">
//                 Select Warehouse
//               </label>
//               <button
//                 type="button"
//                 onClick={() => setShowWarehousePicker((p) => !p)}
//                 className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg bg-white text-left outline-none transition-all cursor-pointer
//                   ${
//                     errors.warehouseId
//                       ? "border-red-300"
//                       : "border-surface-border focus:border-primary"
//                   }`}
//               >
//                 <span
//                   className={
//                     form.warehouseId ? "text-slate-700" : "text-slate-400"
//                   }
//                 >
//                   {form.warehouseName || "Warehouse name"}
//                 </span>
//                 <ChevronDown
//                   size={13}
//                   className="text-slate-400 flex-shrink-0"
//                 />
//               </button>
//               {errors.warehouseId && (
//                 <p className="text-xs text-red-500 mt-0.5">
//                   {errors.warehouseId}
//                 </p>
//               )}

//               {showWarehousePicker && (
//                 <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-white rounded-xl border border-surface-border shadow-lg overflow-hidden">
//                   <div className="p-2 border-b border-surface-border">
//                     <div className="relative">
//                       <Search
//                         size={12}
//                         className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
//                       />
//                       <input
//                         type="text"
//                         placeholder="Search warehouses..."
//                         value={warehouseSearch}
//                         onChange={(e) => setWarehouseSearch(e.target.value)}
//                         className="w-full pl-7 pr-3 py-1.5 text-xs border border-surface-border rounded-lg outline-none focus:border-primary"
//                         autoFocus
//                       />
//                     </div>
//                   </div>
//                   <div className="max-h-40 overflow-y-auto py-1">
//                     {warehouseLoading ? (
//                       <div className="px-4 py-3 text-xs text-slate-400 text-center">
//                         Loading…
//                       </div>
//                     ) : modalWarehouses.length === 0 ? (
//                       <div className="px-4 py-3 text-xs text-slate-400 text-center">
//                         No warehouses found
//                       </div>
//                     ) : (
//                       modalWarehouses.map((w) => (
//                         <button
//                           key={w.id}
//                           type="button"
//                           onClick={() => {
//                             handleWarehouseSelect(w);
//                             setShowWarehousePicker(false);
//                           }}
//                           className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-surface-card
//                             ${form.warehouseId === String(w.id) ? "text-primary font-semibold bg-primary/5" : "text-slate-700"}`}
//                         >
//                           {w.name}
//                         </button>
//                       ))
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="flex justify-end gap-3 pt-1">
//             <button
//               onClick={handleCloseModal}
//               className="px-6 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSave}
//               disabled={saving}
//               className="px-6 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
//             >
//               {saving && (
//                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//               )}
//               Save
//             </button>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         @keyframes popIn {
//           from { opacity: 0; transform: scale(0.96) translateY(8px); }
//           to   { opacity: 1; transform: scale(1)    translateY(0);   }
//         }
//       `}</style>
//     </div>
//   );
// }

import { useState } from "react";
import { X, UploadCloud, ChevronDown, Search } from "lucide-react";

export default function AddMerchantSKUModal({
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
}) {
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);

  const fields = [
    {
      label: "*Product Name",
      name: "productName",
      placeholder: "Write product name here",
    },
    { label: "*SKU Name", name: "skuName", placeholder: "Write SKU here" },
    {
      label: "*Product Details",
      name: "productDetails",
      placeholder: "Product details here",
    },
    { label: "GTIN", name: "gtin", placeholder: "GTIN here" },
    { label: "Product Price", name: "productPrice", placeholder: "180.00" },
    { label: "Weight", name: "weight", placeholder: "Product weight" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(200,210,220,0.55)",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden"
        style={{ maxWidth: "500px", animation: "popIn 0.18s ease both" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800 font-display">
              Add Single Merchant SKU
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add a new Merchant SKU to your inventory.
            </p>
          </div>
          <button
            onClick={handleCloseModal}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-7 pb-7 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Photo upload */}
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-surface-border rounded-xl py-6 cursor-pointer hover:border-primary/40 transition-colors bg-surface">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {form.photoPreview ? (
              <img
                src={form.photoPreview}
                alt="Preview"
                className="w-16 h-16 rounded-full object-cover mb-2"
              />
            ) : (
              <>
                <UploadCloud size={28} className="text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  Choose a file or drag & drop it here
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  JPEG or PNG, less than 5MB
                </p>
              </>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-2 px-5 py-1.5 text-xs font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
            >
              Browse File
            </button>
          </label>

          {/* Form fields 2-col */}
          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ label, name, placeholder }) => (
              <div key={name}>
                <label className="block text-xs text-slate-600 mb-1">
                  {label}
                </label>
                <input
                  type="text"
                  name={name}
                  value={form[name]}
                  onChange={handleFormChange}
                  placeholder={placeholder}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none transition-all
                    ${
                      errors[name]
                        ? "border-red-300 focus:border-red-400"
                        : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"
                    }`}
                />
                {errors[name] && (
                  <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>
                )}
              </div>
            ))}

            {/* Size */}
            <div>
              <label className="block text-xs text-slate-600 mb-1">Size</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  ["length", "Length"],
                  ["width", "Width"],
                  ["height", "Height"],
                ].map(([name, ph]) => (
                  <input
                    key={name}
                    type="text"
                    name={name}
                    value={form[name]}
                    onChange={handleFormChange}
                    placeholder={ph}
                    className="w-full px-2 py-2 text-xs border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                  />
                ))}
              </div>
            </div>

            {/* Warehouse picker */}
            <div className="relative">
              <label className="block text-xs text-slate-600 mb-1">
                Select Warehouse
              </label>
              <button
                type="button"
                onClick={() => setShowWarehousePicker((p) => !p)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg bg-white text-left outline-none transition-all cursor-pointer
                  ${
                    errors.warehouseId
                      ? "border-red-300"
                      : "border-surface-border focus:border-primary"
                  }`}
              >
                <span
                  className={
                    form.warehouseId ? "text-slate-700" : "text-slate-400"
                  }
                >
                  {form.warehouseName || "Warehouse name"}
                </span>
                <ChevronDown
                  size={13}
                  className="text-slate-400 flex-shrink-0"
                />
              </button>
              {errors.warehouseId && (
                <p className="text-xs text-red-500 mt-0.5">
                  {errors.warehouseId}
                </p>
              )}

              {showWarehousePicker && (
                <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-white rounded-xl border border-surface-border shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-surface-border">
                    <div className="relative">
                      <Search
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Search warehouses..."
                        value={warehouseSearch}
                        onChange={(e) => setWarehouseSearch(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-xs border border-surface-border rounded-lg outline-none focus:border-primary"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto py-1">
                    {warehouseLoading ? (
                      <div className="px-4 py-3 text-xs text-slate-400 text-center">
                        Loading…
                      </div>
                    ) : modalWarehouses.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-slate-400 text-center">
                        No warehouses found
                      </div>
                    ) : (
                      modalWarehouses.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            handleWarehouseSelect(w);
                            setShowWarehousePicker(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-surface-card
                            ${form.warehouseId === String(w.id) ? "text-primary font-semibold bg-primary/5" : "text-slate-700"}`}
                        >
                          {w.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={handleCloseModal}
              className="px-6 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Save
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
}
