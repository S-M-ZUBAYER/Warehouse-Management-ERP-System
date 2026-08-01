import Topbar from '../../../../components/layout/Topbar';
import OutboundFilterBar    from '../draft/component/OutboundFilterBar';
import OutboundTable        from '../draft/component/OutboundTable';
import { useOutboundList }  from '../hooks/useOutboundList';
import { useOutboundDropdowns } from '../hooks/useOutboundDropdowns';
import { exportRowsToCsv, exportRowsToXlsx, printRows } from '../../../../utils/tableOutput';
import ExportMenu from '../../../../components/shared/ExportMenu';
import ListPageSizePagination from '../../../../components/shared/ListPageSizePagination';
import {
    buildOutboundOutputRows,
    outboundOutputColumns,
} from '../../shared/outboundOutput';

// ─────────────────────────────────────────────────────────────────────────────
// OutboundCompletedPage — Completed outbound list
// Details are available through row expansion.
// ─────────────────────────────────────────────────────────────────────────────

export default function OutboundCompletedPage() {
    const {
        warehouseId, setWarehouseId,
        timeType, setTimeType,
        dateFrom, setDateFrom,
        dateTo, setDateTo,
        outboundType, setOutboundType,
        search, setSearch,
        page, setPage,
        pageSizeInput, setPageSizeInput, applyPageSize,
        items, pagination,
        isLoading, isFetching, isError, error, refetch,
        selectedIds, selectedItems, selectionLoading, toggleSelect, toggleAll,
    } = useOutboundList({ status: 'completed' });

    const { warehouseOptions, warehouseLoading } = useOutboundDropdowns();
    const outputItems = selectedItems.length === selectedIds.length && selectedItems.length > 0
        ? selectedItems
        : selectedIds.length > 0
        ? items.filter((item) => selectedIds.includes(item.id))
        : items;

    return (
        <div className="space-y-4 font-body">
            <Topbar PageTitle="Outbound" />

            <OutboundFilterBar
                warehouseId={warehouseId} setWarehouseId={setWarehouseId}
                warehouseOptions={warehouseOptions} warehouseLoading={warehouseLoading}
                timeType={timeType} setTimeType={setTimeType}
                dateFrom={dateFrom} setDateFrom={setDateFrom}
                dateTo={dateTo} setDateTo={setDateTo}
                outboundType={outboundType} setOutboundType={setOutboundType}
                search={search} setSearch={setSearch}
                onSearch={() => setPage(1)}
            />

            <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
                <div className="px-5 py-4 border-b border-surface-border">
                    <h2 className="text-base font-bold text-slate-800 font-display">Completed Outbound List</h2>
                </div>

                <OutboundTable
                    items={items}
                    selectedIds={selectedIds}
                    selectionLoading={selectionLoading}
                    onToggleSelect={toggleSelect}
                    onToggleAll={toggleAll}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    isError={isError}
                    errorMessage={error?.response?.data?.message ?? 'Failed to load completed outbounds'}
                    onRetry={() => {
                        setPage(1);
                        refetch?.();
                    }}
                />

                {false && !isLoading && !isError && pagination.totalPages > 1 && (
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
                <ListPageSizePagination
                    page={page}
                    limit={pagination.limit || 10}
                    total={pagination.total || 0}
                    itemLabel="Inventory items"
                    pageSizeInput={pageSizeInput}
                    onPageChange={setPage}
                    onPageSizeInputChange={setPageSizeInput}
                    onApplyPageSize={applyPageSize}
                    loading={isFetching}
                />

                <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
                    <ExportMenu
                        onExportCsv={() => exportRowsToCsv(buildOutboundOutputRows(outputItems), outboundOutputColumns, 'completed-outbounds.csv', 'outbound')}
                        onExportXlsx={() => exportRowsToXlsx(buildOutboundOutputRows(outputItems), outboundOutputColumns, 'completed-outbounds.xlsx', 'outbound')}
                    />
                    <button
                        onClick={() => printRows(buildOutboundOutputRows(outputItems), outboundOutputColumns, 'Completed Outbounds', 'outbound')}
                        className="px-16 py-2.5 text-base font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors"
                    >
                        Print
                    </button>
                </div>
            </div>
        </div>
    );
}
