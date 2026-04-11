// import { ArrowLeft, UploadCloud, Search, ChevronDown } from "lucide-react";
// import Topbar from "../../../../components/layout/Topbar";

// function FormInput({
//   label,
//   name,
//   value,
//   onChange,
//   placeholder,
//   error,
//   required,
//   type = "text",
// }) {
//   return (
//     <div>
//       <label className="block text-xs font-semibold text-slate-700 mb-1.5">
//         {required && <span className="mr-0.5">*</span>}
//         {label}
//       </label>
//       <input
//         type={type}
//         name={name}
//         value={value}
//         onChange={onChange}
//         placeholder={placeholder}
//         className={`w-full px-3 py-2 text-sm rounded-lg border bg-white placeholder-slate-400
//                     text-slate-700 outline-none transition-all
//                     ${error ? "border-red-300 focus:border-red-400" : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"}`}
//       />
//       {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
//     </div>
//   );
// }

// function FormSelect({
//   label,
//   name,
//   value,
//   onChange,
//   options,
//   placeholder,
//   required,
//   error,
// }) {
//   return (
//     <div>
//       <label className="block text-xs font-semibold text-slate-700 mb-1.5">
//         {required && <span className="mr-0.5">*</span>} {label}
//       </label>
//       <div className="relative">
//         <select
//           name={name}
//           value={value}
//           onChange={onChange}
//           className={`w-full appearance-none px-3 py-2 text-sm rounded-lg border bg-white pr-8
//                       text-slate-700 outline-none transition-all cursor-pointer
//                       ${error ? "border-red-300" : "border-surface-border focus:border-primary"}`}
//         >
//           <option value="">{placeholder}</option>
//           {/* Check if options are objects or strings */}
//           {options.map((o) => {
//             const label = typeof o === "object" ? o.label : o;
//             const val = typeof o === "object" ? o.value : o;
//             return (
//               <option key={val} value={val}>
//                 {label}
//               </option>
//             );
//           })}
//         </select>
//         <ChevronDown
//           size={13}
//           className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
//         />
//       </div>
//       {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
//     </div>
//   );
// }

// export default function AddAccountPage({
//   onBack,
//   form,
//   onChange,
//   onPhotoChange,
//   fileInputRef,
//   onDrop,
//   errors,
//   saving,
//   onSave,
//   storeSearch,
//   setStoreSearch,
//   filteredStores,
//   selectedStores,
//   onToggleStore,
//   warehouseSearch,
//   setWarehouseSearch,
//   filteredWarehouses,
//   selectedWarehouses,
//   onToggleWarehouse,
//   roles,
//   warehouses,
// }) {
//   return (
//     <div className="space-y-4 font-body">
//       <Topbar
//         PageTitle={
//           <span
//             onClick={onBack}
//             className="flex items-center gap-2 cursor-pointer"
//           >
//             <ArrowLeft size={20} />
//             Back to Sub Account
//           </span>
//         }
//       />

//       <div className="grid grid-cols-5 gap-4 items-start">
//         {/* ── LEFT — Basic Information ── */}
//         <div className="col-span-3 bg-white rounded-xl border border-surface-border p-6 space-y-4">
//           <h2 className="text-sm font-bold text-slate-800 font-display">
//             Basic Information
//           </h2>

//           {/* Photo upload */}
//           <div>
//             <p className="text-xs font-semibold text-slate-700 mb-2">
//               *Employee's Photo
//             </p>
//             <label
//               className="flex flex-col items-center justify-center border-2 border-dashed
//              border-surface-border rounded-xl py-8 px-4 cursor-pointer
//              hover:border-primary/40 transition-colors bg-surface"
//               onDragOver={(e) => e.preventDefault()} // ✅ allow drop
//               onDrop={onDrop} // ✅ handle drop
//             >
//               <input
//                 ref={fileInputRef} // ✅ attach ref
//                 type="file"
//                 accept="image/jpeg,image/png"
//                 onChange={onPhotoChange}
//                 className="hidden"
//               />

//               {form.photoPreview ? (
//                 <img
//                   src={form.photoPreview}
//                   alt="preview"
//                   className="w-20 h-20 rounded-full object-cover mb-2"
//                 />
//               ) : (
//                 <>
//                   <UploadCloud size={32} className="text-slate-400 mb-2" />
//                   <p className="text-sm font-semibold text-slate-700">
//                     Choose a file or drag & drop it here
//                   </p>
//                   <p className="text-xs text-slate-400 mt-1">
//                     JPEG or PNG, less than 5MB
//                   </p>
//                 </>
//               )}

