import Topbar from '../../../../components/layout/Topbar';
import InboundFilterBar    from '../draft/component/InboundFilterBar';
import InboundTable        from '../draft/component/InboundTable';
import { useInboundList }  from '../hooks/useInboundList';
import { useInboundDropdowns } from '../hooks/useInboundDropdowns';
import { exportRowsToCsv, exportRowsToXlsx, printRows } from '../../../../utils/tableOutput';
import ExportMenu from '../../../../components/shared/ExportMenu';
import ListPageSizePagination from '../../../../components/shared/ListPageSizePagination';
import {
    buildInboundOutputRows,
    inboundOutputColumns,
} from '../../shared/inboundOutput';

// ─────────────────────────────────────────────────────────────────────────────
// InboundCompletedPage — Completed inbound list
// Details are available through row expansion.
// ─────────────────────────────────────────────────────────────────────────────

export default function InboundCompletedPage() {
    const {
        warehouseId, setWarehouseId,
        timeType, setTimeType,
        dateFrom, setDateFrom,
        dateTo, setDateTo,
        inboundType, setInboundType,
        search, setSearch,
        page, setPage,
        pageSizeInput, setPageSizeInput, applyPageSize,
        items, pagination,
        isLoading, isFetching, isError, error, refetch,
        selectedIds, selectedItems, selectionLoading, toggleSelect, toggleAll,
    } = useInboundList({ status: 'completed' });

    const { warehouseOptions, warehouseLoading } = useInboundDropdowns();
    const outputItems = selectedItems.length === selectedIds.length && selectedItems.length > 0
        ? selectedItems
        : selectedIds.length > 0
            ? items.filter((item) => selectedIds.includes(item.id))
            : items;
    return (
        <div className="space-y-4 font-body">
            <Topbar PageTitle="Inbound" />

            <InboundFilterBar
                warehouseId={warehouseId} setWarehouseId={setWarehouseId}
                warehouseOptions={warehouseOptions} warehouseLoading={warehouseLoading}
                timeType={timeType} setTimeType={setTimeType}
                dateFrom={dateFrom} setDateFrom={setDateFrom}
                dateTo={dateTo} setDateTo={setDateTo}
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
                    selectionLoading={selectionLoading}
                    onToggleSelect={toggleSelect}
                    onToggleAll={toggleAll}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    isError={isError}
                    errorMessage={error?.response?.data?.message ?? 'Failed to load completed inbounds'}
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
                        onExportCsv={() => exportRowsToCsv(buildInboundOutputRows(outputItems), inboundOutputColumns, 'completed-inbounds.csv', 'inbound')}
                        onExportXlsx={() => exportRowsToXlsx(buildInboundOutputRows(outputItems), inboundOutputColumns, 'completed-inbounds.xlsx', 'inbound')}
                    />
                    <button
                        onClick={() => printRows(buildInboundOutputRows(outputItems), inboundOutputColumns, 'Completed Inbounds', 'inbound')}
                        className="px-16 py-2.5 text-base font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors"
                    >
                        Print
                    </button>
                </div>
            </div>
        </div>
    );
}
