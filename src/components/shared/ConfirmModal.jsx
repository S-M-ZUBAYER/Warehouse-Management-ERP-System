// ─────────────────────────────────────────────────────────────────────────────
// ConfirmModal — matches Figma image 4 exactly
// "Are you sure you want to save? This will save all the changes you've made so far."
// ─────────────────────────────────────────────────────────────────────────────

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(200,210,220,0.55)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 flex flex-col items-center text-center font-body"
        style={{ animation: "popIn 0.18s ease both" }}
      >
        <h3 className="text-base font-bold text-slate-800 mb-2">
          {title || "Are you sure you want to save?"}
        </h3>
        <p className="text-sm text-slate-500 mb-7 leading-relaxed">
          {message || "This will save all the changes you've made so far."}
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border
                       text-slate-700 bg-white hover:bg-surface-card transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark
                       text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
