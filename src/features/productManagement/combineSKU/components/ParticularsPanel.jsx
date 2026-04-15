import { Trash2, Plus, Minus, AlertCircle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// ParticularsPanel — right panel of Create Combine SKU page
// Same design — updated to use API field names from useCombineSKU
// selectedSkus shape: { id, sku, name, image, price, combineQty }
// ─────────────────────────────────────────────────────────────────────────────

function FormField({ label, name, value, onChange, placeholder, error, type = "text", required, disabled }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-body">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface
                            placeholder-slate-400 text-slate-700 outline-none transition-all disabled:opacity-60
                            ${error
                                ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"}`}
            />
            {error && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {error}
                </p>
            )}
        </div>
    );
}

export default function ParticularsPanel({
    selectedSkus,
    onRemove,
    onUpdateQty,
    particulars,
    onChange,
    errors,
    saving = false,
}) {
    return (
        <div className="flex flex-col gap-5 h-full font-body">
            {/* ── Selected SKUs list ── */}
            <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
                <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between">
                    <h3 className="text-sm font-bold text-primary font-display">Particulars</h3>
                    {selectedSkus.length > 0 && (
                        <span className="text-xs text-slate-500">{selectedSkus.length} item(s)</span>
                    )}
                </div>

                {/* Table header */}
                {selectedSkus.length > 0 && (
                    <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-surface-card border-b border-surface-border">
                        {["", "Product", "SKU", "Price", "Qty", ""].map((h, i) => (
                            <div
                                key={i}
                                className={`text-xs font-semibold text-slate-500 uppercase tracking-wide
                                    ${i === 0 ? "col-span-1" : i === 1 ? "col-span-4" : i === 2 ? "col-span-2" : i === 3 ? "col-span-2" : i === 4 ? "col-span-2" : "col-span-1"}`}
                            >
                                {h}
                            </div>
                        ))}
                    </div>
                )}

                {/* Selected rows */}
                <div className="divide-y divide-surface-border max-h-48 overflow-y-auto">
                    {selectedSkus.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-10 h-10 rounded-full bg-surface-card flex items-center justify-center mb-3">
                                <Plus size={18} className="text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-400">Select SKUs from the left panel</p>
                            {errors.skus && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                    <AlertCircle size={10} /> {errors.skus}
                                </p>
                            )}
                        </div>
                    ) : (
                        selectedSkus.map((sku) => (
                            <div key={sku.id} className="grid grid-cols-12 gap-2 items-center px-5 py-3">
                                {/* Image */}
                                <div className="col-span-1">
                                    <img
                                        src={sku.image || `https://placehold.co/32x32/E6ECF0/004368?text=?`}
                                        alt={sku.name}
                                        className="w-8 h-8 rounded-lg object-cover border border-surface-border"
                                        onError={(e) => { e.target.src = "https://placehold.co/32x32/E6ECF0/004368?text=?"; }}
                                    />
                                </div>

                                {/* Name */}
                                <div className="col-span-4 min-w-0">
                                    <p className="text-xs font-medium text-slate-700 truncate" title={sku.name}>
                                        {sku.name}
                                    </p>
                                </div>

                                {/* SKU code */}
                                <div className="col-span-2">
                                    <span className="text-xs font-mono text-slate-500">{sku.sku}</span>
                                </div>

                                {/* Price */}
                                <div className="col-span-2">
                                    <span className="text-xs font-semibold text-slate-700">
                                        ${Number(sku.price ?? 0).toFixed(2)}
                                    </span>
                                </div>

                                {/* Qty stepper */}
                                <div className="col-span-2 flex items-center gap-1">
                                    <button
                                        onClick={() => onUpdateQty(sku.id, sku.combineQty - 1)}
                                        disabled={saving}
                                        className="w-6 h-6 rounded-md border border-surface-border flex items-center justify-center
                                                   text-slate-500 hover:bg-surface-card transition-colors disabled:opacity-50"
                                    >
                                        <Minus size={11} />
                                    </button>
                                    <span className="w-6 text-center text-xs font-semibold text-slate-700">
                                        {sku.combineQty}
                                    </span>
                                    <button
                                        onClick={() => onUpdateQty(sku.id, sku.combineQty + 1)}
                                        disabled={saving}
                                        className="w-6 h-6 rounded-md border border-surface-border flex items-center justify-center
                                                   text-slate-500 hover:bg-surface-card transition-colors disabled:opacity-50"
                                    >
                                        <Plus size={11} />
                                    </button>
                                </div>

                                {/* Remove */}
                                <div className="col-span-1 flex justify-end">
                                    <button
                                        onClick={() => onRemove(sku.id)}
                                        disabled={saving}
                                        className="w-6 h-6 rounded-md flex items-center justify-center
                                                   text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── Form fields ── */}
            <div className="bg-white rounded-xl border border-surface-border p-5 space-y-4">
                <h4 className="text-sm font-bold text-primary font-display">Combine SKU Details</h4>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <FormField
                            label="Combine SKU Name"
                            name="combineName"
                            value={particulars.combineName}
                            onChange={onChange}
                            placeholder="e.g. Bundle Pack - Headphones + Stand"
                            error={errors.combineName}
                            required
                            disabled={saving}
                        />
                    </div>

                    <FormField
                        label="Combine SKU Code"
                        name="combineSkuCode"
                        value={particulars.combineSkuCode}
                        onChange={onChange}
                        placeholder="e.g. CSKU-001"
                        error={errors.combineSkuCode}
                        required
                        disabled={saving}
                    />

                    <FormField
                        label="Weight (kg)"
                        name="weight"
                        type="number"
                        value={particulars.weight}
                        onChange={onChange}
                        placeholder="0.00"
                        disabled={saving}
                    />

                    <FormField
                        label="Selling Price"
                        name="sellingPrice"
                        type="number"
                        value={particulars.sellingPrice}
                        onChange={onChange}
                        placeholder="0.00"
                        disabled={saving}
                    />

                    <FormField
                        label="Cost Price"
                        name="costPrice"
                        type="number"
                        value={particulars.costPrice}
                        onChange={onChange}
                        placeholder="0.00"
                        disabled={saving}
                    />

                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                        <textarea
                            name="description"
                            value={particulars.description}
                            onChange={onChange}
                            placeholder="Describe this combined SKU bundle…"
                            rows={3}
                            disabled={saving}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-surface-border
                                       bg-surface placeholder-slate-400 text-slate-700 outline-none resize-none
                                       focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-60"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
