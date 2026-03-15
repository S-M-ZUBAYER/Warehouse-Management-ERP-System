import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X, UploadCloud } from "lucide-react";
import Topbar from "../../../components/layout/Topbar";
import InvFooter from "../shared/components/InvFooter";
import { MOCK_SKUS, SKU_TYPES, WAREHOUSES } from "../shared/mockData";

// ─────────────────────────────────────────────────────────────────────────────
// MerchantSKUPage — Image 1 + Image 2
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  productName: "",
  skuName: "",
  productDetails: "",
  gtin: "",
  productPrice: "",
  weight: "",
  length: "",
  width: "",
  height: "",
  warehouse: "Warehouse name",
  photo: null,
  photoPreview: null,
};

export default function MerchantSKUPage() {
  const [search, setSearch] = useState("");
  const [skuType, setSkuType] = useState("SKU");
  const [selectedIds, setSelectedIds] = useState([]);
  const [openActionId, setOpenActionId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkDrop, setShowBulkDrop] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const actionRefs = useRef({});
  const bulkRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (openActionId !== null) {
        const ref = actionRefs.current[openActionId];
        if (ref && !ref.contains(e.target)) setOpenActionId(null);
      }
      if (bulkRef.current && !bulkRef.current.contains(e.target))
        setShowBulkDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openActionId]);

  const filtered = MOCK_SKUS.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.skuName.toLowerCase().includes(q) ||
      s.skuTitle.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = () => {
    const ids = filtered.map((s) => s.id);
    setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids);
  };
  const allSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id));
  const someSelected =
    filtered.some((s) => selectedIds.includes(s.id)) && !allSelected;

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((p) => ({
      ...p,
      photo: file,
      photoPreview: URL.createObjectURL(file),
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.productName.trim()) e.productName = "Product Name is required";
    if (!form.skuName.trim()) e.skuName = "SKU Name is required";
    if (!form.productDetails.trim())
      e.productDetails = "Product Details is required";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setShowAddModal(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Merchant SKU" />

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-surface-border p-7 flex items-center gap-3">
        <div className="relative">
          <select
            value={skuType}
            onChange={(e) => setSkuType(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border
                       rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer w-28"
          >
            {SKU_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
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
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg
                       text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <button className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
          Search
        </button>
      </div>

      {/* SKU List card */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-slate-800 font-display">
            SKU List
          </h2>
          <div className="flex items-center gap-2">
            {/* Bulk Action */}
            <div className="relative" ref={bulkRef}>
              <button
                onClick={() => setShowBulkDrop((p) => !p)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border
                           border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                Bulk Action <ChevronDown size={13} className="text-slate-400" />
              </button>
              {showBulkDrop && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-36">
                  {["Delete Selected", "Export Selected"].map((a) => (
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
            {/* Add Merchant SKU */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                         bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              Add Merchant SKU{" "}
              <ChevronDown size={13} className="text-white/70" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-surface-border">
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
                  "Image",
                  "SKU Name",
                  "SKU Title",
                  "Weight",
                  "Size",
                  "Creation Time",
                  "Update Time",
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
              {filtered.map((sku) => (
                <tr
                  key={sku.id}
                  className={`hover:bg-surface/50 transition-colors ${selectedIds.includes(sku.id) ? "bg-blue-50/40" : ""}`}
                >
                  <td className="pl-5 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(sku.id)}
                      onChange={() => toggleSelect(sku.id)}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <img
                      src={sku.image}
                      alt={sku.skuName}
                      className="w-9 h-9 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://placehold.co/36x36/E6ECF0/004368?text=?";
                      }}
                    />
                  </td>
                  <td className="py-3 pr-4 font-medium text-slate-800">
                    {sku.skuName}
                  </td>
                  <td className="py-3 pr-4 text-slate-700">{sku.skuTitle}</td>
                  <td className="py-3 pr-4 text-slate-600">{sku.weight}</td>
                  <td className="py-3 pr-4 text-slate-600 font-mono text-xs">
                    {sku.size}
                  </td>
                  <td className="py-3 pr-4 text-slate-500 text-xs">
                    {sku.createdAt}
                  </td>
                  <td className="py-3 pr-4 text-slate-500 text-xs">
                    {sku.updatedAt}
                  </td>
                  <td className="py-3 pr-4">
                    <button className="text-xs font-semibold text-primary hover:underline">
                      Details
                    </button>
                  </td>
                  <td className="py-3 pr-5">
                    <div
                      className="relative"
                      ref={(el) => (actionRefs.current[sku.id] = el)}
                    >
                      <button
                        onClick={() =>
                          setOpenActionId(
                            openActionId === sku.id ? null : sku.id,
                          )
                        }
                        className="flex items-center gap-0.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-surface-card transition-colors"
                      >
                        {[1, 2, 3].map((d) => (
                          <span
                            key={d}
                            className="w-1 h-1 rounded-full bg-current mx-px"
                          />
                        ))}
                      </button>
                      {openActionId === sku.id && (
                        <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-28">
                          {["Edit", "Delete"].map((a) => (
                            <button
                              key={a}
                              onClick={() => setOpenActionId(null)}
                              className={`w-full text-left px-4 py-2 text-xs transition-colors ${a === "Delete" ? "text-red-500 hover:bg-red-50" : "text-slate-700 hover:bg-surface-card"}`}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InvFooter />
      </div>

      {/* ── Add Single Merchant SKU Modal (Image 2) ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(200,210,220,0.55)",
            backdropFilter: "blur(3px)",
          }}
          onClick={(e) =>
            e.target === e.currentTarget && setShowAddModal(false)
          }
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden"
            style={{ maxWidth: "500px", animation: "popIn 0.18s ease both" }}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-7 pt-7 pb-2">
              <div>
                <h2 className="text-lg font-bold text-slate-800 font-display">
                  Add Single Merchant SKU
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Add a new Merchant SKU to your inventory.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-7 pb-7 space-y-4">
              {/* Photo upload */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-surface-border rounded-xl py-6 cursor-pointer hover:border-primary/40 transition-colors bg-surface">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                {form.photoPreview ? (
                  <img
                    src={form.photoPreview}
                    className="w-16 h-16 rounded-full object-cover mb-2"
                  />
                ) : (
                  <>
                    <UploadCloud size={28} className="text-slate-400 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">
                      Choose a file or drag & drop it here
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      JPEG or PNG, less than 5MB
                    </p>
                  </>
                )}
                <button
                  type="button"
                  className="mt-2 px-5 py-1.5 text-xs font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
                >
                  Browse File
                </button>
              </label>

              {/* Form fields 2-col */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "*Product Name",
                    name: "productName",
                    placeholder: "Write product name here",
                    required: true,
                  },
                  {
                    label: "*SKU Name",
                    name: "skuName",
                    placeholder: "Write SKU here",
                    required: true,
                  },
                  {
                    label: "*Product Details",
                    name: "productDetails",
                    placeholder: "Product details here",
                    required: true,
                  },
                  { label: "GTIN", name: "gtin", placeholder: "GTIN here" },
                  {
                    label: "Product Price",
                    name: "productPrice",
                    placeholder: "$0000",
                  },
                  {
                    label: "Weight",
                    name: "weight",
                    placeholder: "Product weight",
                  },
                ].map(({ label, name, placeholder, required }) => (
                  <div key={name}>
                    <label className="block text-xs text-slate-600 mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      name={name}
                      value={form[name]}
                      onChange={handleFormChange}
                      placeholder={placeholder}
                      className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none transition-all
                        ${errors[name] ? "border-red-300 focus:border-red-400" : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"}`}
                    />
                    {errors[name] && (
                      <p className="text-xs text-red-500 mt-0.5">
                        {errors[name]}
                      </p>
                    )}
                  </div>
                ))}

                {/* Size */}
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Size
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      ["length", "Length"],
                      ["width", "Width"],
                      ["height", "Height"],
                    ].map(([name, ph]) => (
                      <input
                        key={name}
                        type="text"
                        name={name}
                        value={form[name]}
                        onChange={handleFormChange}
                        placeholder={ph}
                        className="w-full px-2 py-2 text-xs border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                      />
                    ))}
                  </div>
                </div>

                {/* Select Warehouse */}
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Select Warehouse
                  </label>
                  <div className="relative">
                    <select
                      name="warehouse"
                      value={form.warehouse}
                      onChange={handleFormChange}
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
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {saving && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
          <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
      )}
    </div>
  );
}
