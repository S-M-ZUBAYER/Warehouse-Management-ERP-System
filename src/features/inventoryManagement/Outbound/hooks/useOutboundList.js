import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../../../lib/api';
import useDebounce from '../../../../hooks/useDebounce';
import {
    filterOutboundItems,
    getOutboundDateField,
    getOutboundSearchField,
} from '../../shared/outboundFilterUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────
export const OUTBOUND_KEYS = {
    all: () => ['outbound'],
    list: (params) => ['outbound', 'list', params],
    detail: (id) => ['outbound', 'detail', id],
};

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────
const fetchOutboundList = (params) => {

    const qs = new URLSearchParams();
    qs.set('page', params.page ?? 1);
    qs.set('limit', params.limit ?? 10);
    if (params.status) qs.set('status', params.status);
    if (params.warehouseId) qs.set('warehouseId', params.warehouseId);
    if (params.search?.trim()) qs.set('search', params.search.trim());
    if (params.searchField) qs.set('searchField', params.searchField);
    if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params.dateTo) qs.set('dateTo', params.dateTo);
    if (params.dateField) qs.set('dateField', params.dateField);
    if (params.sortBy) qs.set('sortBy', params.sortBy);
    if (params.sortOrder) qs.set('sortOrder', params.sortOrder);
    return api.get(`/outbound?${qs.toString()}`).then((r) => r);
};

const fetchAllOutboundList = async (params, knownTotal = 0) => {
    const pageLimit = Math.max(100, Number(knownTotal) || Number(params.limit) || 100);
    const first = await fetchOutboundList({ ...params, page: 1, limit: pageLimit });
    const totalPages = Number(first?.pagination?.totalPages) || 1;

    if (totalPages <= 1) return first?.data ?? [];

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
            fetchOutboundList({ ...params, page: index + 2, limit: pageLimit })
        )
    );

    return [...(first?.data ?? []), ...rest.flatMap((response) => response?.data ?? [])];
};

const deleteOutbound = (id) => api.delete(`/outbound/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
// Hook — used by Draft, OnTheWay, and Completed pages
// Pass `status` = 'draft' | 'on_the_way' | 'completed' to scope the query
// ─────────────────────────────────────────────────────────────────────────────
export function useOutboundList({ status }) {
    const queryClient = useQueryClient();

    // ── Filter state ──────────────────────────────────────────────────────────
    const [warehouseId, setWarehouseId] = useState('');
    const [timeType, setTimeType] = useState('Created Time');
    const [outboundType, setOutboundType] = useState('Outbound No.');
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectionLoading, setSelectionLoading] = useState(false);

    // ── Delete/Cancel modal state ─────────────────────────────────────────────
    const [actionTarget, setActionTarget] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const debouncedSearch = useDebounce(search, 350);
    const serverSearch = outboundType === 'Outbound No.' ? debouncedSearch : '';
    const limit = debouncedSearch && outboundType !== 'Outbound No.' ? 1000 : 10;

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

    const updateOutboundType = useCallback((value) => {
        setOutboundType(value);
        resetList();
    }, [resetList]);

    const updateSearch = useCallback((value) => {
        setSearch(value);
        setPage(1);
    }, []);

    const listParams = {
        status,
        page,
        limit,
        warehouseId: warehouseId || undefined,
        search: serverSearch,
        searchField: getOutboundSearchField(outboundType),
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        dateField: getOutboundDateField(timeType),
        sortBy: getOutboundDateField(timeType),
        sortOrder: 'DESC',
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
        queryKey: OUTBOUND_KEYS.list(listParams),
        queryFn: () => fetchOutboundList(listParams),
        staleTime: 1000 * 60 * 1,
        gcTime: 1000 * 60 * 3,
        placeholderData: (prev) => prev,
    });

    const rawItems = useMemo(() => listData?.data ?? [], [listData]);
    const items = useMemo(
        () => filterOutboundItems(rawItems, {
            warehouseId,
            search: debouncedSearch,
            outboundType,
            timeType,
            dateFrom,
            dateTo,
        }),
        [rawItems, warehouseId, debouncedSearch, outboundType, timeType, dateFrom, dateTo],
    );
   

    const apiPagination = listData?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 10 };
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

    // Delete mutation (completed orders only) ───────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: deleteOutbound,
        onSuccess: () => {
            toast.success('Outbound record deleted');
            setShowDeleteModal(false);
            setActionTarget(null);
            queryClient.invalidateQueries({ queryKey: OUTBOUND_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Failed to delete');
        },
    });

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
            const allRows = await fetchAllOutboundList(listParams, pagination.total);
            const filteredRows = filterOutboundItems(allRows, {
                warehouseId,
                search: debouncedSearch,
                outboundType,
                timeType,
                dateFrom,
                dateTo,
            });
            setSelectedItems(filteredRows);
            setSelectedIds(filteredRows.map((item) => item.id));
        } catch (err) {
            toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to select all outbound orders');
        } finally {
            setSelectionLoading(false);
        }
    }, [items, selectedIds, pagination.total, listParams, warehouseId, debouncedSearch, outboundType, timeType, dateFrom, dateTo]);

    const clearSelected = useCallback(() => {
        setSelectedIds([]);
        setSelectedItems([]);
    }, []);

    // ── Action helpers ────────────────────────────────────────────────────────

    const openDeleteModal = useCallback((item) => {
        setActionTarget(item);
        setShowDeleteModal(true);
    }, []);


    const confirmDelete = useCallback(() => {
        if (!actionTarget) return;
        deleteMutation.mutate(actionTarget.id);
    }, [actionTarget, deleteMutation]);

    return {
        // filter state
        warehouseId, setWarehouseId: updateWarehouseId,
        timeType, setTimeType: updateTimeType,
        outboundType, setOutboundType: updateOutboundType,
        search, setSearch: updateSearch,
        dateFrom, setDateFrom: updateDateFrom,
        dateTo, setDateTo: updateDateTo,
        page, setPage,

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
        clearSelected,
        allSelected: items.length > 0 && items.every((i) => selectedIds.includes(i.id)),
        someSelected: items.some((i) => selectedIds.includes(i.id)),

        // delete
        actionTarget,
        showDeleteModal, setShowDeleteModal,
        openDeleteModal,
        confirmDelete,
        deleting: deleteMutation.isPending,
    };
}
