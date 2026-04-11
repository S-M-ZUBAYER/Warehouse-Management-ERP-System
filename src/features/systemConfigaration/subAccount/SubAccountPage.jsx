// import { Search, Plus, Pencil, Trash2 } from "lucide-react";
// import { useRef, useEffect } from "react";
// import Topbar from "../../../components/layout/Topbar";
// import { useSubAccount } from "./hooks/useSubAccount";
// import AddAccountPage from "./component/AddAccountPage";

// export default function SubAccountPage() {
//   const {
//     search,
//     setSearch,
//     cleanAvatar,
//     accounts,
//     accountLoading,
//     accountError,
//     editAccount,
//     handleEditClick,
//     selectedIds,
//     toggleSelect,
//     openActionId,
//     setOpenActionId,
//     showAddPage,
//     setShowAddPage,
//     form,
//     handleFormChange,
//     handlePhotoChange,
//     fileInputRef,
//     handleDropChange,
//     errors,
//     saving,
//     handleSave,
//     storeSearch,
//     setStoreSearch,
//     warehouseSearch,
//     setWarehouseSearch,
//     storeMarketplace,
//     setStoreMarketplace,
//     filteredStores,
//     filteredWarehouses,
//     selectedStores,
//     selectedWarehouses,
//     toggleStore,
//     toggleWarehouse,
//     roles,
//     warehouses,
//     deleteTarget,
//     setDeleteTarget,
//     deleting,
//     handleAccountDelete,
//   } = useSubAccount();

//   const actionRefs = useRef({});

//   useEffect(() => {
//     const handler = (e) => {
//       if (openActionId !== null) {
//         const ref = actionRefs.current[openActionId];
//         if (ref && !ref.contains(e.target)) setOpenActionId(null);
//       }
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, [openActionId]);

//   // Show Add Account page when needed
//   if (showAddPage) {
//     return (
//       <AddAccountPage
//         onBack={() => setShowAddPage(false)}
//         form={form}
//         onChange={handleFormChange}
//         onPhotoChange={handlePhotoChange}
//         onDrop={handleDropChange}
//         fileInputRef={fileInputRef}
//         errors={errors}
//         saving={saving}
//         onSave={handleSave}
//         storeSearch={storeSearch}
//         setStoreSearch={setStoreSearch}
//         filteredStores={filteredStores}
//         selectedStores={selectedStores}
//         onToggleStore={toggleStore}
//         warehouseSearch={warehouseSearch}
//         setWarehouseSearch={setWarehouseSearch}
//         filteredWarehouses={filteredWarehouses}
//         selectedWarehouses={selectedWarehouses}
//         onToggleWarehouse={toggleWarehouse}
//         roles={roles}
//         warehouses={warehouses}
//       />
//     );
//   }

//   return (
//     <div className="space-y-4 font-body">
//       <Topbar PageTitle="Sub Account" />

//       {/* Search bar */}
//       <div className="bg-white rounded-xl border border-surface-border p-7 flex items-center gap-3">
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
//                        text-slate-700 placeholder-slate-400 outline-none bg-white
//                        focus:border-primary focus:ring-2 focus:ring-primary/10"
//           />
//         </div>
//         <button className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
//           Search
//         </button>
//       </div>

//       {/* Sub Account List card */}
//       <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
//         <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
//           <h2 className="text-base font-bold text-slate-800 font-display">
//             Sub Account List
//           </h2>
//           <button
//             onClick={() => setShowAddPage(true)}
//             className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
//                        bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
//           >
//             <Plus size={14} />
//             Add Account
//           </button>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full text-sm font-body">
//             <thead>
//               <tr className="border-b border-surface-border">
//                 {[
//                   "Select",
//                   "Image",
//                   "Name",
//                   "ID",
//                   "Role",
//                   "Create Time",
//                   "Actions",
//                 ].map((h, i) => (
//                   <th
//                     key={h}
//                     className={`py-4 text-left text-xs font-semibold text-slate-600
//                       ${i === 0 ? "pl-5 w-14" : "pr-4"} ${i === 6 ? "pr-5" : ""}`}
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-surface-border ">
//               {accountLoading && (
//                 <tr>
//                   <td colSpan={7} className="text-center py-8 text-slate-400">
//                     Loading accounts...
//                   </td>
//                 </tr>
//               )}

