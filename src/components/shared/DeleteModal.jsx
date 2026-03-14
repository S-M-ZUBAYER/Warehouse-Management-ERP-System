import { AlertTriangle } from "lucide-react";

export default function DeleteModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(15, 39, 68, 0.45)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center text-center"
        style={{
          animation: "fadeSlideUp 0.2s ease both",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        {/* Warning icon */}
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle size={26} className="text-red-500" strokeWidth={2} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-primary mb-2 font-display">
          {title || "Are you sure?"}
        </h3>

        {/* Message */}
        <p className="text-sm text-slate-500 mb-7 leading-relaxed font-body">
          {message ||
            "Do you really want to delete this record? This process cannot be undone."}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body border border-surface-border
                       text-slate-600 hover:bg-surface-card transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500
                       hover:bg-red-600 text-white transition-colors duration-150 font-body"
          >
            Delete
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}
