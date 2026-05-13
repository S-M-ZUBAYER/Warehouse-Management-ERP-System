import { ChevronDown } from "lucide-react";
import { exportRowsToCsv, printRows } from "../../../../utils/tableOutput";

export default function InvFooter({ selectedRows = [], columns, filename = "inventory-export.csv", title = "Selected Inventory Records", itemName = "record" }) {
  return (
    <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
      <button
        onClick={() => exportRowsToCsv(selectedRows, columns, filename, itemName)}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border
                         border-surface-border rounded-lg text-slate-700 bg-white
                         hover:bg-surface-card transition-colors font-body"
      >
        Export <ChevronDown size={13} className="text-slate-400" />
      </button>
      <button
        onClick={() => printRows(selectedRows, columns, title, itemName)}
        className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary
                         hover:bg-primary-dark text-white transition-colors font-body"
      >
        Print
      </button>
    </div>
  );
}
