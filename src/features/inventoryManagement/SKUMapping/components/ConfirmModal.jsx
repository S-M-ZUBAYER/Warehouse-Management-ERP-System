import { AlertCircle, Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ConfirmModal — generic confirm/cancel dialog
// ─────────────────────────────────────────────────────────────────────────────
export default function ConfirmModal({ title, message, confirmLabel, confirmClass, loading, onCancel, onConfirm, children }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(200,210,220,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={(e) => e.target === e.currentTarget && !loading && onCancel()}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7 font-body"
                style={{ animation: 'popIn 0.15s ease both' }}
            >
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <AlertCircle size={18} className="text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800 font-display">{title}</h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{message}</p>
                    </div>
                </div>
                {children}
                <div className="flex justify-end gap-3 mt-5">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 hover:bg-surface-card transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2 ${confirmClass ?? 'bg-primary hover:bg-primary-dark text-white'}`}
                    >
                        {loading && <Loader2 size={13} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
            <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
    );
}