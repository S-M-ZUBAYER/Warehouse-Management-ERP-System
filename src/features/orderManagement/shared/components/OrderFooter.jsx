import { ChevronDown } from "lucide-react";
import { exportRowsToCsv, printRows } from "../../../../utils/tableOutput";

// ─────────────────────────────────────────────────────────────────────────────
// OrderFooter — Export (dropdown) + Print buttons matching all Figma order pages
// ─────────────────────────────────────────────────────────────────────────────

export default function OrderFooter({ selectedRows = [], columns, title = "Selected Orders" }) {
  const outputColumns = columns || [
    { label: "Package No.", key: "pkgNo" },
    { label: "SKU", key: "sku" },
    { label: "Order Number", key: "orderNo" },
    { label: "Tracking Number", key: "trackingNo" },
    { label: "Price", key: "price" },
    { label: "Create Time", key: "createdAt" },
    { label: "Status", key: "status" },
  ];
  return (
    <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
      <button
        onClick={() => exportRowsToCsv(selectedRows, outputColumns, "orders.csv", "order")}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                   border border-surface-border rounded-lg text-slate-700 bg-white
                   hover:bg-surface-card transition-colors font-body"
      >
        Export
        <ChevronDown size={13} className="text-slate-400" />
      </button>
      <button
        onClick={() => printRows(selectedRows, outputColumns, title, "order")}
        className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary
                   hover:bg-primary-dark text-white transition-colors font-body"
      >
        Print
      </button>
    </div>
  );
}
