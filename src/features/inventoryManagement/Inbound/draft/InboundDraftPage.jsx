import { useState, useRef, useEffect, useMemo } from "react";
import {
  Plus,
  Printer,
  Pencil,
  Ship,
  X,
  Trash2,
  ChevronDown,
} from "lucide-react";
import Topbar from "../../../../components/layout/Topbar";
import {
  MOCK_INBOUND_LIST,
  MOCK_DRAFT_ITEMS,
} from "../../shared/inboundMockData";
import InboundFilterBar from "./component/InboundFilterBar";
import InboundTable from "./component/InboundTable";
import SelectMerchantSKUModal from "./component/SelectMerchantSKUModal";

// ─────────────────────────────────────────────────────────────────────────────
// InboundDraftPage — Images 1, 2, 3, 4
//
// Image 1: Draft List — Submit | Ship | Bulk Action | + Create Inbound
// Image 2: All dropdowns open (Created Time, All filter, Inbound No., Bulk Action Ship/Submit)
// Image 3: Create Inbound page — "← Back to Draft" + Draft List table + Select Merchant SKU
// Image 4: Select Merchant SKU modal — two-panel
// ─────────────────────────────────────────────────────────────────────────────

export default function InboundDraftPage() {
  const [showCreatePage, setShowCreatePage] = useState(false);

  if (showCreatePage) {
    return <CreateInboundPage onBack={() => setShowCreatePage(false)} />;
  }
  return <DraftListPage onCreateClick={() => setShowCreatePage(true)} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Draft List (Images 1 & 2)
// ─────────────────────────────────────────────────────────────────────────────
function DraftListPage({ onCreateClick }) {
  const [warehouse, setWarehouse] = useState("Warehouse name here");
  const [timeType, setTimeType] = useState("Created Time");
  const [timeFilter, setTimeFilter] = useState("All");
  const [inboundType, setInboundType] = useState("Inbound No.");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Bulk Action dropdown (Image 2 — shows Ship / Submit)
  const [showBulkDrop, setShowBulkDrop] = useState(false);
  const bulkRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (bulkRef.current && !bulkRef.current.contains(e.target))
        setShowBulkDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  // 3-dot action menu items for Draft rows (no specific items in images — using generic)
  const actionItems = [
    { label: "Edit", icon: Pencil },
    { label: "Delete", danger: true, icon: Trash2 },
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

      {/* Draft List card */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-base font-bold text-slate-800 font-display mb-4">
            Draft List
          </h2>

          {/* Action buttons row */}
          <div className="flex items-center gap-2 mb-4 justify-between">
            <div className="flex items-center gap-2">
              {/* Submit */}
              <button className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
                Submit
              </button>

              {/* Ship */}
              <button className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
                Ship
              </button>

              {/* Bulk Action (Image 2) */}
              <div className="relative" ref={bulkRef}>
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
                    {["Ship", "Submit"].map((a) => (
                      <button
                        key={a}
                        onClick={() => setShowBulkDrop(false)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* + Create Inbound */}
            <button
              onClick={onCreateClick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              <Plus size={14} />
              Create Inbound
            </button>
          </div>
        </div>

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

// ─────────────────────────────────────────────────────────────────────────────
// Create Inbound page (Images 3 & 4)
// ─────────────────────────────────────────────────────────────────────────────
function CreateInboundPage({ onBack }) {
  const [items, setItems] = useState(MOCK_DRAFT_ITEMS);
  const [showSkuModal, setShowSkuModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const removeItem = (id) => setItems((p) => p.filter((x) => x.id !== id));

  const handleConfirmSku = (selected) => {
    setItems((prev) => {
      const existingIds = prev.map((p) => p.id);
      const newItems = selected
        .filter((s) => !existingIds.includes(s.id))
        .map((s) => ({
          id: s.id,
          image: s.image,
          productName: s.name,
          merchantSku: s.sku,
          qty: s.qty ?? 1,
        }));
      return [...prev, ...newItems];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    onBack();
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Back to Draft" showBack onBack={onBack} />

      {/* Filter bar (same as draft list page — matching Figma image 3) */}
      <div className="bg-white rounded-xl border border-surface-border p-4">
        <div className="flex items-end gap-2.5 flex-wrap">
          {/* Select Warehouse */}
          <div className="flex-1 min-w-40">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Warehouse
            </p>
            <div className="relative">
              <select className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-500 outline-none focus:border-primary cursor-pointer">
                <option>Warehouse name here</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          {/* Created Time */}
          <div className="w-40">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Time
            </p>
            <div className="relative">
              <select className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-500 outline-none focus:border-primary cursor-pointer">
                <option>Created Time</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          {/* All */}
          <div className="w-24 mt-5">
            <div className="relative">
              <select className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-500 outline-none focus:border-primary cursor-pointer">
                <option>All</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          {/* Date */}
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-500 hover:border-primary/40 transition-colors mt-5 whitespace-nowrap">
            📅 01 Oct 2025 - 31 Oct 2025
          </button>
          {/* Inbound No */}
          <div className="w-28 mt-5">
            <div className="relative">
              <select className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-500 outline-none cursor-pointer">
                <option>Inbound No.</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          {/* Search */}
          <div className="flex-1 min-w-28 relative mt-5">
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-3 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
            />
          </div>
          <button className="mt-5 px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Draft List with items */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-slate-800 font-display">
            Draft List
          </h2>
          <button
            onClick={() => setShowSkuModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <Plus size={14} />
            Select Merchant SKU
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-surface-border">
                {[
                  "Image",
                  "Product Name",
                  "Merchant SKU",
                  "Quantity",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-5 text-left text-sm font-semibold text-slate-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-surface/50 transition-colors"
                >
                  <td className="py-3 px-5">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-9 h-9 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://placehold.co/36x36/E6ECF0/004368?text=?";
                      }}
                    />
                  </td>
                  <td className="py-3 px-5 text-slate-700">
                    {item.productName}
                  </td>
                  <td className="py-3 px-5 font-mono text-xs text-slate-600">
                    {item.merchantSku}
                  </td>
                  <td className="py-3 px-5 text-slate-700">
                    {String(item.qty).padStart(2, "0")}
                  </td>
                  <td className="py-3 px-5">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-1">
        <button
          onClick={onBack}
          className="px-7 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-7 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {saving && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          Save
        </button>
      </div>

      <SelectMerchantSKUModal
        open={showSkuModal}
        onClose={() => setShowSkuModal(false)}
        onConfirm={handleConfirmSku}
      />
    </div>
  );
}
