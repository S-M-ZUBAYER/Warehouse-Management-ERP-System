import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// ManualInboundTable — dedicated table for manual inbound receipts
// All entries are always status=completed, no tracking/shipping fields
// ─────────────────────────────────────────────────────────────────────────────

export default function ManualInboundTable({
    items,
    selectedIds,
    onToggleSelect,
    onToggleAll,
    actionItems,
    isLoading = false,
    isFetching = false,
    isError = false,
    errorMessage = 'Failed to load manual inbound orders',
    onRetry,
}) {
    const [openActionId, setOpenActionId] = useState(null);
    const [expandedId,   setExpandedId]   = useState(null);
    const actionRefs = useRef({});

    const allSelected  = items.length > 0 && items.every((i) => selectedIds.includes(i.id));
    const someSelected = items.some((i) => selectedIds.includes(i.id)) && !allSelected;

    useEffect(() => {
        const handler = (e) => {
            if (openActionId !== null) {
                const ref = actionRefs.current[openActionId];
                if (ref && !ref.contains(e.target)) setOpenActionId(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [openActionId]);

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="w-4 h-4 bg-slate-200 rounded" />
                        <div className="w-24 h-4 bg-slate-200 rounded" />
                        <div className="w-9 h-9 bg-slate-200 rounded-lg" />
                        <div className="flex-1 h-4 bg-slate-200 rounded" />
                        <div className="w-20 h-4 bg-slate-200 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    // ── Error state ───────────────────────────────────────────────────────────
    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <p className="text-sm">{errorMessage}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="text-xs text-primary hover:underline"
                    >
                        Retry
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto font-body">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-surface-border">
                        <th className="py-3 pl-5 w-12 text-left">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                onChange={onToggleAll}
                                className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                            />
                        </th>
                        {['Inbound ID', 'Image', 'Warehouse Name', 'Supplier', 'Received Date', 'Details', 'Actions'].map((h) => (
                            <th key={h} className="py-3 pr-4 text-left text-sm font-semibold text-slate-700">{h}</th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-surface-border">
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="py-14 text-center text-sm text-slate-400">
                                {isFetching ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 size={14} className="animate-spin" /> Loading...
                                    </span>
                                ) : 'No manual inbound records found'}
                            </td>
                        </tr>
                    ) : (
                        items.map((item) => {
                            const isSelected = selectedIds.includes(item.id);
                            const imageUrl   = item.lines?.[0]?.merchantSku?.image_url ?? null;

                            return (
                                <>
                                    <tr
                                        key={item.id}
                                        className={`transition-colors hover:bg-surface/50 ${isSelected ? 'bg-blue-50/40' : ''}`}
                                    >
                                        {/* Checkbox */}
                                        <td className="pl-5 py-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => onToggleSelect(item.id)}
                                                className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                                            />
                                        </td>

                                        {/* Inbound ID */}
                                        <td className="py-3 pr-4 font-mono text-xs text-slate-700 font-medium">
                                            {item.inbound_id}
                                        </td>

                                        {/* Image — first line SKU */}
                                        <td className="py-3 pr-4">
                                            <img
                                                src={imageUrl || 'https://placehold.co/36x36/E6ECF0/004368?text=IB'}
                                                alt={item.inbound_id}
                                                className="w-9 h-9 rounded-lg object-cover"
                                                onError={(e) => { e.target.src = 'https://placehold.co/36x36/E6ECF0/004368?text=?'; }}
                                            />
                                        </td>

                                        {/* Warehouse */}
                                        <td className="py-3 pr-4 text-slate-700">
                                            {item.warehouse?.name ?? '—'}
                                        </td>

                                        {/* Supplier */}
                                        <td className="py-3 pr-4 text-slate-500 text-xs">
                                            {item.supplier_name ?? '—'}
                                        </td>

                                        {/* Received Date (arrived_at) */}
                                        <td className="py-3 pr-4 text-slate-500 text-xs">
                                            {item.arrived_at
                                                ? new Date(item.arrived_at).toLocaleDateString('en-GB', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                })
                                                : '—'}
                                        </td>

                                        {/* Expand chevron */}
                                        <td className="py-3 pr-4">
                                            <button
                                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                                            >
                                                <ChevronDown
                                                    size={16}
                                                    className={`transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                        </td>

                                        {/* 3-dot actions */}
                                        <td className="py-3 pr-5">
                                            <div className="relative" ref={(el) => (actionRefs.current[item.id] = el)}>
                                                <button
                                                    onClick={() => setOpenActionId(openActionId === item.id ? null : item.id)}
                                                    className="flex items-center gap-0.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-surface-card transition-colors"
                                                >
                                                    {[1, 2, 3].map((d) => (
                                                        <span key={d} className="w-1 h-1 rounded-full bg-current mx-px" />
                                                    ))}
                                                </button>

                                                {openActionId === item.id && actionItems?.length > 0 && (
                                                    <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1.5 w-36">
                                                        {actionItems.map(({ label, onClick, danger, icon: Icon }) => (
                                                            <button
                                                                key={label}
                                                                onClick={() => { onClick?.(item); setOpenActionId(null); }}
                                                                className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs transition-colors
                                                                    ${danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-700 hover:bg-surface-card'}`}
                                                            >
                                                                {Icon && <Icon size={13} className="text-slate-400" />}
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>

                                    {/* ── Expanded detail row ── */}
                                    {expandedId === item.id && (
                                        <tr key={`${item.id}-exp`} className="bg-surface/50">
                                            <td colSpan={8} className="px-10 py-4">
                                                {/* Summary fields */}
                                                <div className="grid grid-cols-4 gap-4 text-xs mb-3">
                                                    <div>
                                                        <p className="text-slate-400 mb-0.5">Inbound ID</p>
                                                        <p className="font-semibold text-slate-700">{item.inbound_id}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 mb-0.5">Warehouse</p>
                                                        <p className="font-semibold text-slate-700">{item.warehouse?.name ?? '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 mb-0.5">Supplier Name</p>
                                                        <p className="font-semibold text-slate-700">{item.supplier_name ?? '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 mb-0.5">Supplier Reference</p>
                                                        <p className="font-semibold text-slate-700">{item.supplier_reference ?? '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 mb-0.5">Received Date</p>
                                                        <p className="font-semibold text-slate-700">
                                                            {item.arrived_at
                                                                ? new Date(item.arrived_at).toLocaleDateString('en-GB')
                                                                : '—'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 mb-0.5">Notes</p>
                                                        <p className="font-semibold text-slate-700">{item.notes ?? '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 mb-0.5">Status</p>
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                                                            Completed
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 mb-0.5">Total SKUs</p>
                                                        <p className="font-semibold text-slate-700">{item.lines?.length ?? 0}</p>
                                                    </div>
                                                </div>

                                                {/* Lines sub-table */}
                                                {item.lines?.length > 0 && (
                                                    <div className="border border-surface-border rounded-lg overflow-hidden">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="bg-surface-card border-b border-surface-border">
                                                                    {['SKU', 'Product', 'Qty Received', 'Unit Cost'].map((h) => (
                                                                        <th key={h} className="py-2 px-3 text-left font-semibold text-slate-500">{h}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-surface-border">
                                                                {item.lines.map((line) => (
                                                                    <tr key={line.id} className="hover:bg-slate-50/60">
                                                                        <td className="py-2 px-3 font-mono text-slate-600">
                                                                            {line.merchantSku?.sku_name ?? '—'}
                                                                        </td>
                                                                        <td className="py-2 px-3 text-slate-700 truncate max-w-[180px]">
                                                                            {line.merchantSku?.sku_title ?? '—'}
                                                                        </td>
                                                                        <td className="py-2 px-3 font-semibold text-emerald-600">
                                                                            {line.qty_received ?? line.qty_expected}
                                                                        </td>
                                                                        <td className="py-2 px-3 text-slate-500">
                                                                            {line.unit_cost
                                                                                ? `${Number(line.unit_cost).toFixed(2)} ${line.currency ?? ''}`
                                                                                : '—'}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}