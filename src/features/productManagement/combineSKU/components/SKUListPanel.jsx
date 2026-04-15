import { Search, X, CheckSquare, Square, Loader2, AlertCircle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// SKUListPanel — left panel of Create Combine SKU page
// Receives real API data from useCombineSKU hook
// Field mapping: sku_name, sku_title, image_url, available_in_inventory
// ─────────────────────────────────────────────────────────────────────────────

export default function SKUListPanel({
    search,
    onSearch,
    skus,
    selectedSkus,
    onToggle,
    loading = false,
    fetching = false,
    isError = false,
}) {
    const selectedIds = selectedSkus.map((s) => s.id);

    return (
        <div
            className="flex flex-col bg-white rounded-xl border border-surface-border overflow-hidden h-full"
            style={{ minHeight: "520px" }}
        >
            {/* Panel header */}
            <div className="px-5 py-4 border-b border-surface-border">
                <h3 className="text-sm font-bold font-display text-primary mb-3">
                    Select SKUs
                    {selectedIds.length > 0 && (
                        <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-white">
                            {selectedIds.length} selected
                        </span>
                    )}
                </h3>

                {/* Search */}
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search SKU or product name…"
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm bg-surface rounded-lg border border-surface-border
                                   placeholder-slate-400 text-slate-700 outline-none
                                   focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                    {fetching && !loading && (
                        <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary animate-spin" />
                    )}
                    {!fetching && search && (
                        <button onClick={() => onSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* SKU rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-surface-border">
                {loading ? (
                    <div className="flex items-center justify-center h-32 gap-2 text-xs text-slate-400">
                        <Loader2 size={16} className="animate-spin text-primary" /> Loading SKUs...
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-400">
                        <AlertCircle size={20} className="text-red-400" />
                        <p className="text-xs">Failed to load SKUs</p>
                    </div>
                ) : skus.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-sm text-slate-400">
                        No SKUs found
                    </div>
                ) : (
                    skus.map((sku) => {
                        const isSelected = selectedIds.includes(sku.id);
                        const available  = sku.available_in_inventory ?? 0;

                        return (
                            <button
                                key={sku.id}
                                onClick={() => onToggle(sku)}
                                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors
                                    ${isSelected ? "bg-blue-50/70 hover:bg-blue-50" : "hover:bg-surface-card"}`}
                            >
                                {/* Checkbox indicator */}
                                <div className={`flex-shrink-0 ${isSelected ? "text-primary" : "text-slate-300"}`}>
                                    {isSelected ? <CheckSquare size={17} strokeWidth={2} /> : <Square size={17} strokeWidth={1.5} />}
                                </div>

                                {/* Image */}
                                <img
                                    src={sku.image_url || `https://placehold.co/36x36/E6ECF0/004368?text=${sku.sku_name?.[0] ?? "?"}`}
                                    alt={sku.sku_title}
                                    className="w-9 h-9 rounded-lg object-cover border border-surface-border flex-shrink-0"
                                    onError={(e) => { e.target.src = "https://placehold.co/36x36/E6ECF0/004368?text=?"; }}
                                />

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate font-medium ${isSelected ? "text-primary" : "text-slate-700"}`}>
                                        {sku.sku_title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs font-mono text-slate-400">{sku.sku_name}</span>
                                        <span className="text-xs text-slate-300">·</span>
                                        <span className={`text-xs font-semibold ${available === 0 ? "text-red-500" : available < 50 ? "text-amber-500" : "text-emerald-600"}`}>
                                            {available.toLocaleString()} in stock
                                        </span>
                                    </div>
                                </div>

                                {/* Price */}
                                {sku.price != null && (
                                    <span className="text-sm font-semibold text-slate-700 flex-shrink-0">
                                        ${Number(sku.price).toFixed(2)}
                                    </span>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
