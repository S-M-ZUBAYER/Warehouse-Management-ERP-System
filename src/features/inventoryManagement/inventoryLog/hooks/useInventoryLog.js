import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../lib/api';
import useDebounce from '../../../../hooks/useDebounce';

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────
export const INVENTORY_LOG_KEYS = {
    all: () => ['inventoryLog'],
    list: (params) => ['inventoryLog', 'list', params],
};

export const WAREHOUSE_KEYS = {
    list: () => ['warehouses', 'list'],
};

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────
const fetchLedger = (params) => {
    const qs = new URLSearchParams();
    qs.set('page', params.page ?? 1);
    qs.set('limit', params.limit ?? 10);
    if (params.warehouseId) qs.set('warehouseId', params.warehouseId);
    if (params.movementType) qs.set('movementType', params.movementType);
    if (params.search?.trim()) qs.set('search', params.search.trim());
    return api.get(`/stock/ledger?${qs.toString()}`).then((r) => r);
};

const fetchWarehouses = () =>
    api.get('/warehouses?page=1&limit=100').then((r) => r);

// ─────────────────────────────────────────────────────────────────────────────
// Movement type options
// ─────────────────────────────────────────────────────────────────────────────
export const MOVEMENT_TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'inbound', label: 'Inbound' },
    { value: 'sale_deduction', label: 'Sale Deduction' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'return', label: 'Return' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useInventoryLog() {
    // ── Filter state ────────────────────────────────────────────────────────────
    const [warehouseId, setWarehouseId] = useState('');
    const [movementType, setMovementType] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    const debouncedSearch = useDebounce(search, 350);

    const listParams = {
        page,
        limit: 10,
        warehouseId: warehouseId || undefined,
        movementType: movementType || undefined,
        search: debouncedSearch,
    };

    // ── Ledger query ────────────────────────────────────────────────────────────
    const {
        data: ledgerData,
        isLoading,
        isFetching,
        isError,
        error,
    } = useQuery({
        queryKey: INVENTORY_LOG_KEYS.list(listParams),
        queryFn: () => fetchLedger(listParams),
        staleTime: 1000 * 60 * 1,
        gcTime: 1000 * 60 * 3,
        placeholderData: (prev) => prev,
    });

    // ── Warehouses query ────────────────────────────────────────────────────────
    const { data: warehouseData } = useQuery({
        queryKey: WAREHOUSE_KEYS.list(),
        queryFn: fetchWarehouses,
        staleTime: 1000 * 60 * 5,
    });

    const items = ledgerData?.data ?? [];
    const pagination = ledgerData?.pagination ?? {
        total: 0,
        totalPages: 1,
        page: 1,
        limit: 10,
    };
    const warehouses = warehouseData?.data ?? [];

    // ── Selection ───────────────────────────────────────────────────────────────
    const toggleSelect = useCallback(
        (id) => {
            setSelectedIds((p) =>
                p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
            );
        },
        []
    );

    const toggleAll = useCallback(() => {
        const ids = items.map((i) => i.id);
        const allSel = ids.every((id) => selectedIds.includes(id));
        setSelectedIds(allSel ? [] : ids);
    }, [items, selectedIds]);

    // Reset page when filters change
    const handleSetWarehouseId = useCallback((val) => {
        setWarehouseId(val);
        setPage(1);
    }, []);

    const handleSetMovementType = useCallback((val) => {
        setMovementType(val);
        setPage(1);
    }, []);

    const handleSetSearch = useCallback((val) => {
        setSearch(val);
        setPage(1);
    }, []);

    return {
        // filters
        warehouseId,
        setWarehouseId: handleSetWarehouseId,
        movementType,
        setMovementType: handleSetMovementType,
        search,
        setSearch: handleSetSearch,
        page,
        setPage,

        // data
        items,
        pagination,
        warehouses,
        isLoading,
        isFetching,
        isError,
        error,

        // selection
        selectedIds,
        toggleSelect,
        toggleAll,
        allSelected:
            items.length > 0 && items.every((i) => selectedIds.includes(i.id)),
        someSelected: items.some((i) => selectedIds.includes(i.id)),
    };
}