//               <button
//                 type="button"
//                 onClick={(e) => {
//                   e.preventDefault(); // ✅ stop label from firing twice
//                   fileInputRef.current.click(); // ✅ manually open file picker
//                 }}
//                 className="mt-3 px-6 py-1.5 text-xs font-semibold border border-surface-border
//                rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
//               >
//                 Browse File
//               </button>
//             </label>
//           </div>

//           {/* Form grid */}
//           <div className="grid grid-cols-2 gap-3">
//             <FormSelect
//               label="Role"
//               name="roleId"
//               value={form.roleId}
//               onChange={onChange}
//               options={roles.map((role) => ({
//                 label: role.name,
//                 value: role.id,
//               }))}
//               placeholder="Select role"
//               required
//               error={errors.roleId}
//             />

//             <FormSelect
//               label="Select Warehouse"
//               name="warehouseId"
//               value={form.warehouseId}
//               onChange={onChange}
//               options={warehouses.map((w) => ({
//                 label: w?.name,
//                 value: w?.id,
//               }))}
//               placeholder="Select warehouse"
//               required
//             />
//             <FormInput
//               label="Account ID"
//               name="accountId"
//               value={form.accountId}
//               onChange={onChange}
//               placeholder="ID here"
//               required
//               error={errors.accountId}
//             />
//             <FormInput
//               label="Password"
//               name="password"
//               type="password"
//               value={form.password}
//               onChange={onChange}
//               placeholder="Account Password here"
//               required
//               error={errors.password}
//             />
//             <FormInput
//               label="Name"
//               name="name"
//               value={form.name}
//               onChange={onChange}
//               placeholder="Name here"
//               required
//               error={errors.name}
//             />
//             <FormInput
//               label="Department"
//               name="department"
//               value={form.department}
//               onChange={onChange}
//               placeholder="Department here"
//               required
//             />
//             <FormInput
//               label="Designation"
//               name="designation"
//               value={form.designation}
//               onChange={onChange}
//               placeholder="Designation here"
//               required
//             />

//             <FormInput
//               label="Phone Number"
//               name="phoneNumber"
//               value={form.phoneNumber}
//               onChange={onChange}
//               placeholder="+00 000.0000 0"
//             />
//             <FormInput
//               label="Email"
//               name="email"
//               type="email"
//               value={form.email}
//               onChange={onChange}
//               placeholder="Write email here"
//             />
//             <FormInput
//               label="Address"
//               name="address"
//               value={form.address || ""}
//               onChange={onChange}
//               placeholder="Address here"
//             />
//           </div>
//         </div>