//               {accountError && (
//                 <tr>
//                   <td colSpan={7} className="text-center py-8 text-red-400">
//                     Failed to load accounts.
//                   </td>
//                 </tr>
//               )}

//               {!accountLoading &&
//                 accounts.map((acc) => (
//                   <tr
//                     key={acc.id}
//                     className="hover:bg-surface/50 transition-colors"
//                   >
//                     <td className="pl-5 py-2">
//                       <input
//                         type="checkbox"
//                         checked={selectedIds.includes(acc.id)}
//                         onChange={() => toggleSelect(acc.id)}
//                         className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                       />
//                     </td>

//                     {/* avatar_url from API, fallback to ui-avatars */}
//                     <td className="py-2 pr-4">
//                       <img
//                         src={
//                           cleanAvatar(acc.avatar_url) ||
//                           `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&size=32&background=004368&color=fff`
//                         }
//                         alt={acc.name}
//                         className="w-8 h-8 rounded-full object-cover border border-surface-border"
//                         onError={(e) => {
//                           e.target.onerror = null;
//                           e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&size=32&background=004368&color=fff`;
//                         }}
//                       />
//                     </td>

//                     {/* name */}
//                     <td className="py-2 pr-4 text-slate-800 font-medium">
//                       {acc.name}
//                     </td>

//                     {/* account_id (was acc.accountId in mock) */}
//                     <td className="py-2 pr-4 text-slate-600 font-mono text-xs">
//                       {acc.account_id}
//                     </td>

//                     {/* role name from roleInfo (was acc.role string in mock) */}
//                     <td className="py-2 pr-4 text-slate-600">
//                       {acc.roleInfo?.name ?? "—"}
//                     </td>

//                     {/* createdAt formatted */}
//                     <td className="py-2 pr-4 text-slate-500 text-xs">
//                       {new Date(acc.createdAt).toLocaleString("en-GB", {
//                         day: "2-digit",
//                         month: "short",
//                         year: "numeric",
//                         hour: "2-digit",
//                         minute: "2-digit",
//                       })}
//                     </td>

//                     {/* Actions */}
//                     <td className="py-2 pr-5">
//                       <div
//                         className="relative"
//                         ref={(el) => (actionRefs.current[acc.id] = el)}
//                       >
//                         <button
//                           onClick={() =>
//                             setOpenActionId(
//                               openActionId === acc.id ? null : acc.id,
//                             )
//                           }
//                           className="flex items-center gap-0.5 p-1.5 rounded-lg text-slate-400
//                                hover:text-slate-600 hover:bg-surface-card transition-colors"
//                         >
//                           {[1, 2, 3].map((d) => (
//                             <span
//                               key={d}
//                               className="w-1 h-1 rounded-full bg-current mx-px"
//                             />
//                           ))}
//                         </button>

//                         {openActionId === acc.id && (
//                           <div
//                             className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl
//                                     border border-surface-border shadow-lg py-1 w-32"
//                           >
//                             <button
//                               className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs
//                                        text-slate-700 hover:bg-surface-card transition-colors"
//                               onClick={() => {
//                                 handleEditClick(acc);
//                                 setOpenActionId(null);
//                               }}
//                             >
//                               <Pencil size={12} className="text-slate-400" />{" "}
//                               Edit
//                             </button>
//                             <button
//                               className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs
//                text-red-500 hover:bg-red-50 transition-colors"
//                               onClick={() => {
//                                 setDeleteTarget({ id: acc.id, name: acc.name });
//                                 setOpenActionId(null);
//                               }}
//                             >
//                               <Trash2 size={12} /> Delete
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//       {deleteTarget && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
//           <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
//             {/* Icon */}
//             <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
//               <Trash2 size={22} className="text-red-500" />
//             </div>

