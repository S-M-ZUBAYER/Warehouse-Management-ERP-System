import { Trash2, X } from "lucide-react";

export default function DeleteRoleModal({
  open,
  role,
  onClose,
  onConfirm,
  deleting,
}) {
  if (!open || !role) return null;

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
        style={{ maxWidth: "400px", animation: "popIn 0.18s ease both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 size={16} className="text-red-500" />
            </div>
            <h2 className="text-base font-bold text-slate-800 font-display">
              Delete Role
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full
                                   text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-800">"{role.name}"</span>?
            This action cannot be undone.
          </p>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={deleting}
              className="px-5 py-2.5 text-sm font-semibold border border-surface-border
                                       rounded-xl text-slate-700 bg-white hover:bg-surface-card
                                       transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="px-5 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600
                                       text-white rounded-xl transition-colors disabled:opacity-60
                                       flex items-center gap-2"
            >
              {deleting && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Delete
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
