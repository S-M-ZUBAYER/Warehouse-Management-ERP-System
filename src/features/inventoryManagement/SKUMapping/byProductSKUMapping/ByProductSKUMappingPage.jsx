import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X, Link2 } from "lucide-react";
import Topbar from "../../../../components/layout/Topbar";
import InvFooter from "../../shared/components/InvFooter";
import {
  MOCK_SKU_MAPPING_PRODUCTS,
  PLATFORMS,
  SHOPS,
  WAREHOUSES,
  STATUS_OPTS,
} from "../../shared/mockData";

// ─────────────────────────────────────────────────────────────────────────────
// ByProductSKUMappingPage — Images 3, 4, 5, 6
// ─────────────────────────────────────────────────────────────────────────────

export default function ByProductSKUMappingPage() {
  const [platform, setPlatform] = useState("Platform Name Here");
  const [shop, setShop] = useState("Shop Name Here");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [selectedIds, setSelectedIds] = useState([]);

  // Dropdowns
  const [showGenDrop, setShowGenDrop] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false); // Image 5
  const [showSyncModal, setShowSyncModal] = useState(false); // Image 6
  const [genWarehouse, setGenWarehouse] = useState("Warehouse name here");
  const [syncing, setSyncing] = useState(false);
  const genRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (genRef.current && !genRef.current.contains(e.target))
        setShowGenDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = MOCK_SKU_MAPPING_PRODUCTS.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) || p.productId.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = () => {
    const ids = filtered.map((p) => p.id);
    setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids);
  };

  const handleSync = async () => {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSyncing(false);
    setShowSyncModal(true);
  };

  const handleGenerate = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setShowGenModal(false);
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="SKU Mapping" />

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-surface-border p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Platform
            </p>
            <div className="relative">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
              >
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Shop
            </p>
            <div className="relative">
              <select
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
              >
                {SHOPS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <button className="px-6 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* SKU Mapping card */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-base font-bold text-slate-800 font-display mb-4">
            SKU Mapping by Product
          </h2>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mb-3">
            <button className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
              Auto Mapping
            </button>

            {/* Generate Merchant SKU with dropdown (Image 4) */}
            <div className="relative" ref={genRef}>
              <button
                onClick={() => setShowGenDrop((p) => !p)}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                Generate Merchant SKU{" "}
                <ChevronDown size={13} className="text-slate-400" />
              </button>
              {showGenDrop && (
                <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-40">
                  <button
                    onClick={() => {
                      setShowGenModal(true);
                      setShowGenDrop(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors"
                  >
                    Add Single SKU
                  </button>
                  <button
                    onClick={() => setShowGenDrop(false)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors"
                  >
                    Add by Template
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleSync}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
            >
              {syncing && (
                <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              )}
              Sync Product
            </button>
          </div>

          {/* Sub-tabs: All | Unmapped | Mapped */}
          <div className="flex items-center gap-5 border-b border-surface-border">
            {["All", "Unmapped", "Mapped"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative
                  ${activeTab === tab ? "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : "text-slate-500 hover:text-slate-700"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="py-3 pl-5 w-32 text-left">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={
                        filtered.length > 0 &&
                        filtered.every((p) => selectedIds.includes(p.id))
                      }
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-600 tracking-wide">
                      Select All
                    </span>
                  </label>
                </th>
                {[
                  "Image",
                  "Product Name",
                  "Product ID",
                  "Store Name",
                  "Parent SKU",
                  "Variation Name",
                  "SKU",
                  "Merchant SKU",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 pr-4 text-left text-xs font-semibold text-slate-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-surface/50 transition-colors ${selectedIds.includes(p.id) ? "bg-blue-50/40" : ""}`}
                >
                  <td className="pl-5 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-9 h-9 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://placehold.co/36x36/E6ECF0/004368?text=?";
                      }}
                    />
                  </td>
                  <td className="py-3 pr-4 text-slate-700 max-w-40 truncate">
                    {p.name}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-600">
                    {p.productId}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{p.storeName}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-600">
                    {p.parentSku}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {p.variationName}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-600">
                    {p.sku}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-600">
                    {p.merchantSku}
                  </td>
                  <td className="py-3 pr-5">
                    <button className="text-slate-400 hover:text-primary transition-colors p-1 rounded">
                      <Link2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InvFooter />
      </div>

      {/* ── Generate Merchant SKU Modal (Image 5) ── */}
      {showGenModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(200,210,220,0.55)",
            backdropFilter: "blur(3px)",
          }}
          onClick={(e) =>
            e.target === e.currentTarget && setShowGenModal(false)
          }
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full font-body p-8 text-center"
            style={{ maxWidth: "360px", animation: "popIn 0.18s ease both" }}
          >
            <h2 className="text-lg font-bold text-slate-800 font-display mb-2">
              Generate Merchant SKU?
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              A unique SKU will be created for this product.
            </p>
            <div className="text-left mb-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                *Select Warehouse
              </label>
              <div className="relative">
                <select
                  value={genWarehouse}
                  onChange={(e) => setGenWarehouse(e.target.value)}
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
            <div className="flex gap-3">
              <button
                onClick={() => setShowGenModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white transition-colors"
              >
                Generate SKU
              </button>
            </div>
          </div>
          <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }`}</style>
        </div>
      )}

      {/* ── Synchronize Results Modal (Image 6) ── */}
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
            style={{ maxWidth: "380px", animation: "popIn 0.18s ease both" }}
          >
            <h2 className="text-lg font-bold text-slate-800 font-display mb-1">
              Synchronize results
            </h2>
            <p className="text-sm font-semibold text-emerald-600 mb-4">
              Synchronize completed
            </p>
            <div className="text-left bg-surface rounded-xl p-4 mb-5">
              <p className="text-xs font-bold text-slate-700 mb-2">
                Updates of store with quantity
              </p>
              <p className="text-sm text-slate-600">
                Pexas (23 Products updated)
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Qudon (23 Products updated)
              </p>
            </div>
            <button
              onClick={() => setShowSyncModal(false)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
