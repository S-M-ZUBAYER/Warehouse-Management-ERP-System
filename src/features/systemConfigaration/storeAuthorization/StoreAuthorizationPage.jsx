import { useRef, useState } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  Pencil,
  RefreshCw,
  Link,
  ShieldCheck,
} from "lucide-react";
import Topbar from "../../../components/layout/Topbar";
import { useStoreAuthorization } from "./hooks/useStoreAuthorization";
import AuthStatusBadge from "./component/AuthStatusBadge";
import NicknameModal from "./component/NicknameModal";
import SetPermissionModal from "./component/SetPermissionModal";
import PortalActionMenu from "../../../components/shared/PortalActionMenu";
import RecordDetailModal from "../../../components/shared/RecordDetailModal";
import ConfirmActionModal from "../../../components/shared/ConfirmActionModal";
import { exportRowsToCsv, printRows } from "../../../utils/tableOutput";
import shopeeLogo from "../../../assets/ShopPlatform/shopee.svg";
import lazadaLogo from "../../../assets/ShopPlatform/lazada.svg";
import tiktokLogo from "../../../assets/ShopPlatform/tiktok.svg";
import allCategoryLogo from "../../../assets/ShopPlatform/allCategories.svg";

// ─────────────────────────────────────────────────────────────────────────────
// StoreAuthorizationPage — Images 1, 2, 3, 4, 5
// ─────────────────────────────────────────────────────────────────────────────


