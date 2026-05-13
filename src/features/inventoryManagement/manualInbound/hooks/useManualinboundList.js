import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../lib/api';
import useDebounce from '../../../../hooks/useDebounce';
import {
    filterInboundItems,
    getInboundDateField,
    getInboundSearchField,
} from '../../shared/inboundFilterUtils';

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
    if (params.searchField) qs.set('searchField', params.searchField);
    if (params.dateFrom)  qs.set('dateFrom',  params.dateFrom);
    if (params.dateTo)    qs.set('dateTo',    params.dateTo);
    if (params.dateField) qs.set('dateField', params.dateField);
    if (params.sortBy)    qs.set('sortBy',    params.sortBy);
    if (params.sortOrder) qs.set('sortOrder', params.sortOrder);
    return api.get(`/inbound/manual?${qs.toString()}`).then((r) => r);
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook — mirrors useInboundList pattern, scoped to /inbound/manual
// ─────────────────────────────────────────────────────────────────────────────
export function useManualInboundList() {
    // ── Filter state ──────────────────────────────────────────────────────────
    const [warehouseId, setWarehouseId] = useState('');
    const [timeType,    setTimeType]    = useState('Created Time');
    const [inboundType, setInboundType] = useState('Inbound No.');
    const [search,      setSearch]      = useState('');
    const [dateFrom,    setDateFrom]    = useState('');
    const [dateTo,      setDateTo]      = useState('');
    const [page,        setPage]        = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    const debouncedSearch = useDebounce(search, 350);
    const serverSearch = inboundType === 'Inbound No.' ? debouncedSearch : '';
    const limit = debouncedSearch && inboundType !== 'Inbound No.' ? 1000 : 20;

    const resetList = useCallback(() => {
        setPage(1);
        setSelectedIds([]);
    }, []);

    const updateWarehouseId = useCallback((value) => {
        setWarehouseId(value);
        resetList();
    }, [resetList]);

    const updateTimeType = useCallback((value) => {
        setTimeType(value);
        resetList();
    }, [resetList]);

    const updateDateFrom = useCallback((value) => {
        setDateFrom(value);
        resetList();
    }, [resetList]);

    const updateDateTo = useCallback((value) => {
        setDateTo(value);
        resetList();
    }, [resetList]);

    const updateInboundType = useCallback((value) => {
        setInboundType(value);
        resetList();
    }, [resetList]);

    const updateSearch = useCallback((value) => {
        setSearch(value);
        setPage(1);
    }, []);

    const listParams = {
        page,
        limit,
        warehouseId: warehouseId || undefined,
        search:      serverSearch,
        searchField: getInboundSearchField(inboundType),
        dateFrom:    dateFrom || undefined,
        dateTo:      dateTo   || undefined,
        dateField:   getInboundDateField(timeType),
        sortBy:      getInboundDateField(timeType),
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

    const rawItems = useMemo(() => listData?.data ?? [], [listData]);
    const items = useMemo(
        () => filterInboundItems(rawItems, {
            warehouseId,
            search: debouncedSearch,
            inboundType,
            timeType,
            dateFrom,
            dateTo,
        }),
        [rawItems, warehouseId, debouncedSearch, inboundType, timeType, dateFrom, dateTo],
    );
    const apiPagination = listData?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 20 };
    const pagination = items.length === rawItems.length
        ? apiPagination
        : { ...apiPagination, total: items.length, totalPages: 1, page: 1 };

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
        warehouseId, setWarehouseId: updateWarehouseId,
        timeType,    setTimeType: updateTimeType,
        inboundType, setInboundType: updateInboundType,
        search,      setSearch: updateSearch,
        dateFrom,    setDateFrom: updateDateFrom,
        dateTo,      setDateTo: updateDateTo,
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
