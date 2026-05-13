import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
export const INBOUND_KEYS = {
    all: () => ['inbound'],
    list: (params) => ['inbound', 'list', params],
    detail: (id) => ['inbound', 'detail', id],
};

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────
const fetchInboundList = (params) => {
    console.log(params);

    const qs = new URLSearchParams();
    qs.set('page', params.page ?? 1);
    qs.set('limit', params.limit ?? 20);
    if (params.status) qs.set('status', params.status);
    if (params.warehouseId) qs.set('warehouseId', params.warehouseId);
    if (params.search?.trim()) qs.set('search', params.search.trim());
    if (params.searchField) qs.set('searchField', params.searchField);
    if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params.dateTo) qs.set('dateTo', params.dateTo);
    if (params.dateField) qs.set('dateField', params.dateField);
    if (params.sortBy) qs.set('sortBy', params.sortBy);
    if (params.sortOrder) qs.set('sortOrder', params.sortOrder);
    return api.get(`/inbound?${qs.toString()}`).then((r) => r);
};

const cancelInbound = (id) => api.put(`/inbound/${id}/cancel`).then((r) => r.data);
const deleteInbound = (id) => api.delete(`/inbound/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
// Hook — used by Draft, OnTheWay, and Completed pages
// Pass `status` = 'draft' | 'on_the_way' | 'completed' to scope the query
// ─────────────────────────────────────────────────────────────────────────────
export function useInboundList({ status }) {
    const queryClient = useQueryClient();

    // ── Filter state ──────────────────────────────────────────────────────────
    const [warehouseId, setWarehouseId] = useState('');
    const [timeType, setTimeType] = useState('Created Time');
    const [inboundType, setInboundType] = useState('Inbound No.');
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);

    // ── Delete/Cancel modal state ─────────────────────────────────────────────
    const [actionTarget, setActionTarget] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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
        status,
        page,
        limit,
        warehouseId: warehouseId || undefined,
        search: serverSearch,
        searchField: getInboundSearchField(inboundType),
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        dateField: getInboundDateField(timeType),
        sortBy: getInboundDateField(timeType),
        sortOrder: 'DESC',
    };

    // ── List query ────────────────────────────────────────────────────────────
    const {
        data: listData,
        isLoading,
        isFetching,
        isError,
        error,
    } = useQuery({
        queryKey: INBOUND_KEYS.list(listParams),
        queryFn: () => fetchInboundList(listParams),
        staleTime: 1000 * 60 * 1,
        gcTime: 1000 * 60 * 3,
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
    console.log(listData);

    const apiPagination = listData?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 20 };
    const pagination = items.length === rawItems.length
        ? apiPagination
        : { ...apiPagination, total: items.length, totalPages: 1, page: 1 };

    // ── Cancel mutation ───────────────────────────────────────────────────────
    const cancelMutation = useMutation({
        mutationFn: cancelInbound,
        onSuccess: () => {
            toast.success('Inbound order cancelled successfully');
            setShowCancelModal(false);
            setActionTarget(null);
            setSelectedIds((p) => p.filter((id) => id !== actionTarget?.id));
            queryClient.invalidateQueries({ queryKey: INBOUND_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Failed to cancel inbound order');
        },
    });

    // ── Delete mutation (completed orders only) ───────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: deleteInbound,
        onSuccess: () => {
            toast.success('Inbound record deleted');
            setShowDeleteModal(false);
            setActionTarget(null);
            queryClient.invalidateQueries({ queryKey: INBOUND_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Failed to delete');
        },
    });

    // ── Selection ─────────────────────────────────────────────────────────────
    const toggleSelect = useCallback((id) => {
        setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    }, []);

    const toggleAll = useCallback(() => {
        const ids = items.map((i) => i.id);
        const allSel = ids.every((id) => selectedIds.includes(id));
        setSelectedIds(allSel ? [] : ids);
    }, [items, selectedIds]);

    // ── Action helpers ────────────────────────────────────────────────────────
    const openCancelModal = useCallback((item) => {
        setActionTarget(item);
        setShowCancelModal(true);
    }, []);

    const openDeleteModal = useCallback((item) => {
        setActionTarget(item);
        setShowDeleteModal(true);
    }, []);

    const confirmCancel = useCallback(() => {
        if (!actionTarget) return;
        cancelMutation.mutate(actionTarget.id);
    }, [actionTarget, cancelMutation]);

    const confirmDelete = useCallback(() => {
        if (!actionTarget) return;
        deleteMutation.mutate(actionTarget.id);
    }, [actionTarget, deleteMutation]);

    return {
        // filter state
        warehouseId, setWarehouseId: updateWarehouseId,
        timeType, setTimeType: updateTimeType,
        inboundType, setInboundType: updateInboundType,
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

        // selection
        selectedIds,
        toggleSelect,
        toggleAll,
        allSelected: items.length > 0 && items.every((i) => selectedIds.includes(i.id)),
        someSelected: items.some((i) => selectedIds.includes(i.id)),

        // cancel
        actionTarget,
        showCancelModal, setShowCancelModal,
        openCancelModal,
        confirmCancel,
        cancelling: cancelMutation.isPending,

        // delete
        showDeleteModal, setShowDeleteModal,
        openDeleteModal,
        confirmDelete,
        deleting: deleteMutation.isPending,
    };
}
