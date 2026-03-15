import { ChevronDown } from "lucide-react";

export default function InvFooter() {
  return (
    <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
      <button
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border
                         border-surface-border rounded-lg text-slate-700 bg-white
                         hover:bg-surface-card transition-colors font-body"
      >
        Export <ChevronDown size={13} className="text-slate-400" />
      </button>
      <button
        className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary
                         hover:bg-primary-dark text-white transition-colors font-body"
      >
        Print
      </button>
    </div>
  );
}
