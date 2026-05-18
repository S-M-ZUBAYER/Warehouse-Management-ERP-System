import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../lib/api';

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
    if (params.startDate) qs.set('startDate', params.startDate);
    if (params.endDate) qs.set('endDate', params.endDate);
    if (params.skuName?.trim()) qs.set('skuName', params.skuName.trim()); // ✅ match backend
    return api.get(`/stock/ledger?${qs.toString()}`).then((r) => r);
};

const fetchWarehouses = () =>
    api.get('/warehouses?page=1&limit=100').then((r) => r);

// ─────────────────────────────────────────────────────────────────────────────
// Movement type options
// ─────────────────────────────────────────────────────────────────────────────
export const MOVEMENT_TYPE_OPTIONS = [
    { value: 'recent', label: 'Recent' },
    { value: 'history', label: 'History' },
];

const formatDateInput = (date) => date.toISOString().slice(0, 10);

const getLogDate = (log) => {
    const rawDate = log.createdAt ?? log.created_at;
    if (!rawDate) return '';
    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) return '';
    return formatDateInput(parsedDate);
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useInventoryLog() {
    // ── Filter state ────────────────────────────────────────────────────────────
    const [warehouseId, setWarehouseId] = useState('');
    const [movementType, setMovementType] = useState('recent');
    const [startDate, setStartDate] = useState(formatDateInput(new Date()));
    const [endDate, setEndDate] = useState(formatDateInput(new Date()));
    const [appliedStartDate, setAppliedStartDate] = useState(formatDateInput(new Date()));
    const [appliedEndDate, setAppliedEndDate] = useState(formatDateInput(new Date()));
    const [skuName, setSkuName] = useState("");       // input field
    const [searchSku, setSearchSku] = useState("");   // actual API param
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    // const debouncedSearch = useDebounce(skuName, 350);

    const listParams = {
        page,
        limit: 10,
        warehouseId: warehouseId || undefined,
        startDate: movementType === 'recent' ? formatDateInput(new Date()) : appliedStartDate,
        endDate: movementType === 'recent' ? formatDateInput(new Date()) : appliedEndDate,
        skuName: searchSku, // ✅ use this instead
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

    const rawItems = useMemo(() => ledgerData?.data ?? [], [ledgerData?.data]);
    const items = useMemo(() => {
        const today = formatDateInput(new Date());

        if (movementType === 'recent') {
            return rawItems.filter((log) => getLogDate(log) === today);
        }

        if (appliedStartDate && appliedEndDate) {
            return rawItems.filter((log) => {
                const logDate = getLogDate(log);
                return logDate && logDate >= appliedStartDate && logDate <= appliedEndDate;
            });
        }

        return rawItems;
    }, [rawItems, movementType, appliedStartDate, appliedEndDate]);
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
        const today = formatDateInput(new Date());
        setMovementType(val);
        if (val === 'history') {
            setStartDate(today);
            setEndDate(today);
            setAppliedStartDate(today);
            setAppliedEndDate(today);
        }
        setPage(1);
    }, []);

    const handleSetStartDate = useCallback((val) => {
        setStartDate(val);
        if (val) {
            setAppliedStartDate(val);
            setAppliedEndDate(endDate);
        }
        setPage(1);
    }, [endDate]);

    const handleSetEndDate = useCallback((val) => {
        setEndDate(val);
        if (val) {
            setAppliedStartDate(startDate);
            setAppliedEndDate(val);
        }
        setPage(1);
    }, [startDate]);

    const handleSearch = useCallback(() => {
        setSearchSku(skuName.trim());
        setPage(1);
    }, [skuName]);

    return {
        // filters
        warehouseId,
        setWarehouseId: handleSetWarehouseId,
        movementType,
        setMovementType: handleSetMovementType,
        startDate,
        setStartDate: handleSetStartDate,
        endDate,
        setEndDate: handleSetEndDate,
        skuName,
        setSkuName,
        handleSearch,
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
