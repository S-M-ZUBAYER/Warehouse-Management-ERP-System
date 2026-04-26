import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../lib/api';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────────────────────
export const INVENTORY_KEYS = {
    all: () => ['inventory'],
    list: (params) => ['inventory', 'list', params],
    counts: (wid) => ['inventory', 'counts', wid],
    dropdowns: () => ['inventory', 'dropdowns'],
};

// ─────────────────────────────────────────────────────────────────────────────
// API helpers — all hit the new /api/v1/inventory endpoints
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/v1/inventory/dropdowns → { warehouses: [...] } */
const fetchInventoryDropdowns = () =>
    api.get('/inventory/dropdowns').then((r) => r.data);

/** GET /api/v1/inventory/counts?warehouseId= → { all, mapped, unmapped } */
const fetchInventoryCounts = (warehouseId) => {
    const qs = warehouseId ? `?warehouseId=${warehouseId}` : '';
    return api.get(`/inventory/counts${qs}`).then((r) => r.data);
};

/** GET /api/v1/inventory?warehouseId=&search=&skuType=&mappingStatus=&page=&limit= */
const fetchInventoryList = (params) => {
    const qs = new URLSearchParams();
    qs.set('page', params.page ?? 1);
    qs.set('limit', params.limit ?? 20);
    if (params.warehouseId) qs.set('warehouseId', params.warehouseId);
    if (params.search?.trim()) qs.set('search', params.search.trim());
    if (params.skuType) qs.set('skuType', params.skuType);
    if (params.mappingStatus && params.mappingStatus !== 'all')
        qs.set('mappingStatus', params.mappingStatus);
    if (params.sortBy) qs.set('sortBy', params.sortBy);
    if (params.sortOrder) qs.set('sortOrder', params.sortOrder);
    return api.get(`/inventory?${qs.toString()}`).then((r) => r);
};

/**
 * PUT /api/v1/inventory/stock-alert
 * Body: { skuIds: [1,2,3], minStock: 10 }
 * skuIds = sku_warehouse_stock row IDs (item.id from inventory list)
 */
const setStockAlert = ({ skuIds, minStock }) =>
    api.put('/inventory/stock-alert', {
        skuIds: skuIds.map(Number),
        minStock: Number(minStock),
    }).then((r) => r.data);

/**
 * PUT /api/v1/inventory/sync
 * Body: { skuIds: [] }  ← empty = sync ALL mapped SKUs
 * skuIds = sku_warehouse_stock row IDs
 */
const syncInventory = (skuIds) =>
    api.put('/inventory/sync', {
        skuIds: skuIds.map(Number),
    }).then((r) => r.data);

/**
 * DELETE /api/v1/merchant-skus/bulk  ← reuses existing endpoint
 * Body: { skuIds: [...merchantSkuIds] }
 * Note: convert from inventory row IDs → merchant_sku_id before calling
 */