//         {/* ── RIGHT — Store + Warehouse Permissions ── */}
//         <div className="col-span-2 space-y-4">
//           {/* Store Permissions */}
//           <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
//             <div className="px-5 pt-4 pb-3">
//               <h3 className="text-sm font-bold text-slate-800 font-display mb-3">
//                 Store Permissions
//               </h3>
//               <div className="flex items-center gap-2">
//                 <div>
//                   <p className="text-xs text-slate-500 mb-1">
//                     Select Marketplace
//                   </p>
//                   <select className="appearance-none px-3 py-2 text-xs border border-surface-border rounded-lg bg-white text-slate-700 outline-none pr-7 w-20">
//                     <option>All</option>
//                   </select>
//                 </div>
//                 <div className="relative flex-1 mt-4">
//                   <Search
//                     size={12}
//                     className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
//                   />
//                   <input
//                     type="text"
//                     placeholder="Search"
//                     value={storeSearch}
//                     onChange={(e) => setStoreSearch(e.target.value)}
//                     className="w-full pl-7 pr-3 py-2 text-xs border border-surface-border rounded-lg
//                                text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
//                   />
//                 </div>
//                 <button className="mt-4 px-4 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark">
//                   Search
//                 </button>
//               </div>
//             </div>
//             {/* 1. Wrap the table in a container div */}
//             <div className="max-h-60 overflow-y-auto border border-surface-border ">
//               <table className="w-full text-xs">
//                 <thead className="sticky top-0 z-10 bg-white">
//                   <tr className="border-y border-surface-border bg-surface/50">
//                     <th className="py-2.5 pl-5 text-left font-semibold text-slate-600 w-14">
//                       Select
//                     </th>
//                     <th className="py-2.5 text-left font-semibold text-slate-600">
//                       Marketplace Name
//                     </th>
//                     <th className="py-2.5 pr-5 text-left font-semibold text-slate-600">
//                       Store name
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-surface-border">
//                   {filteredStores.map((s) => (
//                     <tr key={s.id} className="hover:bg-surface/50">
//                       <td className="py-2.5 pl-5">
//                         <input
//                           type="checkbox"
//                           checked={selectedStores.includes(s.id)}
//                           onChange={() => onToggleStore(s.id)}
//                           className="w-3.5 h-3.5 rounded border-slate-300 accent-primary cursor-pointer"
//                         />
//                       </td>
//                       <td className="py-2.5 text-slate-700">{s.marketplace}</td>
//                       <td className="py-2.5 pr-5 text-slate-700">
//                         {s.storeName}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           {/* Warehouse Permissions */}
//           <div className="bg-white rounded-xl border border-surface-border overflow-hidden ">
//             <div className="px-5 pt-4 pb-3">
//               <h3 className="text-sm font-bold text-slate-800 font-display mb-3">
//                 Warehouse Permissions
//               </h3>
//               <div className="flex items-center gap-2">
//                 <div>
//                   <p className="text-xs text-slate-500 mb-1">
//                     Select Warehouse
//                   </p>
//                   <select className="appearance-none px-3 py-2 text-xs border border-surface-border rounded-lg bg-white text-slate-700 outline-none pr-7 w-20">
//                     <option>All</option>
//                   </select>
//                 </div>
//                 <div className="relative flex-1 mt-4">
//                   <Search
//                     size={12}
//                     className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
//                   />
//                   <input
//                     type="text"
//                     placeholder="Search"
//                     value={warehouseSearch}
//                     onChange={(e) => setWarehouseSearch(e.target.value)}
//                     className="w-full pl-7 pr-3 py-2 text-xs border border-surface-border rounded-lg
//                                text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
//                   />
//                 </div>
//                 <button className="mt-4 px-4 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark">
//                   Search
//                 </button>
//               </div>
//             </div>
//             <div className="max-h-44 overflow-y-auto border-t border-surface-border">
//               <table className="w-full text-xs ">
//                 <thead>
//                   <tr className="border-y border-surface-border bg-surface/50">
//                     <th className="py-2.5 pl-5 text-left font-semibold text-slate-600 w-14">
//                       Select
//                     </th>
//                     <th className="py-2.5 pr-5 text-left font-semibold text-slate-600">
//                       Warehouse Name
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-surface-border">
//                   {filteredWarehouses.map((w) => (
//                     <tr key={w.id} className="hover:bg-surface/50">
//                       <td className="py-2.5 pl-5">
//                         <input
//                           type="checkbox"
//                           checked={selectedWarehouses.includes(w.id)}
//                           onChange={() => onToggleWarehouse(w.id)}
//                           className="w-3.5 h-3.5 rounded border-slate-300 accent-primary cursor-pointer"
//                         />
//                       </td>
//                       <td className="py-2.5 pr-5 text-slate-700">{w.name}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="flex justify-end gap-3 pt-1">
//         <button
//           onClick={onBack}
//           className="px-7 py-2.5 text-sm font-semibold border border-surface-border rounded-xl
//                      text-slate-700 bg-white hover:bg-surface-card transition-colors"
//         >
//           Cancel
//         </button>
//         <button
//           onClick={onSave}
//           disabled={saving}
//           className="px-7 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark
//                      text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
//         >
//           {saving && (
//             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//           )}
//           Save
//         </button>
//       </div>
//     </div>
//   );
// }

import { ArrowLeft, UploadCloud, Search, ChevronDown } from "lucide-react";
import Topbar from "../../../../components/layout/Topbar";

