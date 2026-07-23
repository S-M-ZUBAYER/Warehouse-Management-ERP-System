import { useState, useCallback, useMemo, useEffect } from 'react';
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

const fetchAllLedger = async (params, knownTotal = 0) => {
    const pageLimit = Math.max(100, Number(knownTotal) || Number(params.limit) || PAGE_SIZE);
    const first = await fetchLedger({ ...params, page: 1, limit: pageLimit });
    const totalPages = Number(first?.pagination?.totalPages) || 1;

    if (totalPages <= 1) return first?.data ?? [];

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
            fetchLedger({ ...params, page: index + 2, limit: pageLimit })
        )
    );

    return [...(first?.data ?? []), ...rest.flatMap((response) => response?.data ?? [])];
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

const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const PAGE_SIZE = 10;

const toPositiveNumber = (value, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
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
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectionLoading, setSelectionLoading] = useState(false);

    // const debouncedSearch = useDebounce(skuName, 350);

    const today = formatDateInput(new Date());

    const listParams = {
        page,
        limit: PAGE_SIZE,
        warehouseId: warehouseId || undefined,
        startDate: movementType === 'recent' ? today : appliedStartDate,
        endDate: movementType === 'recent' ? today : appliedEndDate,
        skuName: searchSku, // ✅ use this instead
    };

    // ── Ledger query ────────────────────────────────────────────────────────────
    const {
        data: ledgerData,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
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

    const items = useMemo(() => {
        if (Array.isArray(ledgerData?.data)) return ledgerData.data;
        if (Array.isArray(ledgerData)) return ledgerData;
        return [];
    }, [ledgerData]);
    const pagination = useMemo(() => {
        const apiPagination = ledgerData?.pagination ?? {};
        const limit = toPositiveNumber(apiPagination.limit, PAGE_SIZE);
        const total = toPositiveNumber(
            apiPagination.total ?? ledgerData?.total,
            items.length,
        );
        const totalPages = toPositiveNumber(
            apiPagination.totalPages,
            Math.max(1, Math.ceil(total / limit)),
        );

        return {
            total,
            totalPages,
            page: toPositiveNumber(apiPagination.page, page),
            limit,
        };
    }, [items.length, ledgerData, page]);
    const warehouses = warehouseData?.data ?? [];

    useEffect(() => {
        setSelectedItems((prev) => {
            const rowById = new Map(prev.map((item) => [item.id, item]));
            items.forEach((item) => {
                if (selectedIds.includes(item.id)) rowById.set(item.id, item);
            });
            return selectedIds.map((id) => rowById.get(id)).filter(Boolean);
        });
    }, [items, selectedIds]);

    // ── Selection ───────────────────────────────────────────────────────────────
    const toggleSelect = useCallback(
        (id) => {
            setSelectedIds((p) =>
                p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
            );
        },
        []
    );

    const toggleAll = useCallback(async () => {
        setSelectionLoading(true);
        const pageIds = items.map((i) => i.id);
        const allFilteredSelected =
            pagination.total > 0 &&
            selectedIds.length >= pagination.total &&
            pageIds.every((id) => selectedIds.includes(id));

        if (allFilteredSelected) {
            setSelectedIds([]);
            setSelectedItems([]);
            setSelectionLoading(false);
            return;
        }

        try {
            const allItems = await fetchAllLedger(listParams, pagination.total);
            setSelectedItems(allItems);
            setSelectedIds(allItems.map((item) => item.id));
        } catch (err) {
            console.error(err);
        } finally {
            setSelectionLoading(false);
        }
    }, [items, selectedIds, pagination.total, listParams]);

    // Reset page when filters change
    const handleSetWarehouseId = useCallback((val) => {
        setWarehouseId(val);
        setPage(1);
        setSelectedIds([]);
        setSelectedItems([]);
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
        setSelectedIds([]);
        setSelectedItems([]);
    }, []);

    const handleSetStartDate = useCallback((val) => {
        setStartDate(val);
        if (val) {
            setAppliedStartDate(val);
            setAppliedEndDate(endDate);
        }
        setPage(1);
        setSelectedIds([]);
        setSelectedItems([]);
    }, [endDate]);

    const handleSetEndDate = useCallback((val) => {
        setEndDate(val);
        if (val) {
            setAppliedStartDate(startDate);
            setAppliedEndDate(val);
        }
        setPage(1);
        setSelectedIds([]);
        setSelectedItems([]);
    }, [startDate]);

    const handleSearch = useCallback(() => {
        setSearchSku(skuName.trim());
        setPage(1);
        setSelectedIds([]);
        setSelectedItems([]);
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
        refetch,

        // selection
        selectedIds,
        selectedItems,
        selectionLoading,
        toggleSelect,
        toggleAll,
        allSelected:
            items.length > 0 && items.every((i) => selectedIds.includes(i.id)),
        someSelected: items.some((i) => selectedIds.includes(i.id)),
    };
}
