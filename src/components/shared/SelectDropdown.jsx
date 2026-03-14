import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// SelectDropdown — matches Figma filter dropdowns (Warehouse, Status, Country, SKU)
// Light border, placeholder text, chevron arrow
// ─────────────────────────────────────────────────────────────────────────────

export default function SelectDropdown({
  label,
  placeholder,
  options,
  value,
  onChange,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const display = value && value !== options[0] ? value : null;

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <p className="text-xs font-semibold text-slate-600 mb-1.5 font-body">
          {label}
        </p>
      )}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white
                   border border-surface-border rounded-lg text-sm text-left transition-colors
                   hover:border-primary/40 focus:outline-none focus:border-primary"
      >
        <span
          className={
            display ? "text-slate-700 font-body" : "text-slate-400 font-body"
          }
        >
          {display || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border
                        shadow-lg py-1 min-w-full w-max max-w-xs"
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors font-body
                ${value === opt ? "text-primary font-semibold bg-blue-50" : "text-slate-700 hover:bg-surface-card"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