const batchDeleteInventory = (merchantSkuIds) =>
    api.delete('/merchant-skus/bulk', {
        data: { skuIds: merchantSkuIds.map(Number) },
    }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown options
// ─────────────────────────────────────────────────────────────────────────────
export const SKU_TYPE_OPTIONS = [
    { label: 'SKU Name', value: 'sku_name' },
    { label: 'Product Name', value: 'product_name' },
    { label: 'Product ID', value: 'gtin' },  // maps to gtin search
    { label: 'Store ID', value: 'store_id' },
];

export const MAPPING_TABS = [
    { label: 'All', value: 'all' },
    { label: 'Unmapped', value: 'unmapped' },
    { label: 'Mapped', value: 'mapped' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useInventoryList() {
    const queryClient = useQueryClient();

    // ── Filter state ──────────────────────────────────────────────────────────
    const [warehouseId, setWarehouseId] = useState('');
    const [warehouseName, setWarehouseName] = useState('Warehouse name here');
    const [skuType, setSkuType] = useState('sku_name');
    const [skuTypeLabel, setSkuTypeLabel] = useState('SKU Name');
    const [searchInput, setSearchInput] = useState('');    // live input
    const [searchApplied, setSearchApplied] = useState('');    // sent to API on Search click
    const [mappingStatus, setMappingStatus] = useState('all');
    const [page, setPage] = useState(1);

    // ── Selection ─────────────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState([]);   // sku_warehouse_stock IDs

    // ── Modal state ───────────────────────────────────────────────────────────
    const [showStockAlertModal, setShowStockAlertModal] = useState(false);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
    const [minStock, setMinStock] = useState('');

    // ─────────────────────────────────────────────────────────────────────────
    // Query: dropdowns
    // ─────────────────────────────────────────────────────────────────────────
    const { data: dropdownData, isLoading: dropdownsLoading } = useQuery({
        queryKey: INVENTORY_KEYS.dropdowns(),
        queryFn: fetchInventoryDropdowns,
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 20,
    });

    const warehouseOptions = [
        { label: 'Warehouse name here', value: '' },
        ...(dropdownData?.warehouses ?? []).map((w) => ({
            label: w.name,
            value: String(w.id),
        })),
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Query: tab counts
    // ─────────────────────────────────────────────────────────────────────────
    const { data: counts = { all: 0, mapped: 0, unmapped: 0 } } = useQuery({
        queryKey: INVENTORY_KEYS.counts(warehouseId),
        queryFn: () => fetchInventoryCounts(warehouseId || undefined),
        staleTime: 1000 * 30,
        placeholderData: { all: 0, mapped: 0, unmapped: 0 },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Query: inventory list
    // ─────────────────────────────────────────────────────────────────────────
    const listParams = {
        page,
        limit: 20,
        warehouseId: warehouseId || undefined,
        search: searchApplied || undefined,
        skuType: skuType || undefined,
        mappingStatus: mappingStatus !== 'all' ? mappingStatus : undefined,
        sortBy: 'created_at',
        sortOrder: 'DESC',
    };

    const {
        data: listData,
        isLoading,
        isFetching,
        isError,
        error,
    } = useQuery({
        queryKey: INVENTORY_KEYS.list(listParams),
        queryFn: () => fetchInventoryList(listParams),
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 3,
        placeholderData: (prev) => prev,
    });

    const items = listData?.data ?? [];
    const pagination = listData?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 20 };

    // ─────────────────────────────────────────────────────────────────────────
    // Mutation: set stock alert
    // ─────────────────────────────────────────────────────────────────────────
    const stockAlertMutation = useMutation({
        mutationFn: setStockAlert,
        onSuccess: (data) => {
            toast.success(data.message ?? 'Stock alert updated');
            setShowStockAlertModal(false);
            setSelectedIds([]);
            setMinStock('');
            queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Failed to set stock alert');
        },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Mutation: sync inventory
    // ─────────────────────────────────────────────────────────────────────────
    const syncMutation = useMutation({
        mutationFn: syncInventory,
        onSuccess: (data) => {
            toast.success(data.message ?? 'Stock sync queued successfully');
            setShowSyncModal(false);
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Sync failed');
        },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Mutation: batch delete
    // Uses existing /merchant-skus/bulk — needs merchant_sku_id not stock row id
    // ─────────────────────────────────────────────────────────────────────────
    const batchDeleteMutation = useMutation({
        mutationFn: (stockRowIds) => {
            // Resolve stock row IDs → merchant_sku_ids from current list data
            const merchantSkuIds = stockRowIds
                .map((id) => items.find((i) => i.id === id)?.merchantSku?.id)
                .filter(Boolean);

            if (!merchantSkuIds.length) {
                throw new Error('Could not resolve merchant SKU IDs');
            }
            return batchDeleteInventory(merchantSkuIds);
        },
        onSuccess: (data) => {
            toast.success(`${data.deleted ?? selectedIds.length} item(s) deleted`);
            setSelectedIds([]);
            setShowBatchDeleteModal(false);
            queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Batch delete failed');
        },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Selection helpers
    // ─────────────────────────────────────────────────────────────────────────
    const toggleSelect = useCallback((id) => {
        setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    }, []);

    const toggleAll = useCallback(() => {
        const ids = items.map((i) => i.id);
        const allSel = ids.every((id) => selectedIds.includes(id));
        setSelectedIds(allSel ? [] : ids);
    }, [items, selectedIds]);

    // ─────────────────────────────────────────────────────────────────────────
    // Filter helpers
    // ─────────────────────────────────────────────────────────────────────────
    const handleWarehouseSelect = useCallback((opt) => {
        setWarehouseId(opt.value);
        setWarehouseName(opt.label);
        setPage(1);
        setSelectedIds([]);
    }, []);

    const handleSkuTypeSelect = useCallback((opt) => {
        setSkuType(opt.value);
        setSkuTypeLabel(opt.label);
    }, []);

    // Search only fires when user clicks Search button or presses Enter
    const handleSearch = useCallback(() => {
        setSearchApplied(searchInput.trim());
        setPage(1);
        setSelectedIds([]);
    }, [searchInput]);

    const handleTabChange = useCallback((tab) => {
        setMappingStatus(tab.value);
        setPage(1);
        setSelectedIds([]);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Action handlers
    // ─────────────────────────────────────────────────────────────────────────
    const handleBatchDelete = useCallback(() => {
        if (!selectedIds.length) {
            toast.error('Select at least one item to delete');
            return;
        }
        setShowBatchDeleteModal(true);
    }, [selectedIds]);

    const confirmBatchDelete = useCallback(() => {
        batchDeleteMutation.mutate(selectedIds);
    }, [selectedIds, batchDeleteMutation]);

    const handleStockAlertOpen = useCallback(() => {
        if (!selectedIds.length) {
            toast.error('Select at least one SKU to set alert');
            return;
        }
        setMinStock('');
        setShowStockAlertModal(true);
    }, [selectedIds]);

    const confirmSetStockAlert = useCallback(() => {
        if (minStock === '' || isNaN(Number(minStock)) || Number(minStock) < 0) {
            toast.error('Enter a valid minimum stock quantity (0 or more)');
            return;
        }
        // selectedIds = sku_warehouse_stock row IDs — the API accepts these directly
        stockAlertMutation.mutate({ skuIds: selectedIds, minStock });
    }, [selectedIds, minStock, stockAlertMutation]);

    const handleSyncOpen = useCallback(() => {
        setShowSyncModal(true);
    }, []);

    const confirmSync = useCallback(() => {
        // Pass selected inventory row IDs — empty = sync all
        syncMutation.mutate(selectedIds);
    }, [selectedIds, syncMutation]);

    return {
        // filter
        warehouseId, warehouseName, handleWarehouseSelect,
        warehouseOptions, dropdownsLoading,

        skuType, skuTypeLabel, handleSkuTypeSelect,

        searchInput, setSearchInput, handleSearch,

        mappingStatus, handleTabChange,
        counts,

        page, setPage,

        // data
        items, pagination,
        isLoading, isFetching, isError, error,

        // selection
        selectedIds, toggleSelect, toggleAll,
        allSelected: items.length > 0 && items.every((i) => selectedIds.includes(i.id)),
        someSelected: items.some((i) => selectedIds.includes(i.id)),

        // modals
        showStockAlertModal, setShowStockAlertModal,
        showSyncModal, setShowSyncModal,
        showBatchDeleteModal, setShowBatchDeleteModal,
        minStock, setMinStock,

        // handlers + loading states
        handleBatchDelete,
        confirmBatchDelete,
        batchDeleting: batchDeleteMutation.isPending,

        handleStockAlertOpen,
        confirmSetStockAlert,
        stockAlertSaving: stockAlertMutation.isPending,

        handleSyncOpen,
        confirmSync,
        syncing: syncMutation.isPending,
    };
}
