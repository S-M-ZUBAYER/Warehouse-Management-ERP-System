import { Search, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// SetPermissionModal — store access/work permission for sub-accounts
// ─────────────────────────────────────────────────────────────────────────────
export default function SetPermissionModal({
  open,
  store,
  loading,
  saving,
  onClose,
  search,
  onSearch,
  roleValue,
  onRoleChange,
  roles = [],
  accounts,
  selected,
  editSelected = [],
  onToggle,
  onToggleEdit,
  onConfirm,
}) {
  if (!open) return null;

  const selectedCount = selected?.length || 0;
  const handleAccessToggle = (id) => {
    const isChecked = selected.includes(id);
    onToggle(id);
    if (!isChecked && !editSelected.includes(id)) {
      onToggleEdit(id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{
        background: "rgba(200,210,220,0.55)",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl shadow-xl w-full font-body overflow-hidden"
        style={{ maxWidth: "920px", animation: "popIn 0.18s ease both" }}
      >
        <div className="relative px-8 pt-8 pb-4 text-center">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="absolute right-6 top-6 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
          <h2 className="text-2xl font-semibold text-slate-800 font-display mb-1">
            Set Permission
          </h2>
          <p className="text-sm text-slate-500">
            Select sub-accounts that can access or work with {store?.nickname || store?.marketplace || "this store"}.
          </p>
        </div>

        <div className="mx-8 mt-4 mb-5 p-5 flex items-center rounded-2xl gap-3 border border-surface-border bg-white">
          <select
            className="px-3 py-2 text-sm border border-surface-border rounded-lg text-primary-text outline-none bg-white focus:border-primary min-w-[150px]"
            value={roleValue}
            onChange={(e) => onRoleChange(e.target.value)}
            disabled={loading || saving}
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search sub-account, full name, email, or role"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              disabled={loading || saving}
              className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg
                         text-primary-text placeholder-slate-400 outline-none
                         focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-50"
            />
          </div>
          <button
            type="button"
            className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-60"
            disabled={loading || saving}
          >
            Search
          </button>
        </div>

        <div className="mx-8 mb-6 border rounded-2xl border-surface-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
              <tr className="border-b border-surface-border bg-slate-50/60">
                {['Access', 'Sub-Accounts', 'Full Name', 'Roles'].map((h) => (
                  <th key={h} className="py-3 px-5 text-left text-sm font-semibold text-primary-text">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">Loading permissions...</td>
                </tr>
              )}
              {!loading && accounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">No sub-accounts found</td>
                </tr>
              )}
              {!loading && accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-5">
                    <input
                      type="checkbox"
                      checked={selected.includes(acc.id)}
                      onChange={() => handleAccessToggle(acc.id)}
                      disabled={saving}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-5 text-primary-text">{acc.account}</td>
                  <td className="py-3 px-5 text-primary-text">{acc.fullName}</td>
                  <td className="py-3 px-5 text-primary-text">{acc.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 px-8 py-6 border-t border-surface-border bg-white">
          <p className="text-sm text-slate-500">
            {selectedCount} sub-account{selectedCount === 1 ? "" : "s"} selected
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-12 py-2.5 text-sm font-semibold border border-surface-border
                         rounded-xl text-primary-text bg-white hover:bg-surface-card transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading || saving}
              className="px-12 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark
                         text-white rounded-xl transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Confirm"}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
