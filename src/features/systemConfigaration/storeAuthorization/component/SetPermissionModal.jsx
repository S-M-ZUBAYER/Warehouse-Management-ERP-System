import { Search } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// SetPermissionModal — image 5
// Sub-Accounts dropdown | All Roles dropdown | Search + Search btn
// Table: Select | Sub-Accounts | Full Name | Roles
// Footer: Cancel | Confirm
// ─────────────────────────────────────────────────────────────────────────────
export default function SetPermissionModal({
  open,
  onClose,
  search,
  onSearch,
  accounts,
  selected,
  onToggle,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(200,210,220,0.55)",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-3xl shadow-xl w-full font-body"
        style={{ maxWidth: "1000px", animation: "popIn 0.18s ease both" }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <h2 className="text-lg font-bold text-slate-800 font-display mb-1">
            Set Permission
          </h2>
          <p className="text-xs text-slate-500">
            The selected sub-accounts have permission to view store data
          </p>
        </div>

        {/* Filter bar */}
        <div className="px-8 mb-8 mx-6 py-8 flex items-center rounded-2xl gap-2 border border-surface-card ">
          <select className="px-3 py-2 text-sm border border-surface-border rounded-lg text-primary-text outline-none bg-white focus:border-primary">
            <option>Sub-Accounts</option>
          </select>
          <select className="px-3 py-2 text-sm border border-surface-border rounded-lg text-primary-text outline-none bg-white focus:border-primary">
            <option>All Roles</option>
          </select>
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-surface-border rounded-lg
                         text-primary-text placeholder-slate-400 outline-none
                         focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <button className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
            Search
          </button>
        </div>

        {/* Table */}
        <div className="px-8 mx-6 py-6 border rounded-2xl border-surface-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {["Select", "Sub-Accounts", "Full Name", "Roles"].map((h) => (
                  <th
                    key={h}
                    className="py-3 text-left text-[16px] font-semibold text-slate-600 pr-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {accounts.map((acc) => (
                <tr
                  key={acc.id}
                  className="hover:bg-surface/50 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(acc.id)}
                      onChange={() => onToggle(acc.id)}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                  </td>
                  <td className="py-3 pr-4 text-primary-text">{acc.account}</td>
                  <td className="py-3 pr-4 text-primary-text">
                    {acc.fullName}
                  </td>
                  <td className="py-3 text-primary-text">{acc.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-4 px-8 py-5 ">
          <button
            onClick={onClose}
            className="px-10 py-2.5 text-sm font-semibold border border-surface-border
                       rounded-xl text-primary-text bg-white hover:bg-surface-card transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-10 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark
                       text-white rounded-xl transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
