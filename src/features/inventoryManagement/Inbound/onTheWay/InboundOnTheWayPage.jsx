import { useState, useMemo } from "react";
import { ChevronDown, Printer, Pencil, Ship, X } from "lucide-react";
import Topbar from "../../../../components/layout/Topbar";
import InboundFilterBar from "../draft/component/InboundFilterBar";
import InboundTable from "../draft/component/InboundTable";
import { MOCK_INBOUND_LIST } from "../../shared/inboundMockData";

// ─────────────────────────────────────────────────────────────────────────────
// InboundOnTheWayPage — Images 5 & 6
//
// Image 5: "Inbound List" (no Create button) — Bulk Action only
// Image 6: 3-dot action menu open — Print | Edit | Ship | Cancel
// ─────────────────────────────────────────────────────────────────────────────

export default function InboundOnTheWayPage() {
  const [warehouse, setWarehouse] = useState("Warehouse name here");
  const [timeType, setTimeType] = useState("Created Time");
  const [timeFilter, setTimeFilter] = useState("All");
  const [inboundType, setInboundType] = useState("Inbound No.");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDrop, setShowBulkDrop] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_INBOUND_LIST;
    const q = search.toLowerCase();
    return MOCK_INBOUND_LIST.filter(
      (i) =>
        i.inboundId.toLowerCase().includes(q) ||
        i.warehouseName.toLowerCase().includes(q),
    );
  }, [search]);

  const toggleSelect = (id) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = () => {
    const ids = filtered.map((i) => i.id);
    setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids);
  };

  // 3-dot action items — Image 6: Print | Edit | Ship | Cancel
  const actionItems = [
    {
      label: "Print",
      icon: Printer,
      onClick: (item) => console.log("Print", item.inboundId),
    },
    {
      label: "Edit",
      icon: Pencil,
      onClick: (item) => console.log("Edit", item.inboundId),
    },
    {
      label: "Ship",
      icon: Ship,
      onClick: (item) => console.log("Ship", item.inboundId),
    },
    {
      label: "Cancel",
      icon: X,
      onClick: (item) => console.log("Cancel", item.inboundId),
      danger: true,
    },
  ];

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Inbound" />

      <InboundFilterBar
        warehouse={warehouse}
        setWarehouse={setWarehouse}
        timeType={timeType}
        setTimeType={setTimeType}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        inboundType={inboundType}
        setInboundType={setInboundType}
        search={search}
        setSearch={setSearch}
      />

      {/* Inbound List card */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-base font-bold text-slate-800 font-display mb-4">
            Inbound List
          </h2>

          {/* Bulk Action only (no Create Inbound button) */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative">
              <button
                onClick={() => setShowBulkDrop((p) => !p)}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                Bulk Action
                <ChevronDown
                  size={13}
                  className={`text-slate-400 transition-transform ${showBulkDrop ? "rotate-180" : ""}`}
                />
              </button>
              {showBulkDrop && (
                <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-28">
                  {["Print", "Edit", "Ship", "Cancel"].map((a) => (
                    <button
                      key={a}
                      onClick={() => setShowBulkDrop(false)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${a === "Cancel" ? "text-red-500 hover:bg-red-50" : "text-slate-700 hover:bg-surface-card"}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table with On The Way action menu */}
        <InboundTable
          items={filtered}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          actionItems={actionItems}
        />

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
          <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
            Export <ChevronDown size={13} className="text-slate-400" />
          </button>
          <button className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
