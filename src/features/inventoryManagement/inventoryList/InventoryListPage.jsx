import { useRef, useEffect, useState } from 'react';
import {
    Search, ChevronDown, Trash2, X, Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import Topbar from '../../../components/layout/Topbar';
import StockAlertBadge from './component/StockAlertBadge';
import {
    useInventoryList,
    SKU_TYPE_OPTIONS,
    MAPPING_TABS,
} from './hooks/useInventoryList';

// ─────────────────────────────────────────────────────────────────────────────
// InventoryListPage — same design, real API
// ─────────────────────────────────────────────────────────────────────────────
export default function InventoryListPage() {
    // ── Dropdown open state ───────────────────────────────────────────────────
    const [showBulkDrop,      setShowBulkDrop]      = useState(false);
    const [showSkuDrop,       setShowSkuDrop]        = useState(false);
    const [showWarehouseDrop, setShowWarehouseDrop]  = useState(false);

    const bulkRef  = useRef(null);
    const skuRef   = useRef(null);
    const wareRef  = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (bulkRef.current  && !bulkRef.current.contains(e.target))  setShowBulkDrop(false);
            if (skuRef.current   && !skuRef.current.contains(e.target))   setShowSkuDrop(false);
            if (wareRef.current  && !wareRef.current.contains(e.target))  setShowWarehouseDrop(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const {
        // filter
        warehouseName, handleWarehouseSelect,
        warehouseOptions, dropdownsLoading,
        skuTypeLabel, handleSkuTypeSelect,
        searchInput, setSearchInput,
        handleSearch,
        mappingStatus, handleTabChange,
        counts,
        page, setPage,

        // data
        items, pagination,
        isLoading, isFetching, isError, error,

        // selection
        selectedIds, toggleSelect, toggleAll,
        allSelected, someSelected,

        // modals
        showStockAlertModal, setShowStockAlertModal,
        showSyncModal,       setShowSyncModal,
        showBatchDeleteModal, setShowBatchDeleteModal,
        minStock, setMinStock,

        // handlers
        handleBatchDelete,
        confirmBatchDelete,
        batchDeleting,

        handleStockAlertOpen,
        confirmSetStockAlert,
        stockAlertSaving,

        handleSyncOpen,
        confirmSync,
        syncing,
    } = useInventoryList();

    // ── Tab labels with counts ────────────────────────────────────────────────
    const tabsWithCounts = MAPPING_TABS.map((t) => ({
        ...t,
        displayLabel: `${t.label === 'All' ? 'All' : t.label} (${
            t.value === 'all'      ? counts.all      :
            t.value === 'unmapped' ? counts.unmapped :
            counts.mapped
        })`,
    }));

    return (
        <div className="space-y-4 font-body">
            <Topbar PageTitle="Inventory List" />

            {/* ── Filter Bar ── */}
            <div className="bg-white rounded-xl border border-surface-border p-4">
                <div className="flex items-end gap-3">
                    {/* Select Warehouse */}
                    <div className="flex-1 min-w-44">
                        <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Warehouse</p>
                        <div className="relative" ref={wareRef}>
                            <button
                                type="button"
                                onClick={() => setShowWarehouseDrop((p) => !p)}
                                className="w-full flex items-center justify-between pl-3 pr-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-500 hover:border-primary/40 transition-colors"
                            >
                                <span className="truncate">{warehouseName}</span>
                                {dropdownsLoading
                                    ? <Loader2 size={13} className="text-primary animate-spin flex-shrink-0" />
                                    : <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />
                                }
                            </button>
                            {showWarehouseDrop && (
                                <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 min-w-full w-max">
                                    {warehouseOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { handleWarehouseSelect(opt); setShowWarehouseDrop(false); }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                                warehouseName === opt.label
                                                    ? 'text-primary font-semibold bg-blue-50'
                                                    : 'text-slate-700 hover:bg-surface-card'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SKU Type dropdown (Image 3) */}
                    <div className="relative w-36" ref={skuRef}>
                        <button
                            type="button"
                            onClick={() => setShowSkuDrop((p) => !p)}
                            className="w-full flex items-center justify-between pl-3 pr-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 hover:border-primary/40 transition-colors"
                        >
                            <span>{skuTypeLabel}</span>
                            <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />
                        </button>
                        {showSkuDrop && (
                            <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 min-w-full w-40">
                                {SKU_TYPE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { handleSkuTypeSelect(opt); setShowSkuDrop(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                            skuTypeLabel === opt.label
                                                ? 'text-primary font-semibold bg-blue-50'
                                                : 'text-slate-700 hover:bg-surface-card'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Search input */}
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Search by ${skuTypeLabel}`}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                        {isFetching && !isLoading && (
                            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
                        )}
                    </div>

                    {/* Search button */}
                    <button
                        onClick={handleSearch}
                        className="px-6 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors whitespace-nowrap"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* ── Inventory List Card ── */}
            <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
                <div className="px-5 pt-5 pb-0">
                    <h2 className="text-base font-bold text-slate-800 font-display mb-4">Inventory List</h2>

                    {/* Action buttons row */}
                    <div className="flex items-center gap-3 mb-3">
                        {/* Bulk Action */}
                        <div className="relative" ref={bulkRef}>
                            <button
                                onClick={() => setShowBulkDrop((p) => !p)}
                                className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
                            >
                                Bulk Action
                                <ChevronDown size={13} className={`text-slate-400 transition-transform ${showBulkDrop ? 'rotate-180' : ''}`} />
                            </button>
                            {showBulkDrop && (
                                <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-44">
                                    <button
                                        onClick={() => { handleStockAlertOpen(); setShowBulkDrop(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors"
                                    >
                                        Stock alert settings
                                    </button>
                                    <button
                                        onClick={() => { handleBatchDelete(); setShowBulkDrop(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        Batch Delete
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Sync Stock */}
                        <button
                            onClick={handleSyncOpen}
                            className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
                        >
                            Sync Stock
                        </button>

                        {/* Selection count badge */}
                        {selectedIds.length > 0 && (
                            <span className="text-xs text-slate-500 bg-surface-card px-2.5 py-1 rounded-full">
                                {selectedIds.length} selected
                            </span>
                        )}
                    </div>

                    {/* Sub-tabs: All | Unmapped | Mapped */}
                    <div className="flex items-center gap-5 border-b border-surface-border">
                        {tabsWithCounts.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => handleTabChange(tab)}
                                className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative
                                    ${mappingStatus === tab.value
                                        ? 'text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                                        : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab.displayLabel}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <TableSkeleton />
                    ) : isError ? (
                        <TableError
                            message={error?.response?.data?.message ?? error?.message ?? 'Failed to load inventory'}
                            onRetry={() => setPage(1)}
                        />
                    ) : (
                        <table className="w-full text-sm font-body">
                            <thead>
                                <tr className="border-b border-surface-border">
                                    <th className="py-3 pl-5 w-36 text-left">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                                onChange={toggleAll}
                                                className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                                            />
                                            <span className="pl-2 text-base font-semibold text-primary-text">Select All</span>
                                        </label>
                                    </th>
                                    {[
                                        { label: 'Image',          cls: 'w-14' },
                                        { label: 'SKU Name',       cls: 'w-28' },
                                        { label: 'Warehouse Name', cls: '' },
                                        { label: 'Quantity',       cls: 'w-24 text-right pr-12' },
                                        { label: 'Stock Alert',    cls: 'w-36' },
                                        { label: 'Action',         cls: 'w-16 pr-5' },
                                    ].map(({ label, cls }) => (
                                        <th key={label} className={`py-3 pr-4 text-left text-xs font-semibold text-slate-600 ${cls}`}>
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-surface-border">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-14 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Search size={28} className="opacity-30" />
                                                <p className="text-sm">No inventory items found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => {
                                        const isSelected = selectedIds.includes(item.id);

                                        // Derive stock alert status from API data
                                        const alertStatus = deriveAlertStatus(item);

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`transition-colors hover:bg-surface/50 ${isSelected ? 'bg-blue-50/40' : ''}`}
                                            >
                                                {/* Checkbox */}
                                                <td className="pl-5 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(item.id)}
                                                        className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                                                    />
                                                </td>

                                                {/* Image */}
                                                <td className="py-3 pr-4">
                                                    <img
                                                        src={item.merchantSku?.image_url || item.image_url || 'https://placehold.co/36x36/E6ECF0/004368?text=?'}
                                                        alt={item.merchantSku?.sku_name ?? 'SKU'}
                                                        className="w-9 h-9 rounded-lg object-cover"
                                                        onError={(e) => { e.target.src = 'https://placehold.co/36x36/E6ECF0/004368?text=?'; }}
                                                    />
                                                </td>

                                                {/* SKU Name */}
                                                <td className="py-3 pr-4 font-medium text-slate-800 font-mono text-xs">
                                                    {item.merchantSku?.sku_name ?? item.sku_name ?? '—'}
                                                </td>

                                                {/* Warehouse Name */}
                                                <td className="py-3 pr-4 text-slate-700">
                                                    {item.warehouse?.name ?? '—'}
                                                </td>

                                                {/* Quantity */}
                                                <td className="py-3 pr-12 text-right text-slate-700 font-medium">
                                                    {String(item.qty_on_hand ?? 0).padStart(2, '0')}
                                                </td>

                                                {/* Stock Alert badge */}
                                                <td className="py-3 pr-4">
                                                    <StockAlertBadge status={alertStatus} />
                                                </td>

                                                {/* Action — delete */}
                                                <td className="py-3 pr-5">
                                                    <button
                                                        onClick={() => {
                                                            // Single delete: select this item then open batch delete
                                                            // handled via dedicated single-delete if needed
                                                            // For now mirrors the Figma design: opens batch delete with this single item
                                                            const alreadySelected = selectedIds.includes(item.id);
                                                            if (!alreadySelected) toggleSelect(item.id);
                                                            setShowBatchDeleteModal(true);
                                                        }}
                                                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {!isLoading && !isError && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border">
                        <p className="text-xs text-slate-500">
                            Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-xs border border-surface-border rounded-lg disabled:opacity-40 hover:bg-surface-card transition-colors"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-8 h-8 text-xs rounded-lg border transition-colors ${
                                        page === p
                                            ? 'bg-primary text-white border-primary'
                                            : 'border-surface-border text-slate-600 hover:bg-surface-card'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="px-3 py-1.5 text-xs border border-surface-border rounded-lg disabled:opacity-40 hover:bg-surface-card transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

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

            {/* ═══════════════════════════════════════════════════════════════
                Set Stock Alert Modal (Image 4)
            ═══════════════════════════════════════════════════════════════ */}
            {showStockAlertModal && (
                <Modal onClose={() => !stockAlertSaving && setShowStockAlertModal(false)}>
                    <div className="p-8 text-center">
                        <h2 className="text-lg font-bold text-slate-800 font-display mb-1.5">Set Stock Alert</h2>
                        <p className="text-sm text-slate-500 mb-2">
                            Applies to <span className="font-semibold text-primary">{selectedIds.length} selected SKU(s)</span>
                        </p>
                        <p className="text-xs text-slate-400 mb-6">Set minimum stock to alert the user</p>

                        <div className="text-left mb-5">
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Set minimum Stock
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={minStock}
                                onChange={(e) => setMinStock(e.target.value)}
                                placeholder="Minimum Stock Quantity here"
                                className="w-full px-3.5 py-2.5 text-sm border border-surface-border rounded-xl bg-white
                                           text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowStockAlertModal(false)}
                                disabled={stockAlertSaving}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSetStockAlert}
                                disabled={stockAlertSaving}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {stockAlertSaving && <Loader2 size={14} className="animate-spin" />}
                                {stockAlertSaving ? 'Saving...' : 'Set'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                Sync Stock Confirm Modal (Image 5)
            ═══════════════════════════════════════════════════════════════ */}
            {showSyncModal && (
                <Modal onClose={() => !syncing && setShowSyncModal(false)}>
                    <div className="p-8 text-center">
                        <h2 className="text-lg font-bold text-slate-800 font-display mb-2">
                            Are you sure you want to Sync?
                        </h2>
                        <p className="text-sm text-slate-500 mb-2">
                            {selectedIds.length > 0
                                ? <>Stock for <span className="font-semibold text-primary">{selectedIds.length} selected mapped SKU(s)</span> will be synced with platforms.</>
                                : 'All mapped SKU stock will be synced with platforms.'}
                        </p>
                        <p className="text-xs text-slate-400 mb-7">Only mapped SKUs are eligible for sync.</p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSyncModal(false)}
                                disabled={syncing}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSync}
                                disabled={syncing}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {syncing && <Loader2 size={14} className="animate-spin" />}
                                {syncing ? 'Syncing...' : 'Sync'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                Batch Delete Confirm Modal
            ═══════════════════════════════════════════════════════════════ */}
            {showBatchDeleteModal && (
                <Modal onClose={() => !batchDeleting && setShowBatchDeleteModal(false)}>
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={22} className="text-red-500" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 font-display mb-2">Delete Items</h2>
                        <p className="text-sm text-slate-500 mb-1">
                            Delete <span className="font-semibold text-red-600">{selectedIds.length} selected item(s)</span> from inventory?
                        </p>
                        <p className="text-xs text-slate-400 mb-7">
                            This action cannot be undone. Items with stock on hand may be blocked.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBatchDeleteModal(false)}
                                disabled={batchDeleting}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBatchDelete}
                                disabled={batchDeleting}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {batchDeleting && <Loader2 size={14} className="animate-spin" />}
                                {batchDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive stock alert status from the API stock record.
 * The backend returns sku_warehouse_stock with qty_on_hand and optionally
 * a min_stock_alert field (if the user has set one).
 */
function deriveAlertStatus(item) {
    // Use pre-computed status from API if available
    if (item.stock_alert_status) return item.stock_alert_status;

    const qty      = item.qty_on_hand   ?? 0;
    const minStock = item.min_stock     ?? null;  // null = no alert configured

    if (minStock === null) return 'No Alert';
    if (qty === 0)         return 'Out of Stock';
    if (qty <= minStock)   return 'Low Stock';
    return 'In Stock';
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Modal({ children, onClose }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(200,210,220,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full font-body"
                style={{ maxWidth: '380px', animation: 'popIn 0.18s ease both' }}
            >
                {children}
            </div>
            <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-4 h-4 bg-slate-200 rounded" />
                    <div className="w-9 h-9 bg-slate-200 rounded-lg" />
                    <div className="w-20 h-4 bg-slate-200 rounded" />
                    <div className="flex-1 h-4 bg-slate-200 rounded" />
                    <div className="w-12 h-4 bg-slate-200 rounded" />
                    <div className="w-20 h-6 bg-slate-200 rounded-full" />
                </div>
            ))}
        </div>
    );
}

function TableError({ message, onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <AlertCircle size={32} className="text-red-400 opacity-70" />
            <p className="text-sm">{message}</p>
            <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
            >
                <RefreshCw size={12} /> Retry
            </button>
        </div>
    );
}
