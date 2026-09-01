import { AlertCircle, RefreshCw, Search, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { useMemo, useRef, useEffect, useState } from "react";
import Topbar from "../../../components/layout/Topbar";
import { getRolePermissionMap, useRoleManagement } from "./hooks/useRoleManagement";
import AddRoleModal from "./component/AddRoleModal";
import EditRoleModal from "./component/EditRoleModal";
import DeleteRoleModal from "./component/DeleteRoleModal";
import { NestedPageRow } from "./component/NestedPageRow";
import PortalActionMenu from "../../../components/shared/PortalActionMenu";
import RecordDetailModal from "../../../components/shared/RecordDetailModal";
import ListPageSizePagination from "../../../components/shared/ListPageSizePagination";

export default function RoleManagementPage() {
  const {
    search,
    setSearch,
    roles,
    isRolesError,
    rolesLoading,
    rolesError,
    refetchRoles,
    openActionId,
    setOpenActionId,
    showModal,
    openModal,
    closeModal,
    form,
    handleFormChange,
    togglePermission,
    toggleAllPermissions,
    isAllSelected,
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
    toggleAllEditPermissions,
    isEditAllSelected,
    editErrors,
    // ── Delete ──
    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    handleDelete,
    deleting,
  } = useRoleManagement();

  const actionRefs = useRef({});
  const [detailRole, setDetailRole] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeInput, setPageSizeInput] = useState("10");
  const totalRolePages = Math.max(1, Math.ceil(roles.length / pageSize));
  const currentPage = Math.min(page, totalRolePages);
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return roles.slice(start, start + pageSize);
  }, [roles, currentPage, pageSize]);
  const detailPermissionForm = useMemo(
    () => ({ permissions: detailRole ? getRolePermissionMap(detailRole) : { dashboard: true } }),
    [detailRole]
  );
  const applyPageSize = () => {
    const nextPageSize = Math.max(1, Number.parseInt(pageSizeInput, 10) || 10);
    setPageSize(nextPageSize);
    setPageSizeInput(String(nextPageSize));
    setPage(1);
  };

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
          {rolesLoading && <RoleTableSkeleton />}

          {/* ── Error ── */}
          {isRolesError && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertCircle size={36} className="text-red-400 opacity-70" />
              <p className="text-sm font-medium text-slate-700">
                {rolesError?.response?.data?.message ?? rolesError?.message ?? "Failed to load roles"}
              </p>
              <button
                type="button"
                onClick={refetchRoles}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <RefreshCw size={12} /> Retry
              </button>
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
              <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
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
                {paginatedRoles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-surface/50 transition-colors"
                  >
                    <td className="pl-5 py-3.5 pr-4 text-slate-800 font-medium">
                      {role.name}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`text-sm ${String(role.linkStatus || "").toLowerCase().startsWith("linked") ? "text-emerald-600" : "text-slate-500"}`}
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

                        <PortalActionMenu
                          open={openActionId === role.id}
                          anchorRef={{ current: actionRefs.current[role.id] }}
                          onClose={() => setOpenActionId(null)}
                          width={128}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionId(null);
                              setDetailRole(role);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs transition-colors text-slate-700 hover:bg-surface-card"
                          >
                            <Eye size={13} className="text-slate-400" />
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionId(null);
                              openEditModal(role);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs transition-colors text-slate-700 hover:bg-surface-card"
                          >
                            <Pencil size={13} className="text-slate-400" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionId(null);
                              openDeleteModal(role);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs transition-colors text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        </PortalActionMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>{" "}
        <ListPageSizePagination
          page={currentPage}
          limit={pageSize}
          total={roles.length}
          itemLabel="Roles"
          pageSizeInput={pageSizeInput}
          onPageChange={setPage}
          onPageSizeInputChange={setPageSizeInput}
          onApplyPageSize={applyPageSize}
          loading={rolesLoading}
        />
        {/* ✅ closes overflow-x-auto */}
      </div>{" "}
      {/* ✅ closes Roles List card */}
      {/* ── Modals ── */}
      <RecordDetailModal
        open={!!detailRole}
        title="Role Details"
        subtitle={detailRole?.name}
        record={detailRole}
        onClose={() => setDetailRole(null)}
        fields={[
          { label: "Role Name", key: "name" },
          { label: "Sub Account Link", key: "linkStatus" },
          { label: "Description", key: "description" },
          { label: "User Count", key: "userCount" },
          { label: "Create Time", key: "createdAt" },
          { label: "Updated Time", key: "updatedAt" },
        ]}
      >
        <RolePermissionDetails pages={pages} form={detailPermissionForm} />
      </RecordDetailModal>
      <AddRoleModal
        open={showModal}
        onClose={closeModal}
        form={form}
        onChange={handleFormChange}
        togglePermission={togglePermission}
        toggleAllPermissions={toggleAllPermissions}
        isAllSelected={isAllSelected}
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
        toggleAllPermissions={toggleAllEditPermissions}
        isAllSelected={isEditAllSelected}
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

function RolePermissionDetails({ pages = [], form }) {
  if (!pages.length) return null;

  return (
    <div>
      <p className="text-sm font-bold text-slate-800 mb-3">Permissions</p>
      <div className="border border-surface-border rounded-xl overflow-hidden bg-white">
        <div className="max-h-[430px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white [&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
              <tr className="border-b border-surface-border">
                <th className="py-2.5 text-center text-xs font-semibold text-slate-600 w-24">
                  Access
                </th>
                <th className="py-2.5 text-center text-xs font-semibold text-slate-600">
                  Webpage name
                </th>
                <th className="py-2.5 pr-5 text-center text-xs font-semibold text-slate-600 w-16">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {pages.map((page) => (
                <NestedPageRow
                  key={page.id}
                  page={page}
                  form={form}
                  readOnly
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RoleTableSkeleton() {
  return (
    <table className="w-full text-sm font-body">
      <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
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
        {Array.from({ length: 6 }).map((_, index) => (
          <tr key={index} className="animate-pulse">
            <td className="pl-5 py-3.5 pr-4">
              <div className="h-4 w-32 rounded bg-slate-200" />
            </td>
            <td className="py-3.5 pr-4">
              <div className="h-4 w-24 rounded bg-slate-200" />
            </td>
            <td className="py-3.5 pr-4">
              <div className="h-4 w-32 rounded bg-slate-200" />
            </td>
            <td className="py-3.5 pr-4">
              <div className="h-4 w-32 rounded bg-slate-200" />
            </td>
            <td className="py-3.5 pr-5">
              <div className="h-8 w-8 rounded-lg bg-slate-200" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
