import { Search, Plus } from "lucide-react";
import { useRef, useEffect } from "react";
import Topbar from "../../../components/layout/Topbar";
import { useRoleManagement } from "./hooks/useRoleManagement";
import AddRoleModal from "./component/AddRoleModal";
import EditRoleModal from "./component/EditRoleModal";
import DeleteRoleModal from "./component/DeleteRoleModal";

export default function RoleManagementPage() {
  const {
    search,
    setSearch,
    roles,
    isRolesError,
    rolesLoading,
    rolesError,
    openActionId,
    setOpenActionId,
    showModal,
    openModal,
    closeModal,
    form,
    handleFormChange,
    togglePermission,
    errors,
    saving,
    handleAdd,
    pages,
    // ── Edit ──
    editModal,
    openEditModal,
    closeEditModal,
    handleEdit,
    editSaving,
    editForm,
    handleEditFormChange,
    toggleEditPermission,
    editErrors,
    // ── Delete ──
    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    handleDelete,
    deleting,
  } = useRoleManagement();

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

  return (
    <div className=" font-body">
      <Topbar PageTitle="Role Management" />
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
      {/* Roles List card */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-slate-800 font-display">
            Roles List
          </h2>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                       bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <Plus size={14} />
            Add Role
          </button>
        </div>
        <div className="overflow-x-auto">
          {/* ── Loading ── */}
          {rolesLoading && (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
              Loading roles...
            </div>
          )}

          {/* ── Error ── */}
          {isRolesError && (
            <div className="flex items-center justify-center py-16 text-red-500 text-sm">
              {rolesError?.message ?? "Failed to load roles"}
            </div>
          )}

          {/* ── Empty ── */}
          {!rolesLoading && !isRolesError && roles.length === 0 && (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
              {search.trim()
                ? `No roles found for "${search}"`
                : "No roles found"}
            </div>
          )}

          {/* ── Table ── */}
          {!rolesLoading && !isRolesError && roles.length > 0 && (
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-surface-border">
                  {[
                    { label: "Role Name", cls: "pl-5 w-[22%]" },
                    { label: "Sub Account Linking Status", cls: "w-[22%]" },
                    { label: "Create Time", cls: "w-[22%]" },
                    { label: "Updated Time", cls: "w-[22%]" },
                    { label: "Actions", cls: "pr-5 w-[12%]" },
                  ].map(({ label, cls }) => (
                    <th
                      key={label}
                      className={`py-3 text-left text-xs font-semibold text-slate-600 pr-4 ${cls}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-surface/50 transition-colors"
                  >
                    <td className="pl-5 py-3.5 pr-4 text-slate-800 font-medium">
                      {role.name}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`text-sm ${role.linkStatus === "Linked" ? "text-emerald-600" : "text-slate-500"}`}
                      >
                        {role.linkStatus ?? "—"}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-500 text-xs">
                      {role.createdAt ?? "—"}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-500 text-xs">
                      {role.updatedAt ?? "—"}
                    </td>

                    {/* Actions — 3-dot */}
                    <td className="py-3.5 pr-5">
                      <div
                        className="relative"
                        ref={(el) => (actionRefs.current[role.id] = el)}
                      >
                        <button
                          onClick={() =>
                            setOpenActionId(
                              openActionId === role.id ? null : role.id,
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

                        {openActionId === role.id && (
                          <div
                            className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl
                                                       border border-surface-border shadow-lg py-1 w-32"
                          >
                            <button
                              onClick={() => openEditModal(role)}
                              className="w-full text-left px-4 py-2 text-xs transition-colors
                                                           text-slate-700 hover:bg-surface-card"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(role)}
                              className="w-full text-left px-4 py-2 text-xs transition-colors
                                                           text-red-500 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>{" "}
        {/* ✅ closes overflow-x-auto */}
      </div>{" "}
      {/* ✅ closes Roles List card */}
      {/* ── Modals ── */}
      <AddRoleModal
        open={showModal}
        onClose={closeModal}
        form={form}
        onChange={handleFormChange}
        togglePermission={togglePermission}
        errors={errors}
        saving={saving}
        onAdd={handleAdd}
        pages={pages}
      />
      <EditRoleModal
        open={editModal.open}
        onClose={closeEditModal}
        form={editForm}
        onChange={handleEditFormChange}
        togglePermission={toggleEditPermission}
        errors={editErrors}
        saving={editSaving}
        onSave={handleEdit}
        pages={pages}
      />
      <DeleteRoleModal
        open={deleteModal.open}
        role={deleteModal.role}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
