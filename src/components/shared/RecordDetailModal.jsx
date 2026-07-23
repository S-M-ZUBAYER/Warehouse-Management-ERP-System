import { X } from "lucide-react";

const normalizeLabelAcronyms = (label) =>
  String(label)
    .replace(/\bSku\b/g, "SKU")
    .replace(/\bId\b/g, "ID")
    .replace(/\bGtin\b/g, "GTIN");

const formatLabel = (key) =>
  normalizeLabelAcronyms(String(key)
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase()));

const isEmpty = (value) =>
  value === null || value === undefined || value === "" ||
  (Array.isArray(value) && value.length === 0);

const renderValue = (value) => {
  if (isEmpty(value)) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isFinite(value) ? value.toLocaleString() : String(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed && ["{", "["].includes(trimmed[0])) {
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      } catch {
        return value;
      }
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.every((v) => ["string", "number", "boolean"].includes(typeof v))) {
      return value.join(", ");
    }
    return `${value.length} item(s)`;
  }
  if (typeof value === "object") {
    const name = value.name || value.store_name || value.sku_name || value.title || value.label;
    return name || JSON.stringify(value, null, 2);
  }
  return String(value);
};

export default function RecordDetailModal({ open, title = "Details", subtitle, record, fields, onClose }) {
  if (!open || !record) return null;

  const rows = (fields && fields.length ? fields : Object.keys(record).slice(0, 24).map((key) => ({ key })))
    .map((field) => {
      const key = field.key || field;
      const value = field.render ? field.render(record) : record[key];
      return { label: normalizeLabelAcronyms(field.label || formatLabel(key)), value, fullWidth: field.fullWidth };
    });

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-surface-border">
          <div>
            <h3 className="text-lg font-bold text-slate-800 font-display">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-6">
          {record.image_url || record.image || record.avatar_url ? (
            <div className="mb-5 flex items-center gap-4">
              <img
                src={record.image_url || record.image || record.avatar_url}
                alt={record.name || record.sku_name || title}
                className="w-16 h-16 rounded-xl object-cover border border-surface-border"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">{record.name || record.sku_title || record.sku_name || record.product_name || "Record"}</p>
                <p className="text-xs text-slate-500">ID: {record.id ?? "—"}</p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rows.map((row, idx) => (
              <div
                key={`${row.label}-${idx}`}
                className={`rounded-xl border border-surface-border bg-slate-50/60 px-4 py-3 ${row.fullWidth ? "md:col-span-2" : ""}`}
              >
                <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-1">{row.label}</p>
                <p className="text-sm text-slate-800 break-words whitespace-pre-wrap">{renderValue(row.value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-surface-border">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
