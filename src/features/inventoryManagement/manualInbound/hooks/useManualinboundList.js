import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../../../lib/api';
import useDebounce from '../../../../hooks/useDebounce';
import {
    filterInboundItems,
    getInboundDateField,
    getInboundSearchField,
} from '../../shared/inboundFilterUtils';
import { isManualInboundNote } from '../manualInboundConstants';

const COMPLETED_STATUSES = ['completed', 'complete', 'received'];

const isManualInboundItem = (item) => {
    const type = String(item?.inbound_type ?? item?.inboundType ?? item?.type ?? '').toLowerCase();
    return (
        isManualInboundNote(item?.notes ?? item?.note) ||
        type === 'manual' ||
        type === 'manual_inbound'
    );
};

const isCompletedInboundItem = (item) => {
    const status = String(item?.status ?? item?.inbound_status ?? item?.inboundStatus ?? '').toLowerCase();
    return COMPLETED_STATUSES.includes(status) || Boolean(item?.arrived_at ?? item?.received_at ?? item?.completed_at);
};

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

const fetchAllManualInboundList = async (params, knownTotal = 0) => {
    const pageLimit = Math.max(100, Number(knownTotal) || Number(params.limit) || 100);
    const first = await fetchManualInboundList({ ...params, page: 1, limit: pageLimit });
    const totalPages = Number(first?.pagination?.totalPages) || 1;

    if (totalPages <= 1) return first?.data ?? [];

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
            fetchManualInboundList({ ...params, page: index + 2, limit: pageLimit })
        )
    );

    return [...(first?.data ?? []), ...rest.flatMap((response) => response?.data ?? [])];
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
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectionLoading, setSelectionLoading] = useState(false);

    const debouncedSearch = useDebounce(search, 350);
    const serverSearch = inboundType === 'Inbound No.' ? debouncedSearch : '';
    const limit = debouncedSearch && inboundType !== 'Inbound No.' ? 1000 : 20;

    const resetList = useCallback(() => {
        setPage(1);
        setSelectedIds([]);
        setSelectedItems([]);
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

    const rawItems = useMemo(
        () => (listData?.data ?? []).filter((item) => isManualInboundItem(item) && isCompletedInboundItem(item)),
        [listData],
    );
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

    useEffect(() => {
        setSelectedItems((prev) => {
            const rowById = new Map(prev.map((item) => [item.id, item]));
            items.forEach((item) => {
                if (selectedIds.includes(item.id)) rowById.set(item.id, item);
            });
            return selectedIds.map((id) => rowById.get(id)).filter(Boolean);
        });
    }, [items, selectedIds]);

    // ── Selection ─────────────────────────────────────────────────────────────
    const toggleSelect = useCallback((id) => {
        setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    }, []);

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
            const allRows = await fetchAllManualInboundList(listParams, pagination.total);
            const filteredRows = filterInboundItems(
                allRows.filter((item) => isManualInboundItem(item) && isCompletedInboundItem(item)),
                {
                    warehouseId,
                    search: debouncedSearch,
                    inboundType,
                    timeType,
                    dateFrom,
                    dateTo,
                }
            );
            setSelectedItems(filteredRows);
            setSelectedIds(filteredRows.map((item) => item.id));
        } catch (err) {
            toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to select all manual inbound orders');
        } finally {
            setSelectionLoading(false);
        }
    }, [items, selectedIds, pagination.total, listParams, warehouseId, debouncedSearch, inboundType, timeType, dateFrom, dateTo]);

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
        selectedItems,
        selectionLoading,
        toggleSelect,
        toggleAll,
        allSelected:  items.length > 0 && items.every((i) => selectedIds.includes(i.id)),
        someSelected: items.some((i) => selectedIds.includes(i.id)),
    };
}
