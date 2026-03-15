import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Trash2, X } from "lucide-react";
import Topbar from "../../../components/layout/Topbar";
import {
  MOCK_INVENTORY,
  WAREHOUSES,
  SKU_OPTS,
} from "../shared/inventoryListMockData";
import StockAlertBadge from "./component/StockAlertBadge";

// ─────────────────────────────────────────────────────────────────────────────
// InventoryListPage — Images 1, 2, 3, 4, 5
//
// Image 1: Main list — Warehouse filter | SKU dropdown | Search | Search btn
//          Inventory List card — Bulk Action | Sync Stock | All/Unmapped/Mapped tabs
//          Table: Select | Image | SKU Name | Warehouse Name | Quantity | Stock Alert | Action (delete)
//
// Image 2: Bulk Action dropdown — Stock alert settings | Batch Delete
// Image 3: SKU dropdown — SKU Name | Product Name | Product ID | Store ID
// Image 4: Set Stock Alert modal — Set minimum Stock input | Cancel | Set
// Image 5: Sync Stock confirm modal — Cancel | Sync
// ─────────────────────────────────────────────────────────────────────────────

export default function InventoryListPage() {
  // Filter state
  const [warehouse, setWarehouse] = useState("Warehouse name here");
  const [skuType, setSkuType] = useState("SKU");
  const [search, setSearch] = useState("");
  const [showSkuDrop, setShowSkuDrop] = useState(false);
  const [showWarehouseDrop, setShowWarehouseDrop] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("All (100)");

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Bulk Action dropdown
  const [showBulkDrop, setShowBulkDrop] = useState(false);
  const bulkRef = useRef(null);
  const skuRef = useRef(null);
  const wareRef = useRef(null);

  // Modals
  const [showStockAlertModal, setShowStockAlertModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [minStock, setMinStock] = useState("");
  const [settingSaving, setSettingSaving] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (bulkRef.current && !bulkRef.current.contains(e.target))
        setShowBulkDrop(false);
      if (skuRef.current && !skuRef.current.contains(e.target))
        setShowSkuDrop(false);
      if (wareRef.current && !wareRef.current.contains(e.target))
        setShowWarehouseDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter data
  const filtered = useMemo(() => {
    let list = [...MOCK_INVENTORY];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.skuName.toLowerCase().includes(q) ||
          i.warehouseName.toLowerCase().includes(q),
      );
    }
    if (warehouse !== "Warehouse name here") {
      list = list.filter((i) =>
        i.warehouseName.toLowerCase().includes(warehouse.toLowerCase()),
      );
    }
    return list;
  }, [search, warehouse]);

  const toggleSelect = (id) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const toggleAll = () => {
    const ids = filtered.map((i) => i.id);
    setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids);
  };

  const allSelected =
    filtered.length > 0 && filtered.every((i) => selectedIds.includes(i.id));
  const someSelected =
    filtered.some((i) => selectedIds.includes(i.id)) && !allSelected;

  const handleSetStockAlert = async () => {
    setSettingSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSettingSaving(false);
    setShowStockAlertModal(false);
    setMinStock("");
  };

  const handleSync = () => {
    setShowSyncModal(false);
  };

  const TABS = ["All (100)", "Unmapped (20)", "Mapped (80)"];

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Inventory List" />

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-xl border border-surface-border p-4">
        <div className="flex items-end gap-3">
          {/* Select Warehouse */}
          <div className="flex-1 min-w-44">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Warehouse
            </p>
            <div className="relative" ref={wareRef}>
              <button
                type="button"
                onClick={() => setShowWarehouseDrop((p) => !p)}
                className="w-full flex items-center justify-between pl-3 pr-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-500 hover:border-primary/40 transition-colors"
              >
                <span>{warehouse}</span>
                <ChevronDown
                  size={13}
                  className="text-slate-400 flex-shrink-0"
                />
              </button>
              {showWarehouseDrop && (
                <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 min-w-full">
                  {WAREHOUSES.map((w) => (
                    <button
                      key={w}
                      onClick={() => {
                        setWarehouse(w);
                        setShowWarehouseDrop(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${warehouse === w ? "text-primary font-semibold bg-blue-50" : "text-slate-700 hover:bg-surface-card"}`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SKU Type dropdown (Image 3) */}
          <div className="relative w-36" ref={skuRef}>
            <button
              type="button"
              onClick={() => setShowSkuDrop((p) => !p)}
              className="w-full flex items-center justify-between pl-3 pr-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 hover:border-primary/40 transition-colors"
            >
              <span>{skuType}</span>
              <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />
            </button>
            {showSkuDrop && (
              <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 min-w-full w-40">
                {SKU_OPTS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSkuType(opt);
                      setShowSkuDrop(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${skuType === opt ? "text-primary font-semibold bg-blue-50" : "text-slate-700 hover:bg-surface-card"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search input */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search Product"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Search button */}
          <button className="px-6 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors whitespace-nowrap">
            Search
          </button>
        </div>
      </div>

      {/* ── Inventory List Card ── */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-base font-bold text-slate-800 font-display mb-4">
            Inventory List
          </h2>

          {/* Action buttons row */}
          <div className="flex items-center gap-3 mb-3">
            {/* Bulk Action (Image 2) */}
            <div className="relative" ref={bulkRef}>
              <button
                onClick={() => setShowBulkDrop((p) => !p)}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                Bulk Action
                <ChevronDown size={13} className="text-slate-400" />
              </button>
              {showBulkDrop && (
                <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-44">
                  <button
                    onClick={() => {
                      setShowStockAlertModal(true);
                      setShowBulkDrop(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors"
                  >
                    Stock alert settings
                  </button>
                  <button
                    onClick={() => setShowBulkDrop(false)}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Batch Delete
                  </button>
                </div>
              )}
            </div>

            {/* Sync Stock (Image 5) */}
            <button
              onClick={() => setShowSyncModal(true)}
              className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
            >
              Sync Stock
            </button>
          </div>

          {/* Sub-tabs: All | Unmapped | Mapped */}
          <div className="flex items-center gap-5 border-b border-surface-border">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative
                  ${
                    activeTab === tab
                      ? "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-surface-border">
                {/* Checkbox */}
                <th className="py-3 pl-5 w-36 text-left">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = someSelected && !allSelected; // ✅ Fix: only indeterminate when SOME (not all) are selected
                        }
                      }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                    <span className="pl-2 text-base font-semibold text-primary-text">
                      Select All
                    </span>
                  </label>
                </th>

                {[
                  { label: "Image", cls: "w-14" },
                  { label: "SKU Name", cls: "w-28" },
                  { label: "Warehouse Name", cls: "" },
                  { label: "Quantity", cls: "w-24 text-right pr-12" },
                  { label: "Stock Alert", cls: "w-36" },
                  { label: "Action", cls: "w-16 pr-5" },
                ].map(({ label, cls }) => (
                  <th
                    key={label}
                    className={`py-3 pr-4 text-left text-xs font-semibold text-slate-600 ${cls}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-14 text-center text-sm text-slate-400"
                  >
                    No items found
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-surface/50 ${isSelected ? "bg-blue-50/40" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="pl-5 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                        />
                      </td>

                      {/* Image */}
                      <td className="py-3 pr-4">
                        <img
                          src={item.image}
                          alt={item.skuName}
                          className="w-9 h-9 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/36x36/E6ECF0/004368?text=?";
                          }}
                        />
                      </td>

                      {/* SKU Name */}
                      <td className="py-3 pr-4 font-medium text-slate-800 font-mono text-xs">
                        {item.skuName}
                      </td>

                      {/* Warehouse Name */}
                      <td className="py-3 pr-4 text-slate-700">
                        {item.warehouseName}
                      </td>

                      {/* Quantity */}
                      <td className="py-3 pr-12 text-right text-slate-700 font-medium">
                        {String(item.qty).padStart(2, "0")}
                      </td>

                      {/* Stock Alert badge */}
                      <td className="py-3 pr-4">
                        <StockAlertBadge status={item.stockAlert} />
                      </td>

                      {/* Action — delete icon */}
                      <td className="py-3 pr-5">
                        <button
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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

      {/* ── Set Stock Alert Modal (Image 4) ── */}
      {showStockAlertModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(200,210,220,0.55)",
            backdropFilter: "blur(3px)",
          }}
          onClick={(e) =>
            e.target === e.currentTarget && setShowStockAlertModal(false)
          }
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full font-body p-8 text-center"
            style={{ maxWidth: "380px", animation: "popIn 0.18s ease both" }}
          >
            <h2 className="text-lg font-bold text-slate-800 font-display mb-1.5">
              Set Stock Alert
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Set minimum Stock to alert the user
            </p>

            <div className="text-left mb-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Set minimum Stock
              </label>
              <input
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="Minimum Stock Quantity here"
                className="w-full px-3.5 py-2.5 text-sm border border-surface-border rounded-xl bg-white
                           text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStockAlertModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetStockAlert}
                disabled={settingSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {settingSaving && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Set
              </button>
            </div>
          </div>
          <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
      )}

      {/* ── Sync Stock Confirm Modal (Image 5) ── */}
      {showSyncModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(200,210,220,0.55)",
            backdropFilter: "blur(3px)",
          }}
          onClick={(e) =>
            e.target === e.currentTarget && setShowSyncModal(false)
          }
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full font-body p-8 text-center"
            style={{ maxWidth: "360px", animation: "popIn 0.18s ease both" }}
          >
            <h2 className="text-lg font-bold text-slate-800 font-display mb-2">
              Are you sure you want to Sync?
            </h2>
            <p className="text-sm text-slate-500 mb-7">
              All third party warehouse stock will be sync.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSyncModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSync}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white transition-colors"
              >
                Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
