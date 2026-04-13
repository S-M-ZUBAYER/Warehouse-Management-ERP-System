import {
  X,
  UploadCloud,
  Search,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";

// ── Confirm Modal (shared) ────────────────────────────────────────────────────
export function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmClass,
  onCancel,
  onConfirm,
  loading,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(200,210,220,0.55)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7"
        style={{ animation: "popIn 0.15s ease both" }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">
              {title}
            </h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2 ${confirmClass}`}
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

// ── Add SKU Modal ─────────────────────────────────────────────────────────────
export function AddSkuModal({
  form,
  errors,
  fileInputRef,
  handleFormChange,
  handlePhotoChange,
  handleWarehouseSelect,
  handleSave,
  handleCloseModal,
  saving,
  warehouseSearch,
  setWarehouseSearch,
  modalWarehouses,
  warehouseLoading,
  isWarehouseError,
}) {
  const [warehouseDropdownOpen, setWarehouseDropdownOpen] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(200,210,220,0.55)",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) =>
        e.target === e.currentTarget && !saving && handleCloseModal()
      }
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden"
        style={{
          maxWidth: "500px",
          maxHeight: "90vh",
          overflowY: "auto",
          animation: "popIn 0.18s ease both",
        }}
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
            onClick={handleCloseModal}
            disabled={saving}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-1 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-7 pb-7 space-y-4">
          {/* Photo upload */}
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-surface-border rounded-xl py-6 cursor-pointer hover:border-primary/40 transition-colors bg-surface">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handlePhotoChange}
              className="hidden cursor-pointer"
            />
            {form.photoPreview ? (
              <div className="relative">
                <img
                  src={form.photoPreview}
                  className="w-16 h-16 rounded-full object-cover mb-2"
                  alt="preview"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFormChange({
                      target: { name: "photoFile", value: null },
                    });
                    handleFormChange({
                      target: { name: "photoPreview", value: null },
                    });
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
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

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "*Product Name",
                name: "productName",
                placeholder: "Write product name here",
              },
              {
                label: "*SKU Name",
                name: "skuName",
                placeholder: "Write SKU here",
              },
              {
                label: "*Product Details",
                name: "productDetails",
                placeholder: "Product details here",
              },
              { label: "GTIN", name: "gtin", placeholder: "GTIN here" },
              {
                label: "Product Price",
                name: "productPrice",
                placeholder: "$0000",
              },
              {
                label: "Weight (kg)",
                name: "weight",
                placeholder: "Product weight",
              },
            ].map(({ label, name, placeholder }) => (
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
                  disabled={saving}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none transition-all disabled:opacity-60
                    ${errors[name] ? "border-red-300 focus:border-red-400 bg-red-50/30" : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"}`}
                />
                {errors[name] && (
                  <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                    <AlertCircle size={10} /> {errors[name]}
                  </p>
                )}
              </div>
            ))}

            {/* Size */}
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
                    disabled={saving}
                    className="w-full px-2 py-2 text-xs border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary disabled:opacity-60"
                  />
                ))}
              </div>
            </div>

            {/* Warehouse Selector */}
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Select Warehouse
              </label>
              <div className="relative">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setWarehouseDropdownOpen((p) => !p)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs border border-surface-border rounded-lg bg-white text-slate-700 outline-none focus:border-primary disabled:opacity-60"
                >
                  <span
                    className={
                      form.warehouseId ? "text-slate-700" : "text-slate-400"
                    }
                  >
                    {form.warehouseName || "Select a warehouse..."}
                  </span>
                  <Search
                    size={13}
                    className={`text-slate-400 transition-transform ${warehouseDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {warehouseDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-surface-border rounded-lg shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-surface-border">
                      <div className="relative">
                        <Search
                          size={12}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          placeholder="Search warehouse..."
                          value={warehouseSearch}
                          onChange={(e) => setWarehouseSearch(e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 text-xs border border-surface-border rounded-md bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {isWarehouseError ? (
                        <div className="px-3 py-2 text-xs text-red-500 flex items-center gap-1.5">
                          <AlertCircle size={11} /> Failed to load warehouses
                        </div>
                      ) : warehouseLoading && modalWarehouses.length === 0 ? (
                        <div className="px-3 py-3 flex items-center justify-center gap-2 text-xs text-slate-400">
                          <Loader2 size={12} className="animate-spin" />{" "}
                          Loading...
                        </div>
                      ) : modalWarehouses.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-400">
                          No warehouses found
                        </div>
                      ) : (
                        modalWarehouses.map((wh) => (
                          <button
                            key={wh.id}
                            type="button"
                            onClick={() => {
                              handleWarehouseSelect(wh);
                              setWarehouseDropdownOpen(false);
                            }}
                            disabled={saving}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors border-b border-surface-border last:border-b-0
                              ${form.warehouseId === String(wh.id) ? "bg-primary/10 text-primary font-semibold" : "text-slate-600 hover:bg-surface-card"}`}
                          >
                            <span>
                              {wh.name}
                              {wh.code && (
                                <span className="ml-1.5 text-slate-400">
                                  ({wh.code})
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {wh.is_default && (
                                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                                  Default
                                </span>
                              )}
                              {form.warehouseId === String(wh.id) && (
                                <Check size={11} className="text-primary" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.warehouseId && (
                <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.warehouseId}
                </p>
              )}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={handleCloseModal}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2 min-w-[80px] justify-center"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
