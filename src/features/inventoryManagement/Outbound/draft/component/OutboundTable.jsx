import { useState, useRef, useEffect } from 'react';
import { AlertCircle, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import PortalActionMenu from '../../../../../components/shared/PortalActionMenu';

// ─────────────────────────────────────────────────────────────────────────────
// OutboundTable — shared by Draft, OnTheWay, Completed
// actionItems: [{ label, icon, onClick, danger? }]
// status prop controls the expanded row status badge colour
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
    draft:      'bg-amber-50 text-amber-700 border-amber-200',
    on_the_way: 'bg-blue-50 text-blue-700 border-blue-200',
    completed:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled:  'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUS_LABELS = {
    draft: 'Draft', on_the_way: 'On The Way', completed: 'Completed', cancelled: 'Cancelled',
};

export default function OutboundTable({
    items,
    selectedIds,
    selectionLoading = false,
    onToggleSelect,
    onToggleAll,
    actionItems,
    isLoading = false,
    isFetching = false,
    isError = false,
    errorMessage = 'Failed to load outbound orders',
    onRetry,
}) {
    const [openActionId, setOpenActionId] = useState(null);
    const [expandedId,   setExpandedId]   = useState(null);
    const actionRefs = useRef({});
    const showActions = actionItems?.length > 0;
    const tableColSpan = showActions ? 7 : 6;
    const expandedColSpan = showActions ? 8 : 7;

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

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <AlertCircle size={36} className="text-red-400 opacity-70" />
                <p className="text-sm font-medium text-slate-700">{errorMessage}</p>
                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                        <RefreshCw size={12} /> Retry
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto font-body">
            <table className="w-full text-sm">
                <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                    <tr className="border-b border-surface-border">
                        <th className="py-3 pl-5 w-12 text-left">
                            {selectionLoading ? (
                                <Loader2 size={16} className="text-primary animate-spin" />
                            ) : (
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                    onChange={onToggleAll}
                                    className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                                />
                            )}
                        </th>
                        {[
                            'Outbound ID',
                            'Image',
                            'Warehouse Name',
                            'Estimated Arrival Time',
                            'Details',
                            ...(showActions ? ['Actions'] : []),
                        ].map((h) => (
                            <th key={h} className="py-3 pr-4 text-left text-sm font-semibold text-slate-700">{h}</th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-surface-border">
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={tableColSpan} className="py-14 text-center text-sm text-slate-400">
                                {isFetching ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 size={14} className="animate-spin" /> Loading...
                                    </span>
                                ) : 'No items found'}
                            </td>
                        </tr>
                    ) : (
                        items.map((item) => {
                            const isSelected = selectedIds.includes(item.id);
                            // First line SKU image as row image
                            const imageUrl = item.lines?.[0]?.merchantSku?.image_url ?? null;
                            const statusKey = item.status ?? 'draft';

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

                                        {/* Outbound ID */}
                                        <td className="py-3 pr-4 font-mono text-xs text-slate-700 font-medium">
                                            {item.outbound_id}
                                        </td>

                                        {/* Image */}
                                        <td className="py-3 pr-4">
                                            <img
                                                src={imageUrl || 'https://placehold.co/36x36/E6ECF0/004368?text=OB'}
                                                alt={item.outbound_id}
                                                className="w-9 h-9 rounded-lg object-cover"
                                                onError={(e) => { e.target.src = 'https://placehold.co/36x36/E6ECF0/004368?text=?'; }}
                                            />
                                        </td>

                                        {/* Warehouse Name */}
                                        <td className="py-3 pr-4 text-slate-700">
                                            {item.warehouse?.name ?? '—'}
                                        </td>

                                        {/* Estimated Arrival */}
                                        <td className="py-3 pr-4 text-slate-500 text-xs">
                                            {item.estimated_arrival
                                                ? new Date(item.estimated_arrival).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : '—'}
                                        </td>

                                        {/* Details expand chevron */}
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

                                        {showActions && (
                                            <td className="py-3 pr-5">
                                                <div className="relative" ref={(el) => (actionRefs.current[item.id] = el)}>
                                                    <button
                                                        onClick={() => setOpenActionId(openActionId === item.id ? null : item.id)}
                                                        className="flex items-center gap-0.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-surface-card transition-colors"
                                                    >
                                                        {[1, 2, 3].map((d) => <span key={d} className="w-1 h-1 rounded-full bg-current mx-px" />)}
                                                    </button>

                                                    <PortalActionMenu
                                                        open={openActionId === item.id && showActions}
                                                        anchorRef={{ current: actionRefs.current[item.id] }}
                                                        onClose={() => setOpenActionId(null)}
                                                        width={144}
                                                        className="py-1.5"
                                                    >
                                                        {actionItems.map(({ label, onClick, danger, icon: Icon }) => (
                                                            <button
                                                                key={label}
                                                                onClick={() => { onClick?.(item); setOpenActionId(null); }}
                                                                className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs transition-colors ${danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-700 hover:bg-surface-card'}`}
                                                            >
                                                                {Icon && <Icon size={13} className="text-slate-400" />}
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </PortalActionMenu>
                                                </div>
                                            </td>
                                        )}
                                    </tr>

                                    {/* Expanded detail row */}
                                    {expandedId === item.id && (
                                        <tr key={`${item.id}-exp`} className="bg-surface/50">
                                            <td colSpan={expandedColSpan} className="px-10 py-3">
                                                <div className="grid grid-cols-5 gap-4 text-xs">
                                                    <div>
                                                        <p className="text-slate-400 mb-0.5">Outbound ID</p>
                                                        <p className="font-semibold text-slate-700">{item.outbound_id}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 mb-0.5">Warehouse</p>
                                                        <p className="font-semibold text-slate-700">{item.warehouse?.name ?? '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 mb-0.5">Tracking No.</p>
                                                        <p className="font-semibold text-slate-700">{item.tracking_number ?? '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 mb-0.5">Estimated Arrival</p>
                                                        <p className="font-semibold text-slate-700">
                                                            {item.estimated_arrival
                                                                ? new Date(item.estimated_arrival).toLocaleDateString('en-GB')
                                                                : '—'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400 mb-0.5">Status</p>
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[statusKey] ?? STATUS_STYLES.draft}`}>
                                                            {STATUS_LABELS[statusKey] ?? statusKey}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Lines sub-table */}
                                                {item.lines?.length > 0 && (
                                                    <div className="mt-3 border border-surface-border rounded-lg overflow-hidden">
                                                        <table className="w-full text-xs">
                                                            <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                                                                <tr className="bg-surface-card border-b border-surface-border">
                                                                    {['SKU', 'Product', 'Qty Expected', 'Qty Received'].map((h) => (
                                                                        <th key={h} className="py-2 px-3 text-left font-semibold text-slate-500">{h}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-surface-border">
                                                                {item.lines.map((line) => (
                                                                    <tr key={line.id}>
                                                                        <td className="py-2 px-3 font-mono text-slate-600">{line.merchantSku?.sku_name ?? '—'}</td>
                                                                        <td className="py-2 px-3 text-slate-700 truncate max-w-[180px]">{line.merchantSku?.sku_title ?? '—'}</td>
                                                                        <td className="py-2 px-3 text-slate-700">{line.qty_expected}</td>
                                                                        <td className="py-2 px-3">
                                                                            {line.qty_received > 0 ? (
                                                                                <span className={line.qty_received !== line.qty_expected ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                                                                                    {line.qty_received}
                                                                                    {line.has_discrepancy && (
                                                                                        <span
                                                                                            className="ml-1 cursor-help"
                                                                                            title={line.discrepancy_notes || `Expected ${line.qty_expected}, received ${line.qty_received}`}
                                                                                        >
                                                                                            !
                                                                                        </span>
                                                                                    )}
                                                                                </span>
                                                                            ) : '—'}
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
