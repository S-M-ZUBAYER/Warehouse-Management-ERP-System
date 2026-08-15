import { AlertTriangle, X } from "lucide-react";

export default function ConfirmActionModal({
  open,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  loadingLabel = "Working...",
  confirmDisabled = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between px-6 py-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <span className={`w-10 h-10 rounded-full flex items-center justify-center ${danger ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"}`}>
              <AlertTriangle size={20} />
            </span>
            <h3 className="text-base font-bold text-slate-800 font-display">{title}</h3>
          </div>
          <button disabled={loading} onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50">
            <X size={17} />
          </button>
        </div>
        <div className="px-6 py-5 text-sm text-slate-600 leading-6">{message}</div>
        <div className="flex gap-3 px-6 py-4 border-t border-surface-border">
          <button disabled={loading} onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60">
            {cancelLabel}
          </button>
          <button disabled={loading || confirmDisabled} onClick={onConfirm} className={`flex-1 px-4 py-2.5 rounded-xl text-white font-semibold disabled:opacity-60 ${danger ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary-dark"}`}>
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