export default function StoreAuthorizationPage() {
  const {
    platform,
    setPlatform,
    selectPlatform,
    setSelectPlatform,
    authFilter,
    setAuthFilter,
    search,
    setSearch,
    platforms,
    statuses,
    stores,
    loading,
    error,
    reloadStores,
    selectedIds,
    toggleSelect,
    toggleAll,
    allSelected,
    openActionId,
    setOpenActionId,
    nicknameModal,
    openAddStore,
    openEditStore,
    closeNickname,
    setNickname,
    handleNicknameSubmit,
    permModal,
    permSearch,
    setPermSearch,
    permRole,
    setPermRole,
    permRoles,
    permSelected,
    permEditIds,
    togglePermSub,
    togglePermEdit,
    confirmPerm,
    filteredSubAccounts,
    closePermModal,
    openPermModal,
    unlinkStore,
    unlinkModal,
    closeUnlinkModal,
    confirmUnlinkStore,
  } = useStoreAuthorization();

  const actionRefs = useRef({});
  const [detailStore, setDetailStore] = useState(null);
  const selectedRows = stores.filter((store) => selectedIds.includes(store.id));
  const outputColumns = [
    { label: "Marketplace", key: "marketplace" },
    { label: "Store Nickname", key: "nickname" },
    { label: "Store ID", key: "storeId" },
    { label: "Shop ID", key: "shopId" },
    { label: "Open ID", key: "openId" },
    { label: "Country", key: "country" },
    { label: "Status", key: "authStatus" },
    { label: "Create Time", key: "createdAt" },
  ];

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Store Authorization" />

      {/* ── Platform selector card ── */}
      <div className="bg-white rounded-xl border border-surface-border p-5">
        <div className="flex items-end gap-10">
          {/* Select Platform dropdown */}
          <div className="w-52">
            <p className="text-xs font-semibold text-primary-text mb-1.5">
              Select Platform
            </p>
            <div className="relative">
              <select
                value={selectPlatform}
                onChange={(e) => setSelectPlatform(e.target.value)}
                className="w-full appearance-none px-3 py-2 bg-white border border-surface-border
                           rounded-lg text-sm text-slate-500 outline-none focus:border-primary
                           cursor-pointer pr-8"
              >
                <option value="All">All Platforms</option>
                {["Shopee", "Lazada", "TikTok"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Authorized Platforms radio */}
          <div>
            <p className="text-xs font-semibold text-primary-text mb-4">
              Authorized Platforms
            </p>
            <div className="flex items-center gap-7">
              {platforms.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div
                    onClick={() => setPlatform(p)}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer
                      ${platform === p ? "border-primary" : "border-slate-300 hover:border-slate-400"}`}
                  >
                    {platform === p && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <img
                    className={`text-sm ${p === "All" ? "w-4 h-3" : "w-20 h-6"} text-slate-700 select-none`}
                    src={
                      p === "All"
                        ? allCategoryLogo
                        : p === "Shopee"
                          ? shopeeLogo
                          : p === "Lazada"
                            ? lazadaLogo
                            : tiktokLogo
                    }
                    alt="platform logo"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Authorized Store List card ── */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-xl font-bold text-slate-800 font-display mb-4">
            Authorized Store List
          </h2>

          {/* Toolbar */}
          <div className="flex items-center gap-3">
            {/* Auth Status filter */}
            <div>
              <p className="text-xs font-semibold text-primary-text mb-1">
                Authorization Status
              </p>
              <div className="relative">
                <select
                  value={authFilter}
                  onChange={(e) => setAuthFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg
                             text-primary-text bg-white outline-none focus:border-primary cursor-pointer w-52"
                >
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-4">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 text-sm border border-surface-border rounded-lg w-64
                           text-slate-700 placeholder-slate-400 outline-none bg-white
                           focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            {/* Search button */}
            <button
              type="button"
              onClick={reloadStores}
              className="mt-4 px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              Search
            </button>

            {/* Add Store button */}
            {/* <button
              onClick={openAddStore}
              className="mt-4 ml-auto flex items-center gap-2 px-4 py-2 text-sm font-semibold
                         bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              <Plus size={14} />
              Add Store
            </button> */}
          </div>
        </div>

        {error && (
          <div className="mx-5 mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto z-50">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-surface-border">
                {[
                  "Select All",
                  "Marketplace Name",
                  "Store Nickname",
                  "Store ID",
                  "Country",
                  "Authorization Status",
                  "Create Time",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`py-3 text-left text-lg font-semibold text-primary-text
                    ${i === 0 ? "pl-5 w-14 pr-4" : "pr-4"} ${i === 7 ? "pr-5" : ""}`}
                  >
                    {h === "Select All" ? (
                      <div className="flex justify-start items-center w-32">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = selectedIds.length > 0 && !allSelected;
                            }
                          }}
                          onChange={toggleAll}
                          className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                        />
                        <span className="pl-2">{h}</span>
                      </div>
                    ) : (
                      h
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-500">
                    Loading platform stores...
                  </td>
                </tr>
              )}
              {!loading && stores.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-slate-500">
                    No authorized stores found
                  </td>
                </tr>
              )}
              {!loading && stores.map((store) => (
                <tr
                  key={store.id}
                  className="hover:bg-surface/50 transition-colors"
                >
                  <td className="pl-5 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(store.id)}
                      onChange={() => toggleSelect(store.id)}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {store.marketplace}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">{store.nickname}</td>
                  <td className="py-3 pr-4 text-primary-text font-mono text-xs">
                    {store.storeId}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">{store.country}</td>
                  <td className="py-3 pr-4">
                    <AuthStatusBadge status={store.authStatus} />
                  </td>
                  <td className="py-3 pr-4 text-primary-text text-xs">
                    {store.createdAt}
                  </td>

                  {/* Actions — 3-dot with dropdown */}
                  <td className="py-3 pr-5">
                    <div
                      className="relative"
                      ref={(el) => (actionRefs.current[store.id] = el)}
                    >
                      <button
                        onClick={() =>
                          setOpenActionId(
                            openActionId === store.id ? null : store.id,
                          )
                        }
                        className="flex items-center gap-0.5 p-1.5 rounded-lg text-slate-400
                                   hover:text-primary-text hover:bg-surface-card transition-colors"
                      >
                        {[1, 2, 3].map((d) => (
                          <span
                            key={d}
                            className="w-1 h-1 rounded-full bg-current mx-px"
                          />
                        ))}
                      </button>

                      <PortalActionMenu
                        open={openActionId === store.id}
                        anchorRef={{ current: actionRefs.current[store.id] }}
                        onClose={() => setOpenActionId(null)}
                        width={176}
                      >
                        {[
                          {
                            label: "Details",
                            icon: Search,
                            action: () => {
                              setDetailStore(store);
                              setOpenActionId(null);
                            },
                          },
                          {
                            label: "Edit",
                            icon: Pencil,
                            action: () => {
                              openEditStore(store);
                              setOpenActionId(null);
                            },
                          },
                          // {
                          //   label: "Reauthorization",
                          //   icon: RefreshCw,
                          //   action: () => {
                          //     reloadStores();
                          //     setOpenActionId(null);
                          //   },
                          // },
                          {
                            label: "Set Permission",
                            icon: ShieldCheck,
                            action: () => {
                              openPermModal(store);
                              setOpenActionId(null);
                            },
                          },
                          {
                            label: "Unlink",
                            icon: Link,
                            action: () => {
                              unlinkStore(store);
                              setOpenActionId(null);
                            },
                            danger: true,
                          },
                        ].map(({ label, icon: Icon, action, danger }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={action}
                            className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors ${
                              danger
                                ? "text-red-500 hover:bg-red-50"
                                : "text-slate-700 border-b hover:bg-surface-card"
                            }`}
                          >
                            <Icon
                              size={13}
                              className={danger ? "text-red-400" : "text-slate-400"}
                              strokeWidth={1.8}
                            />
                            {label}
                          </button>
                        ))}
                      </PortalActionMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
          <button onClick={() => exportRowsToCsv(selectedRows, outputColumns, "authorized-stores.csv", "store")} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
            Export <ChevronDown size={13} className="text-slate-400" />
          </button>
          <button onClick={() => printRows(selectedRows, outputColumns, "Selected Authorized Stores", "store")} className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">
            Print
          </button>
        </div>
      </div>

      <RecordDetailModal
        open={!!detailStore}
        title="Store Details"
        subtitle={detailStore?.nickname}
        record={detailStore}
        onClose={() => setDetailStore(null)}
        fields={[
          { label: "Marketplace", key: "marketplace" },
          { label: "Store Nickname", key: "nickname" },
          { label: "Store ID", key: "storeId" },
          { label: "Shop ID", key: "shopId" },
          { label: "Open ID", key: "openId" },
          { label: "Country", key: "country" },
          { label: "Authorization Status", key: "authStatus" },
          { label: "Default Warehouse", key: "defaultWarehouse" },
          { label: "Create Time", key: "createdAt" },
        ]}
      />

      <ConfirmActionModal
        open={unlinkModal?.open}
        title="Unlink Store"
        danger
        loading={unlinkModal?.loading}
        message={<>Are you sure you want to unlink <span className="font-semibold text-slate-800">{unlinkModal?.store?.nickname}</span>? This action cannot be undone.</>}
        confirmLabel="Unlink"
        onCancel={closeUnlinkModal}
        onConfirm={confirmUnlinkStore}
      />

      {/* ── Modals ── */}
      <NicknameModal
        modal={nicknameModal}
        onClose={closeNickname}
        onNicknameChange={setNickname}
        onSubmit={handleNicknameSubmit}
      />
      <SetPermissionModal
        open={permModal.open}
        store={permModal.store}
        loading={permModal.loading}
        saving={permModal.saving}
        onClose={closePermModal}
        search={permSearch}
        onSearch={setPermSearch}
        roleValue={permRole}
        onRoleChange={setPermRole}
        roles={permRoles}
        accounts={filteredSubAccounts}
        selected={permSelected}
        editSelected={permEditIds}
        onToggle={togglePermSub}
        onToggleEdit={togglePermEdit}
        onConfirm={confirmPerm}
      />
    </div>
  );
}