//             {/* Text */}
//             <h2 className="text-center text-slate-800 font-semibold text-base mb-1">
//               Delete Account
//             </h2>
//             <p className="text-center text-slate-500 text-sm mb-6">
//               Are you sure you want to delete{" "}
//               <span className="font-semibold text-slate-700">
//                 {deleteTarget.name}
//               </span>
//               ? This action cannot be undone.
//             </p>

//             {/* Buttons */}
//             <div className="flex gap-3">
//               <button
//                 onClick={() => setDeleteTarget(null)}
//                 disabled={deleting}
//                 className="flex-1 px-4 py-2 rounded-xl border border-surface-border
//                                text-slate-600 text-sm hover:bg-surface-card transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAccountDelete}
//                 disabled={deleting}
//                 className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm
//                                hover:bg-red-600 transition-colors disabled:opacity-60"
//               >
//                 {deleting ? "Deleting..." : "Confirm"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {showAddPage && (
//         <AddAccountPage
//           onBack={() => setShowAddPage(false)}
//           editAccount={editAccount}
//           form={form}
//           onChange={handleFormChange}
//           onPhotoChange={handlePhotoChange}
//           onDrop={handleDropChange}
//           fileInputRef={fileInputRef}
//           errors={errors}
//           saving={saving}
//           onSave={handleSave}
//           storeSearch={storeSearch}
//           setStoreSearch={setStoreSearch}
//           filteredStores={filteredStores}
//           selectedStores={selectedStores}
//           onToggleStore={toggleStore}
//           warehouseSearch={warehouseSearch}
//           setWarehouseSearch={setWarehouseSearch}
//           filteredWarehouses={filteredWarehouses}
//           selectedWarehouses={selectedWarehouses}
//           onToggleWarehouse={toggleWarehouse}
//           roles={roles}
//           warehouses={warehouses}
//         />
//       )}
//     </div>
//   );
// }

import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { useRef, useEffect } from "react";
import Topbar from "../../../components/layout/Topbar";
import { useSubAccount } from "./hooks/useSubAccount";
import AddAccountPage from "./component/AddAccountPage";

