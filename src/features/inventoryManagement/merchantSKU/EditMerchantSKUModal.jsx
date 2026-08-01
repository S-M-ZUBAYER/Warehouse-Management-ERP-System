// EditMerchantSKUModal.jsx
import { useState, useEffect, useRef } from "react";
import { X, UploadCloud, ChevronDown, Search, Loader2 } from "lucide-react";

const formatDetailsForEdit = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  if (typeof value !== "string") return String(value);

  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return value;
  }
};

const formatDetailsForSave = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!["{", "["].includes(trimmed[0])) return trimmed;
  return JSON.stringify(JSON.parse(trimmed));
};

export default function EditMerchantSKUModal({
  sku,
  onClose,
  onSave,
  saving,
  warehouses = [],
  warehouseLoading,
}) {
  const [form, setForm] = useState({
    skuTitle: "",
    skuName: "",
    productDetails: "",
    gtin: "",
    price: "",
    costPrice: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    warehouseId: "",
    warehouseName: "",
    country: "",
    status: "active",
    image: null,
    photoPreview: "",
  });

  const [errors, setErrors] = useState({});
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const fileInputRef = useRef(null);
  const modalBodyRef = useRef(null);

  const filteredWarehouses = warehouses.filter((w) =>
    w.name.toLowerCase().includes(warehouseSearch.toLowerCase()),
  );

  useEffect(() => {
    if (!sku) return;

    setForm({
      skuTitle: sku.sku_title || sku.skuTitle || "",
      skuName: sku.sku_name || sku.skuName || "",
      productDetails: formatDetailsForEdit(
        sku.product_details ?? sku.productDetails ?? "",
      ),
      gtin: sku.gtin || "",
      price: sku.price || "",
      costPrice: sku.cost_price || sku.costPrice || "",
      weight: sku.weight || "",
      length: sku.length || "",
      width: sku.width || "",
      height: sku.height || "",
      warehouseId: sku.warehouse_id || sku.warehouseId || "",
      warehouseName: sku.warehouse?.name || sku.warehouse_name || "",
      country: sku.country || "",
      status: sku.status || "active",
      image: null,
      photoPreview: sku.image_url || sku.image || "",
    });
  }, [sku]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      image: file,
      photoPreview: URL.createObjectURL(file),
    }));
  };

  const handleWarehouseSelect = (warehouse) => {
    setForm((prev) => ({
      ...prev,
      warehouseId: String(warehouse.id),
      warehouseName: warehouse.name,
    }));
    setShowWarehousePicker(false);
    if (errors.warehouseId) {
      setErrors((prev) => ({ ...prev, warehouseId: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const trimmedDetails = form.productDetails.trim();

    if (!form.skuTitle.trim()) newErrors.skuTitle = "Product name is required";
    if (!form.skuName.trim()) newErrors.skuName = "SKU name is required";
    if (!trimmedDetails) newErrors.productDetails = "Product details are required";
    if (trimmedDetails && ["{", "["].includes(trimmedDetails[0])) {
      try {
        JSON.parse(trimmedDetails);
      } catch {
        newErrors.productDetails = "Details JSON is not valid";
      }
    }
    if (!form.warehouseId) newErrors.warehouseId = "Please select a warehouse";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    await onSave(sku.id, {
      ...form,
      productDetails: formatDetailsForSave(form.productDetails),
    });
  };

  const fields = [
    {
      label: "*Product Name",
      name: "skuTitle",
      placeholder: "Write product name here",
    },
    { label: "*SKU Name", name: "skuName", placeholder: "Write SKU here" },
    { label: "GTIN", name: "gtin", placeholder: "GTIN here" },
    { label: "Product Price", name: "price", placeholder: "180.00" },
    { label: "Cost Price", name: "costPrice", placeholder: "120.00" },
    { label: "Weight (kg)", name: "weight", placeholder: "Product weight" },
    { label: "Country", name: "country", placeholder: "Country of origin" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(200,210,220,0.55)",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden"
        style={{ maxWidth: "560px", animation: "popIn 0.18s ease both" }}
      >
        <div className="flex items-start justify-between px-7 pt-7 pb-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800 font-display">
              Edit Merchant SKU
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Update SKU information
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-1"
          >
            <X size={16} />
          </button>
        </div>

        <div
          ref={modalBodyRef}
          className={`px-7 space-y-4 max-h-[80vh] overflow-y-auto ${
            showWarehousePicker ? "pb-44" : "pb-7"
          }`}
        >
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-surface-border rounded-xl py-6 cursor-pointer hover:border-primary/40 transition-colors bg-surface">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {form.photoPreview ? (
              <img
                src={form.photoPreview}
                alt="Preview"
                className="w-16 h-16 rounded-full object-cover mb-2"
              />
            ) : (
              <>
                <UploadCloud size={28} className="text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  Choose a file or drag and drop it here
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  JPEG or PNG, less than 5MB
                </p>
              </>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-2 px-5 py-1.5 text-xs font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
            >
              Browse File
            </button>
          </label>

          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ label, name, placeholder }) => (
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
                    ${
                      errors[name]
                        ? "border-red-300 focus:border-red-400"
                        : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"
                    }`}
                />
                {errors[name] && (
                  <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>
                )}
              </div>
            ))}

            <div className="col-span-2">
              <label className="block text-xs text-slate-600 mb-1">
                *Product Details
              </label>
              <textarea
                name="productDetails"
                value={form.productDetails}
                onChange={handleFormChange}
                placeholder='Product details or JSON, e.g. {"platform":"tiktok","seller_sku":"Aface01N"}'
                rows={7}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none transition-all resize-y font-mono leading-5
                  ${
                    errors.productDetails
                      ? "border-red-300 focus:border-red-400"
                      : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"
                  }`}
              />
              {errors.productDetails && (
                <p className="text-xs text-red-500 mt-0.5">
                  {errors.productDetails}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Size (cm)
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

            <div className="relative">
              <label className="block text-xs text-slate-600 mb-1">
                Select Warehouse
              </label>
              <button
                type="button"
                disabled
                className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg bg-white text-left outline-none transition-all cursor-not-allowed disabled:opacity-100
                  ${
                    errors.warehouseId
                      ? "border-red-300"
                      : "border-surface-border focus:border-primary"
                  }`}
              >
                <span
                  className={
                    form.warehouseId ? "text-slate-700" : "text-slate-400"
                  }
                >
                  {form.warehouseName || "Warehouse name"}
                </span>
                <ChevronDown
                  size={13}
                  className="text-slate-400 flex-shrink-0"
                />
              </button>
              {errors.warehouseId && (
                <p className="text-xs text-red-500 mt-0.5">
                  {errors.warehouseId}
                </p>
              )}

              {false && showWarehousePicker && (
                <div className="mt-2 bg-white rounded-xl border border-surface-border shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-surface-border">
                    <div className="relative">
                      <Search
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Search warehouses..."
                        value={warehouseSearch}
                        onChange={(e) => setWarehouseSearch(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-xs border border-surface-border rounded-lg outline-none focus:border-primary"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto py-1">
                    {warehouseLoading ? (
                      <div className="px-4 py-3 text-xs text-slate-400 text-center">
                        <Loader2
                          size={14}
                          className="animate-spin inline mr-1"
                        />
                        Loading...
                      </div>
                    ) : filteredWarehouses.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-slate-400 text-center">
                        No warehouses found
                      </div>
                    ) : (
                      filteredWarehouses.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => handleWarehouseSelect(w)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-surface-card
                            ${String(form.warehouseId) === String(w.id) ? "text-primary font-semibold bg-primary/5" : "text-slate-700"}`}
                        >
                          {w.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Update SKU
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}
