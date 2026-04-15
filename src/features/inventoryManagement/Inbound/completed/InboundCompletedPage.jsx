import { ChevronDown, AlertCircle, Loader2 } from 'lucide-react';
import Topbar from '../../../../components/layout/Topbar';
import InboundFilterBar    from '../draft/component/InboundFilterBar';
import InboundTable        from '../draft/component/InboundTable';
import { useInboundList }  from '../hooks/useInboundList';
import { useInboundDropdowns } from '../hooks/useInboundDropdowns';

// ─────────────────────────────────────────────────────────────────────────────
// InboundCompletedPage — Completed inbound list
// Actions: view detail (expand), delete (admin only)
// ─────────────────────────────────────────────────────────────────────────────

export default function InboundCompletedPage() {
    const {
        warehouseId, setWarehouseId,
        timeType, setTimeType,
        timeFilter, setTimeFilter,
        inboundType, setInboundType,
        search, setSearch,
        page, setPage,
        items, pagination,
        isLoading, isFetching, isError, error,
        selectedIds, toggleSelect, toggleAll,
        showDeleteModal, setShowDeleteModal,
        actionTarget,
        openDeleteModal,
        confirmDelete,
        deleting,
    } = useInboundList({ status: 'completed' });

    const { warehouseOptions, warehouseLoading } = useInboundDropdowns();

    // Completed rows: only action is delete (soft delete)
    const actionItems = [
        {
            label: 'Delete',
            onClick: openDeleteModal,
            danger: true,
            icon: ({ size, className }) => (
                <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
            ),
        },
    ];

    return (
        <div className="space-y-4 font-body">
            <Topbar PageTitle="Inbound" />

            <InboundFilterBar
                warehouseId={warehouseId} setWarehouseId={setWarehouseId}
                warehouseOptions={warehouseOptions} warehouseLoading={warehouseLoading}
                timeType={timeType} setTimeType={setTimeType}
                timeFilter={timeFilter} setTimeFilter={setTimeFilter}
                inboundType={inboundType} setInboundType={setInboundType}
                search={search} setSearch={setSearch}
                onSearch={() => setPage(1)}
            />

            <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
                <div className="px-5 py-4 border-b border-surface-border">
                    <h2 className="text-base font-bold text-slate-800 font-display">Completed Inbound List</h2>
                </div>

                <InboundTable
                    items={items}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onToggleAll={toggleAll}
                    actionItems={actionItems}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    isError={isError}
                    errorMessage={error?.response?.data?.message ?? 'Failed to load completed inbounds'}
                    onRetry={() => setPage(1)}
                />

                {!isLoading && !isError && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border">
                        <p className="text-xs text-slate-500">
                            {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-3 py-1 text-xs border border-surface-border rounded-lg disabled:opacity-40 hover:bg-surface-card">Previous</button>
                            <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                                className="px-3 py-1 text-xs border border-surface-border rounded-lg disabled:opacity-40 hover:bg-surface-card">Next</button>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
                    <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
                        Export <ChevronDown size={13} className="text-slate-400" />
                    </button>
                    <button className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">Print</button>
                </div>
            </div>

            {/* Delete confirm */}
            {showDeleteModal && actionTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(200,210,220,0.55)', backdropFilter: 'blur(3px)' }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7" style={{ animation: 'popIn 0.15s ease both' }}>
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <AlertCircle size={18} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-800 font-display">Delete Inbound Record</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Delete <span className="font-semibold">{actionTarget.inbound_id}</span>?
                                    <br /><span className="text-red-500 text-xs">This action cannot be undone.</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteModal(false)} disabled={deleting}
                                className="px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 hover:bg-surface-card disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} disabled={deleting}
                                className="px-5 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl disabled:opacity-60 flex items-center gap-2">
                                {deleting && <Loader2 size={13} className="animate-spin" />}
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                    <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
                </div>
            )}
        </div>
    );
}
