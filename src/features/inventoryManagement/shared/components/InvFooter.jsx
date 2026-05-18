import { exportRowsToCsv, exportRowsToXlsx, printRows } from "../../../../utils/tableOutput";
import ExportMenu from "../../../../components/shared/ExportMenu";

export default function InvFooter({ selectedRows = [], columns, filename = "inventory-export.csv", xlsxFilename, title = "Selected Inventory Records", itemName = "record" }) {
  const resolvedXlsxFilename = xlsxFilename ?? filename.replace(/\.csv$/i, ".xlsx");
  return (
    <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
      <ExportMenu
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors font-body"
        onExportCsv={() => exportRowsToCsv(selectedRows, columns, filename, itemName)}
        onExportXlsx={() => exportRowsToXlsx(selectedRows, columns, resolvedXlsxFilename, itemName)}
      />
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
