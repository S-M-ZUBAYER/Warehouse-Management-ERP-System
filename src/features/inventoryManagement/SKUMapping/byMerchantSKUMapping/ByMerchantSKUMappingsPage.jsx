import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, ArrowLeft, Trash2, Link2 } from "lucide-react";
import Topbar from "../../../../components/layout/Topbar";
import InvFooter from "../../shared/components/InvFooter";
import {
  MOCK_MERCHANT_SKU_MAPPING,
  MOCK_SKU_MAPPING_PRODUCTS,
  PLATFORMS,
  SHOPS,
  STATUS_OPTS,
} from "../../shared/mockData";

// ─────────────────────────────────────────────────────────────────────────────
// ByMerchantSKUMappingPage — Images 7, 8, 9
// Image 7: SKU Mapping by Merchant SKU list
// Image 8: Add Mapping modal (two-panel: Select Merchant SKU + Preview selection)
// Image 9: Same modal with Select Status + SKU Name dropdowns open
// ─────────────────────────────────────────────────────────────────────────────

export default function ByMerchantSKUMappingPage() {
  const [search, setSearch] = useState("");
  const [skuType, setSkuType] = useState("SKU");
  const [activeTab, setActiveTab] = useState("All (100)");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Mapping modal state
  const [modalMarketplace, setModalMarketplace] = useState(
    "Marketplace Name Here",
  );
  const [modalStore, setModalStore] = useState("Store name here");
  const [modalStatus, setModalStatus] = useState("All");
  const [modalSkuType, setModalSkuType] = useState("SKU Name");
  const [modalSearch, setModalSearch] = useState("");
  const [modalSelected, setModalSelected] = useState([1, 2, 3, 4, 5, 6]); // pre-selected matching Image 8
  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [showSkuTypeDrop, setShowSkuTypeDrop] = useState(false);
  const statusRef = useRef(null);
  const skuTypeRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target))
        setShowStatusDrop(false);
      if (skuTypeRef.current && !skuTypeRef.current.contains(e.target))
        setShowSkuTypeDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = MOCK_MERCHANT_SKU_MAPPING.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q);
  });

  const toggleSelect = (id) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleModalSel = (id) =>
    setModalSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const removePreview = (id) =>
    setModalSelected((p) => p.filter((x) => x !== id));
  const clearAll = () => setModalSelected([]);

  const previewItems = MOCK_SKU_MAPPING_PRODUCTS.filter((p) =>
    modalSelected.includes(p.id),
  );
  const modalFiltered = MOCK_SKU_MAPPING_PRODUCTS.filter((p) => {
    if (!modalSearch.trim()) return true;
    const q = modalSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) || p.productId.toLowerCase().includes(q)
    );
  });

  const TABS = ["All (100)", "Unmapped (20)", "Mapped (80)"];

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="SKU Mapping" />

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-surface-border p-7 flex items-center gap-3">
        <div className="relative">
          <select
            value={skuType}
            onChange={(e) => setSkuType(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer w-28"
          >
            <option>SKU</option>
            <option>Product Name</option>
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search bundle SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <button className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
          Search
        </button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-base font-bold text-slate-800 font-display mb-4">
            SKU Mapping by Merchant SKU
          </h2>

          {/* Sub-tabs */}
          <div className="flex items-center gap-5 border-b border-surface-border">
            {TABS.map((tab) => (
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
                      onChange={() => {
                        const ids = filtered.map((p) => p.id);
                        setSelectedIds(
                          ids.every((id) => selectedIds.includes(id))
                            ? []
                            : ids,
                        );
                      }}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-600 tracking-wide">
                      Select All
                    </span>
                  </label>
                </th>
                {[
                  "Image",
                  "Merchant SKU Name",
                  "Mapped Store SKU",
                  "Details",
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
                  <td className="py-3 pr-4 text-slate-700">{p.name}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {p.mappedStoreSku}
                  </td>
                  <td className="py-3 pr-4">
                    <button className="text-slate-400 hover:text-slate-600 transition-colors p-0.5">
                      <ChevronDown size={16} />
                    </button>
                  </td>
                  <td className="py-3 pr-5">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="text-slate-400 hover:text-primary transition-colors p-1 rounded"
                    >
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

      {/* ── Add Mapping Modal (Images 8 & 9) ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(180,195,210,0.5)",
            backdropFilter: "blur(3px)",
          }}
          onClick={(e) =>
            e.target === e.currentTarget && setShowAddModal(false)
          }
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden"
            style={{ maxWidth: "1100px", animation: "popIn 0.18s ease both" }}
          >
            {/* Modal header */}
            <div className="px-8 py-5 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-base font-bold text-slate-800 font-display">
                  Add Mapping
                </h2>
              </div>
            </div>

            {/* Filter bar inside modal */}
            <div className="px-8 py-4 border-b border-surface-border">
              <div className="grid grid-cols-5 gap-3">
                {/* Select Marketplace */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    Select Marketplace
                  </p>
                  <div className="relative">
                    <select
                      value={modalMarketplace}
                      onChange={(e) => setModalMarketplace(e.target.value)}
                      className="w-full appearance-none pl-3 pr-7 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
                {/* Select Store */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Select Store</p>
                  <div className="relative">
                    <select
                      value={modalStore}
                      onChange={(e) => setModalStore(e.target.value)}
                      className="w-full appearance-none pl-3 pr-7 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
                    >
                      {SHOPS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
                {/* Select Status — with custom dropdown (Image 9) */}
                <div className="relative" ref={statusRef}>
                  <p className="text-xs text-slate-500 mb-1">Select Status</p>
                  <button
                    onClick={() => setShowStatusDrop((p) => !p)}
                    className="w-full flex items-center justify-between pl-3 pr-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 hover:border-primary/40 transition-colors"
                  >
                    <span>{modalStatus}</span>
                    <ChevronDown size={12} className="text-slate-400" />
                  </button>
                  {showStatusDrop && (
                    <div className="absolute left-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1 min-w-full">
                      {["All", "Not Mapped"].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setModalStatus(s);
                            setShowStatusDrop(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${modalStatus === s ? "text-primary font-semibold bg-blue-50" : "text-slate-700 hover:bg-surface-card"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* SKU Name dropdown (Image 9) */}
                <div className="relative" ref={skuTypeRef}>
                  <button
                    onClick={() => setShowSkuTypeDrop((p) => !p)}
                    className="w-full flex items-center justify-between pl-3 pr-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 hover:border-primary/40 transition-colors mt-5"
                  >
                    <span>{modalSkuType}</span>
                    <ChevronDown size={12} className="text-slate-400" />
                  </button>
                  {showSkuTypeDrop && (
                    <div className="absolute left-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1 min-w-full">
                      {["SKU Name", "Product Name", "Item ID", "SKU ID"].map(
                        (t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setModalSkuType(t);
                              setShowSkuTypeDrop(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${modalSkuType === t ? "text-primary font-semibold bg-blue-50" : "text-slate-700 hover:bg-surface-card"}`}
                          >
                            {t}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
                {/* Search + button */}
                <div className="flex gap-2 mt-5">
                  <div className="relative flex-1">
                    <Search
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Search"
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                    />
                  </div>
                  <button className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors whitespace-nowrap">
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Two-panel body */}
            <div
              className="grid grid-cols-2 gap-0 divide-x divide-surface-border"
              style={{ maxHeight: "380px" }}
            >
              {/* Left — Select Merchant SKU */}
              <div className="overflow-hidden flex flex-col">
                <div className="px-6 py-3 border-b border-surface-border">
                  <h3 className="text-sm font-bold text-slate-800 font-display">
                    Select Merchant SKU
                  </h3>
                </div>
                <div className="overflow-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-surface-border">
                        {[
                          "Select",
                          "Image",
                          "Product Name",
                          "Store Name",
                          "SKU",
                        ].map((h) => (
                          <th
                            key={h}
                            className="py-2.5 pl-4 text-left text-xs font-semibold text-slate-600"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {modalFiltered.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => toggleModalSel(p.id)}
                          className={`cursor-pointer hover:bg-surface/50 transition-colors ${modalSelected.includes(p.id) ? "bg-blue-50/50" : ""}`}
                        >
                          <td className="py-2.5 pl-4">
                            <input
                              type="checkbox"
                              checked={modalSelected.includes(p.id)}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 rounded border-slate-300 accent-primary cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 pl-4">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "https://placehold.co/32x32/E6ECF0/004368?text=?";
                              }}
                            />
                          </td>
                          <td className="py-2.5 pl-4 text-xs text-slate-700 max-w-36 truncate">
                            {p.name}
                          </td>
                          <td className="py-2.5 pl-4 text-xs text-slate-600">
                            {p.storeName}
                          </td>
                          <td className="py-2.5 pl-4 text-xs font-mono text-slate-600">
                            {p.productId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right — Preview selection */}
              <div className="overflow-hidden flex flex-col">
                <div className="px-6 py-3 border-b border-surface-border flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 font-display">
                    Preview selection
                  </h3>
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} /> Clear all
                  </button>
                </div>
                <div className="overflow-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-surface-border">
                        {["Image", "Product Name", "Action"].map((h) => (
                          <th
                            key={h}
                            className="py-2.5 pl-4 text-left text-xs font-semibold text-slate-600"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {previewItems.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-surface/50 transition-colors"
                        >
                          <td className="py-2.5 pl-4">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "https://placehold.co/32x32/E6ECF0/004368?text=?";
                              }}
                            />
                          </td>
                          <td className="py-2.5 pl-4 text-xs text-slate-700 max-w-40 truncate">
                            {p.name}
                          </td>
                          <td className="py-2.5 pl-4">
                            <button
                              onClick={() => removePreview(p.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-8 py-5 border-t border-surface-border">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-8 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-8 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
          <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.97) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
      )}
    </div>
  );
}
