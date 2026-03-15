import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Topbar from "../../../components/layout/Topbar";
import InvFooter from "../shared/components/InvFooter";
import { MOCK_INVENTORY_LOG, WAREHOUSES, LOG_TYPES } from "../shared/mockData";

// ─────────────────────────────────────────────────────────────────────────────
// InventoryLogPage — Image 10
// Filter: Type | Select Warehouse | Seller SKU (text input)
// Table: Select | SL No | Seller SKU | Stock In Qty | Stock Out Qty | Remaining Qty | Operation Time
// ─────────────────────────────────────────────────────────────────────────────

export default function InventoryLogPage() {
  const [type, setType] = useState("Recent");
  const [warehouse, setWarehouse] = useState("Warehouse name here");
  const [sellerSku, setSellerSku] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const filtered = MOCK_INVENTORY_LOG.filter((l) => {
    if (!sellerSku.trim()) return true;
    return l.sellerSku.toLowerCase().includes(sellerSku.toLowerCase());
  });

  const toggleSelect = (id) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = () => {
    const ids = filtered.map((l) => l.id);
    setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids);
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Inventory log" />

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-surface-border p-4">
        <div className="grid grid-cols-3 gap-3 max-w-2xl">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Type</p>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
              >
                {LOG_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Warehouse
            </p>
            <div className="relative">
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
              >
                {WAREHOUSES.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Seller SKU
            </p>
            <input
              type="text"
              placeholder="Input seller SKU here"
              value={sellerSku}
              onChange={(e) => setSellerSku(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="py-3 pl-5 w-12 text-left">
                  <input
                    type="checkbox"
                    checked={
                      filtered.length > 0 &&
                      filtered.every((l) => selectedIds.includes(l.id))
                    }
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                  />
                </th>
                {[
                  "SL No",
                  "Seller SKU",
                  "Stock In Quantity",
                  "Stock Out Quantity",
                  "Remaining Quantity",
                  "Operation Time",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 pr-4 text-left text-sm font-semibold text-slate-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((log) => (
                <tr
                  key={log.id}
                  className={`hover:bg-surface/50 transition-colors ${selectedIds.includes(log.id) ? "bg-blue-50/40" : ""}`}
                >
                  <td className="pl-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(log.id)}
                      onChange={() => toggleSelect(log.id)}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                  </td>
                  <td className="py-3.5 pr-4 text-slate-700">{log.sl}</td>
                  <td className="py-3.5 pr-4 font-mono text-slate-700">
                    {log.sellerSku}
                  </td>
                  <td className="py-3.5 pr-4 text-slate-700">{log.stockIn}</td>
                  <td className="py-3.5 pr-4 text-slate-700">{log.stockOut}</td>
                  <td className="py-3.5 pr-4 text-slate-700">
                    {log.remaining}
                  </td>
                  <td className="py-3.5 pr-4 text-slate-500 text-xs">
                    {log.operationTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InvFooter />
      </div>
    </div>
  );
}
