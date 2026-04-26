import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../../lib/api';
import useDebounce from '../../../../hooks/useDebounce';

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────
export const MANUAL_INBOUND_KEYS = {
    all:    ()       => ['manual_inbound'],
    list:   (params) => ['manual_inbound', 'list', params],
    detail: (id)     => ['manual_inbound', 'detail', id],
};

// ─────────────────────────────────────────────────────────────────────────────
// API helper — GET /inbound/manual
// ─────────────────────────────────────────────────────────────────────────────
const fetchManualInboundList = (params) => {
    const qs = new URLSearchParams();
    qs.set('page',  params.page  ?? 1);
    qs.set('limit', params.limit ?? 20);
    if (params.warehouseId) qs.set('warehouseId', params.warehouseId);
    if (params.search?.trim()) qs.set('search', params.search.trim());
    if (params.dateFrom)  qs.set('dateFrom',  params.dateFrom);
    if (params.dateTo)    qs.set('dateTo',    params.dateTo);
    if (params.sortBy)    qs.set('sortBy',    params.sortBy);
    if (params.sortOrder) qs.set('sortOrder', params.sortOrder);
    return api.get(`/inbound/manual?${qs.toString()}`).then((r) => r);
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook — mirrors useInboundList pattern, scoped to /inbound/manual
// ─────────────────────────────────────────────────────────────────────────────
export function useManualInboundList() {
    const queryClient = useQueryClient();

    // ── Filter state ──────────────────────────────────────────────────────────
    const [warehouseId, setWarehouseId] = useState('');
    const [timeType,    setTimeType]    = useState('Created Time');
    const [timeFilter,  setTimeFilter]  = useState('All');
    const [inboundType, setInboundType] = useState('Inbound No.');
    const [search,      setSearch]      = useState('');
    const [dateFrom,    setDateFrom]    = useState('');
    const [dateTo,      setDateTo]      = useState('');
    const [page,        setPage]        = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    const debouncedSearch = useDebounce(search, 350);

    const listParams = {
        page,
        limit: 20,
        warehouseId: warehouseId || undefined,
        search:      debouncedSearch,
        dateFrom:    dateFrom || undefined,
        dateTo:      dateTo   || undefined,
        sortBy:      'created_at',
        sortOrder:   'DESC',
    };

    // ── List query ────────────────────────────────────────────────────────────
    const {
        data: listData,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: MANUAL_INBOUND_KEYS.list(listParams),
        queryFn:  () => fetchManualInboundList(listParams),
        staleTime: 1000 * 60 * 1,
        gcTime:    1000 * 60 * 3,
        placeholderData: (prev) => prev,
    });

    const items      = listData?.data       ?? [];
    const pagination = listData?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 20 };

    // ── Selection ─────────────────────────────────────────────────────────────
    const toggleSelect = useCallback((id) => {
        setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    }, []);

    const toggleAll = useCallback(() => {
        const ids = items.map((i) => i.id);
        const allSel = ids.every((id) => selectedIds.includes(id));
        setSelectedIds(allSel ? [] : ids);
    }, [items, selectedIds]);

    return {
        // filter state — same shape as useInboundList so InboundFilterBar works as-is
        warehouseId, setWarehouseId,
        timeType,    setTimeType,
        timeFilter,  setTimeFilter,
        inboundType, setInboundType,
        search,      setSearch,
        dateFrom,    setDateFrom,
        dateTo,      setDateTo,
        page,        setPage,

        // data
        items,
        pagination,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,

        // selection
        selectedIds,
        toggleSelect,
        toggleAll,
        allSelected:  items.length > 0 && items.every((i) => selectedIds.includes(i.id)),
        someSelected: items.some((i) => selectedIds.includes(i.id)),
    };
}