export default function SubAccountPage() {
  const {
    search,
    setSearch,
    cleanAvatar,
    accounts,
    accountLoading,
    accountError,
    editAccount,
    handleEditClick,
    handleOpenAdd, // ✅ replaces () => setShowAddPage(true)
    handleBack, // ✅ replaces () => setShowAddPage(false)
    selectedIds,
    toggleSelect,
    openActionId,
    setOpenActionId,
    showAddPage,
    form,
    handleFormChange,
    handlePhotoChange,
    fileInputRef,
    handleDropChange,
    errors,
    saving,
    handleSave,
    storeSearch,
    setStoreSearch,
    warehouseSearch,
    setWarehouseSearch,
    storeMarketplace,
    setStoreMarketplace,
    filteredStores,
    filteredWarehouses,
    selectedStores,
    selectedWarehouses,
    toggleStore,
    toggleWarehouse,
    roles,
    warehouses,
    deleteTarget,
    setDeleteTarget,
    deleting,
    handleAccountDelete,
  } = useSubAccount();

  const actionRefs = useRef({});

  useEffect(() => {
    const handler = (e) => {
      if (openActionId !== null) {
        const ref = actionRefs.current[openActionId];
        if (ref && !ref.contains(e.target)) setOpenActionId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openActionId]);

  // Show Add / Edit page
  if (showAddPage) {
    return (
      <AddAccountPage
        onBack={handleBack} // ✅ full reset on back
        editAccount={editAccount} // ✅ null = create, object = edit
        form={form}
        onChange={handleFormChange}
        onPhotoChange={handlePhotoChange}
        onDrop={handleDropChange}
        fileInputRef={fileInputRef}
        errors={errors}
        saving={saving}
        onSave={handleSave}
        storeSearch={storeSearch}
        setStoreSearch={setStoreSearch}
        filteredStores={filteredStores}
        selectedStores={selectedStores}
        onToggleStore={toggleStore}
        warehouseSearch={warehouseSearch}
        setWarehouseSearch={setWarehouseSearch}
        filteredWarehouses={filteredWarehouses}
        selectedWarehouses={selectedWarehouses}
        onToggleWarehouse={toggleWarehouse}
        roles={roles}
        warehouses={warehouses}
      />
    );
  }

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Sub Account" />

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-surface-border p-7 flex items-center gap-3">
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
                       text-slate-700 placeholder-slate-400 outline-none bg-white
                       focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <button className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
          Search
        </button>
      </div>

      {/* Sub Account List card */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-slate-800 font-display">
            Sub Account List
          </h2>
          {/* ✅ Use handleOpenAdd — resets editAccount + form before opening */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                       bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <Plus size={14} />
            Add Account
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-surface-border">
                {[
                  "Select",
                  "Image",
                  "Name",
                  "ID",
                  "Role",
                  "Create Time",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`py-4 text-left text-xs font-semibold text-slate-600
                      ${i === 0 ? "pl-5 w-14" : "pr-4"} ${i === 6 ? "pr-5" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {accountLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Loading accounts...
                  </td>
                </tr>
              )}

              {accountError && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-red-400">
                    Failed to load accounts.
                  </td>
                </tr>
              )}

              {!accountLoading &&
                accounts.map((acc) => (
                  <tr
                    key={acc.id}
                    className="hover:bg-surface/50 transition-colors"
                  >
                    <td className="pl-5 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(acc.id)}
                        onChange={() => toggleSelect(acc.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                      />
                    </td>

                    <td className="py-2 pr-4">
                      <img
                        src={
                          cleanAvatar(acc.avatar_url) ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&size=32&background=004368&color=fff`
                        }
                        alt={acc.name}
                        className="w-8 h-8 rounded-full object-cover border border-surface-border"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&size=32&background=004368&color=fff`;
                        }}
                      />
                    </td>

                    <td className="py-2 pr-4 text-slate-800 font-medium">
                      {acc.name}
                    </td>

                    <td className="py-2 pr-4 text-slate-600 font-mono text-xs">
                      {acc.account_id}
                    </td>

                    <td className="py-2 pr-4 text-slate-600">
                      {acc.roleInfo?.name ?? "—"}
                    </td>

                    <td className="py-2 pr-4 text-slate-500 text-xs">
                      {new Date(acc.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-2 pr-5">
                      <div
                        className="relative"
                        ref={(el) => (actionRefs.current[acc.id] = el)}
                      >
                        <button
                          onClick={() =>
                            setOpenActionId(
                              openActionId === acc.id ? null : acc.id,
                            )
                          }
                          className="flex items-center gap-0.5 p-1.5 rounded-lg text-slate-400
                               hover:text-slate-600 hover:bg-surface-card transition-colors"
                        >
                          {[1, 2, 3].map((d) => (
                            <span
                              key={d}
                              className="w-1 h-1 rounded-full bg-current mx-px"
                            />
                          ))}
                        </button>

                        {openActionId === acc.id && (
                          <div
                            className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl
                                    border border-surface-border shadow-lg py-1 w-32"
                          >
                            {/* ✅ Edit button calls handleEditClick with the full account */}
                            <button
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs
                                       text-slate-700 hover:bg-surface-card transition-colors"
                              onClick={() => {
                                handleEditClick(acc);
                                setOpenActionId(null);
                              }}
                            >
                              <Pencil size={12} className="text-slate-400" />
                              Edit
                            </button>
                            <button
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs
                                         text-red-500 hover:bg-red-50 transition-colors"
                              onClick={() => {
                                setDeleteTarget({ id: acc.id, name: acc.name });
                                setOpenActionId(null);
                              }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>

            <h2 className="text-center text-slate-800 font-semibold text-base mb-1">
              Delete Account
            </h2>
            <p className="text-center text-slate-500 text-sm mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-700">
                {deleteTarget.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-xl border border-surface-border
                               text-slate-600 text-sm hover:bg-surface-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAccountDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm
                               hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