function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  required,
  type = "text",
  hint,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {required && <span className="mr-0.5">*</span>}
        {label}
        {hint && (
          <span className="ml-1 font-normal text-slate-400 text-xs">
            {hint}
          </span>
        )}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm rounded-lg border bg-white placeholder-slate-400
                    text-slate-700 outline-none transition-all
                    ${error ? "border-red-300 focus:border-red-400" : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
  error,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {required && <span className="mr-0.5">*</span>} {label}
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full appearance-none px-3 py-2 text-sm rounded-lg border bg-white pr-8
                      text-slate-700 outline-none transition-all cursor-pointer
                      ${error ? "border-red-300" : "border-surface-border focus:border-primary"}`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => {
            const optLabel = typeof o === "object" ? o.label : o;
            const optVal = typeof o === "object" ? o.value : o;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
        <ChevronDown
          size={13}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function AddAccountPage({
  onBack,
  editAccount,
  form,
  onChange,
  onPhotoChange,
  fileInputRef,
  onDrop,
  errors,
  saving,
  onSave,
  storeSearch,
  setStoreSearch,
  filteredStores,
  selectedStores,
  onToggleStore,
  warehouseSearch,
  setWarehouseSearch,
  filteredWarehouses,
  selectedWarehouses,
  onToggleWarehouse,
  roles,
  warehouses,
}) {
  const isEdit = !!editAccount;

  return (
    <div className="space-y-4 font-body">
      <Topbar
        PageTitle={
          <span
            onClick={onBack}
            className="flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={20} />
            {isEdit ? "Edit Sub Account" : "Back to Sub Account"}
          </span>
        }
      />

      <div className="grid grid-cols-5 gap-4 items-start">
        {/* ── LEFT — Basic Information ── */}
        <div className="col-span-3 bg-white rounded-xl border border-surface-border p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 font-display">
            Basic Information
          </h2>

          {/* Photo upload */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">
              *Employee's Photo
            </p>
            <label
              className="flex flex-col items-center justify-center border-2 border-dashed
                         border-surface-border rounded-xl py-8 px-4 cursor-pointer
                         hover:border-primary/40 transition-colors bg-surface"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={onPhotoChange}
                className="hidden"
              />

              {form.photoPreview ? (
                <img
                  src={form.photoPreview}
                  alt="preview"
                  className="w-20 h-20 rounded-full object-cover mb-2"
                />
              ) : (
                <>
                  <UploadCloud size={32} className="text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    Choose a file or drag & drop it here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    JPEG or PNG, less than 5MB
                  </p>
                </>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current.click();
                }}
                className="mt-3 px-6 py-1.5 text-xs font-semibold border border-surface-border
                           rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                {form.photoPreview ? "Change Photo" : "Browse File"}
              </button>
            </label>
          </div>

          {/* API-level error banner */}
          {errors.api && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
              {errors.api}
            </div>
          )}

          {/* Form grid */}
          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              label="Role"
              name="roleId"
              value={form.roleId}
              onChange={onChange}
              options={roles.map((role) => ({
                label: role.name,
                value: String(role.id), // ✅ ensure string to match form state
              }))}
              placeholder="Select role"
              required
              error={errors.roleId}
            />

            <FormSelect
              label="Select Warehouse"
              name="warehouseId"
              value={form.warehouseId}
              onChange={onChange}
              options={warehouses.map((w) => ({
                label: w?.name,
                value: String(w?.id), // ✅ ensure string to match form state
              }))}
              placeholder="Select warehouse"
            />

            <FormInput
              label="Account ID"
              name="accountId"
              value={form.accountId}
              onChange={onChange}
              placeholder="ID here"
              required
              error={errors.accountId}
            />

            {/* Password: required on create, optional on edit */}
            <FormInput
              label="Password(LogIn & Sub Account Keep Same)"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              placeholder={
                isEdit
                  ? "Leave blank to keep current Password"
                  : "Account Password here"
              }
              required={!isEdit}
              hint={isEdit ? "(optional)" : undefined}
              error={errors.password}
            />

            <FormInput
              label="Name"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Name here"
              required
              error={errors.name}
            />

            <FormInput
              label="Department"
              name="department"
              value={form.department}
              onChange={onChange}
              placeholder="Department here"
            />

            <FormInput
              label="Designation"
              name="designation"
              value={form.designation}
              onChange={onChange}
              placeholder="Designation here"
            />

            <FormInput
              label="Phone Number"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={onChange}
              placeholder="+00 000.0000 0"
            />

            <FormInput
              label="Email(LogIn & Sub Account Use Same)"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder={
                isEdit
                  ? "Leave blank to keep current Email"
                  : "Write email here"
              }
            />

            <FormInput
              label="Address"
              name="address"
              value={form.address || ""}
              onChange={onChange}
              placeholder="Address here"
            />
          </div>
        </div>

        {/* ── RIGHT — Store + Warehouse Permissions ── */}
        <div className="col-span-2 space-y-4">
          {/* Store Permissions */}
          <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
            <div className="px-5 pt-4 pb-3">
              <h3 className="text-sm font-bold text-slate-800 font-display mb-3">
                Store Permissions
              </h3>
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    Select Marketplace
                  </p>
                  <select className="appearance-none px-3 py-2 text-xs border border-surface-border rounded-lg bg-white text-slate-700 outline-none pr-7 w-20">
                    <option>All</option>
                  </select>
                </div>
                <div className="relative flex-1 mt-4">
                  <Search
                    size={12}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search"
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs border border-surface-border rounded-lg
                               text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                  />
                </div>
                <button className="mt-4 px-4 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark">
                  Search
                </button>
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto border border-surface-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-y border-surface-border bg-surface/50">
                    <th className="py-2.5 pl-5 text-left font-semibold text-slate-600 w-14">
                      Select
                    </th>
                    <th className="py-2.5 text-left font-semibold text-slate-600">
                      Marketplace Name
                    </th>
                    <th className="py-2.5 pr-5 text-left font-semibold text-slate-600">
                      Store name
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredStores.map((s) => (
                    <tr key={s.id} className="hover:bg-surface/50">
                      <td className="py-2.5 pl-5">
                        <input
                          type="checkbox"
                          checked={selectedStores.includes(s.id)}
                          onChange={() => onToggleStore(s.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 text-slate-700">{s.marketplace}</td>
                      <td className="py-2.5 pr-5 text-slate-700">
                        {s.storeName}
                      </td>
                    </tr>
                  ))}
                  {filteredStores.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-6 text-center text-slate-400 text-xs"
                      >
                        No stores found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {selectedStores.length > 0 && (
              <div className="px-5 py-2 border-t border-surface-border bg-surface/30">
                <span className="text-xs text-primary font-semibold">
                  {selectedStores.length} store
                  {selectedStores.length > 1 ? "s" : ""} selected
                </span>
              </div>
            )}
          </div>

          {/* Warehouse Permissions */}
          <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
            <div className="px-5 pt-4 pb-3">
              <h3 className="text-sm font-bold text-slate-800 font-display mb-3">
                Warehouse Permissions
              </h3>
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    Select Warehouse
                  </p>
                  <select className="appearance-none px-3 py-2 text-xs border border-surface-border rounded-lg bg-white text-slate-700 outline-none pr-7 w-20">
                    <option>All</option>
                  </select>
                </div>
                <div className="relative flex-1 mt-4">
                  <Search
                    size={12}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search"
                    value={warehouseSearch}
                    onChange={(e) => setWarehouseSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs border border-surface-border rounded-lg
                               text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                  />
                </div>
                <button className="mt-4 px-4 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark">
                  Search
                </button>
              </div>
            </div>
            <div className="max-h-44 overflow-y-auto border-t border-surface-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-y border-surface-border bg-surface/50">
                    <th className="py-2.5 pl-5 text-left font-semibold text-slate-600 w-14">
                      Select
                    </th>
                    <th className="py-2.5 pr-5 text-left font-semibold text-slate-600">
                      Warehouse Name
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredWarehouses.map((w) => (
                    <tr key={w.id} className="hover:bg-surface/50">
                      <td className="py-2.5 pl-5">
                        <input
                          type="checkbox"
                          checked={selectedWarehouses.includes(w.id)}
                          onChange={() => onToggleWarehouse(w.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 pr-5 text-slate-700">{w.name}</td>
                    </tr>
                  ))}
                  {filteredWarehouses.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="py-6 text-center text-slate-400 text-xs"
                      >
                        No warehouses found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {selectedWarehouses.length > 0 && (
              <div className="px-5 py-2 border-t border-surface-border bg-surface/30">
                <span className="text-xs text-primary font-semibold">
                  {selectedWarehouses.length} warehouse
                  {selectedWarehouses.length > 1 ? "s" : ""} selected
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-1">
        <button
          onClick={onBack}
          className="px-7 py-2.5 text-sm font-semibold border border-surface-border rounded-xl
                     text-slate-700 bg-white hover:bg-surface-card transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-7 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark
                     text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {saving && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {isEdit ? "Update" : "Save"}
        </button>
      </div>
    </div>
  );
}
