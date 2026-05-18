import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ExportMenu({
  onExportCsv,
  onExportXlsx,
  className = "flex items-center gap-2 px-14 py-2.5 text-base font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors",
  icon = null,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const run = (handler) => {
    setOpen(false);
    handler?.();
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((value) => !value)} className={className}>
        {icon}
        Export <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-40">
          <button
            type="button"
            onClick={() => run(onExportCsv)}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => run(onExportXlsx)}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors"
          >
            Export XLSX
          </button>
        </div>
      )}
    </div>
  );
}
