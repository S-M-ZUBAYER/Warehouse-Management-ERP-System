// ─────────────────────────────────────────────────────────────────────────────
// NicknameModal — Store Authorization edit nickname modal
// ─────────────────────────────────────────────────────────────────────────────
export default function NicknameModal({
  modal,
  onClose,
  onNicknameChange,
  onSubmit,
}) {
  const { open, store, nickname, saving } = modal;
  if (!open) return null;

  const storeName = store?.marketplace || "Store name";

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
        className="bg-white rounded-2xl shadow-xl w-full font-body"
        style={{ maxWidth: "410px", animation: "popIn 0.18s ease both" }}
      >
        <div className="px-9 pt-8 pb-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 font-display mb-2">
              Edit Store Nickname
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mx-auto max-w-xs">
              This nickname will be shown in the store list and is required to continue.
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Store Name</p>
            <p className="text-base font-semibold text-slate-900">{storeName}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              *Input Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => onNicknameChange(e.target.value)}
              placeholder="Store Nickname here"
              disabled={saving}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-surface-border
                         bg-white text-slate-700 placeholder-slate-400 outline-none transition-all
                         focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-slate-50"
            />
          </div>

          <button
            onClick={onSubmit}
            disabled={saving}
            className="w-full py-3 rounded-lg text-sm font-semibold bg-primary
                       hover:bg-primary-dark text-white transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
