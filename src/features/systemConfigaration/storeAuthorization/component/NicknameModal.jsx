// ─────────────────────────────────────────────────────────────────────────────
// NicknameModal — "Edit Store Nickname" modal (images 2 & 4)
// Image 2 (Add mode): "Continue" full-width button
// Image 4 (Edit mode): "Cancel" + "Save" split buttons
// ─────────────────────────────────────────────────────────────────────────────
export default function NicknameModal({
  modal,
  onClose,
  onNicknameChange,
  onSubmit,
}) {
  const { open, mode, store, nickname } = modal;
  if (!open) return null;

  const isEdit = mode === "edit";
  const storeName = store?.marketplace || "Store name";

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
        className="bg-white rounded-2xl shadow-xl w-full font-body"
        style={{ maxWidth: "360px", animation: "popIn 0.18s ease both" }}
      >
        <div className="px-8 pt-8 pb-7 space-y-5">
          {/* Title + subtitle */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary-text font-display mb-1.5">
              Edit Store Nickname
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              This nickname will be shown in the store list and is required to
              continue.
            </p>
          </div>

          {/* Store Name label */}
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Store Name</p>
            <p className="text-[16px] font-semibold text-primary-text">
              {storeName}
            </p>
          </div>

          {/* Nickname input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <span className="text-slate-700">*</span>Input Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => onNicknameChange(e.target.value)}
              placeholder={isEdit ? "Store name1" : "Store Nickname here"}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-surface-border
                         bg-white text-slate-700 placeholder-slate-400 outline-none transition-all
                         focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Buttons */}
          {isEdit ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border
                           text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary
                           hover:bg-primary-dark text-white transition-colors"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={onSubmit}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-primary
                         hover:bg-primary-dark text-white transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
