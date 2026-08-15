import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../lib/api';
import { toast } from 'sonner';
import {
    filterWarehousesByPermission,
    getDefaultAllowedWarehouseId,
    resolveAllowedWarehouseId,
} from '../../../../utils/permissions';

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
    qs.set('limit', params.limit ?? 10);
    if (params.warehouseId) qs.set('warehouseId', params.warehouseId);
    if (params.search?.trim()) qs.set('search', params.search.trim());
    if (params.skuType) qs.set('skuType', params.skuType);
    if (params.mappingStatus && params.mappingStatus !== 'all')
        qs.set('mappingStatus', params.mappingStatus);
    if (params.sortBy) qs.set('sortBy', params.sortBy);
    if (params.sortOrder) qs.set('sortOrder', params.sortOrder);
    return api.get(`/inventory?${qs.toString()}`).then((r) => r);
};

const getAlertFilterKey = (value) => String(value || '').toLowerCase().replace(/[\s-]+/g, '_');

const getInventoryAlertKey = (item) => {
    const status = getAlertFilterKey(item.stock_alert_status);
    const qty = Number(item.qty_on_hand ?? 0);
    const minStock = item.min_stock === null || item.min_stock === undefined ? null : Number(item.min_stock);

    if (qty <= 0 || status === 'out_of_stock') return 'out_of_stock';
    if (status === 'low_stock') return 'low_stock';
    if (minStock !== null && Number.isFinite(minStock) && qty <= minStock) return 'low_stock';
    return status || 'no_alert';
};

const filterInventoryRowsByAlert = (rows, stockAlertStatus) => {
    const target = getAlertFilterKey(stockAlertStatus);
    if (!target) return rows;
    return rows.filter((item) => getInventoryAlertKey(item) === target);
};

const fetchInventoryListForAlert = async (params) => {
    const requestParams = { ...params, page: 1, limit: 100 };
    const first = await fetchInventoryList(requestParams);
    const firstRows = first?.data ?? [];
    const firstPagination = first?.pagination ?? {};
    const totalPages = Number(firstPagination.totalPages || 1);
    const allRows = [...firstRows];

    if (totalPages > 1) {
        const rest = await Promise.all(
            Array.from({ length: Math.min(totalPages, 100) - 1 }, (_, index) =>
                fetchInventoryList({ ...requestParams, page: index + 2 })
            )
        );
        rest.forEach((response) => allRows.push(...(response?.data ?? [])));
    }

    const filteredRows = filterInventoryRowsByAlert(allRows, params.stockAlertStatus);
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 10);
    const start = (page - 1) * limit;

    return {
        ...first,
        data: filteredRows.slice(start, start + limit),
        pagination: {
            ...firstPagination,
            page,
            limit,
            total: filteredRows.length,
            totalPages: Math.max(1, Math.ceil(filteredRows.length / limit)),
        },
    };
};

const fetchAllInventoryList = async (params) => {
    const pageLimit = 100;
    const fetcher = params.stockAlertStatus ? fetchInventoryListForAlert : fetchInventoryList;
    const first = await fetcher({ ...params, page: 1, limit: pageLimit });
    const totalPages = Number(first?.pagination?.totalPages) || 1;

    if (totalPages <= 1) return first?.data ?? [];

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
            fetcher({ ...params, page: index + 2, limit: pageLimit })
        )
    );

    return [...(first?.data ?? []), ...rest.flatMap((response) => response?.data ?? [])];
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

//previous
// const syncInventory = (skuIds) =>
//     api.put('/inventory/sync', {
//         skuIds: skuIds.map(Number),
//     }).then((r) => r.data);

//New
const syncInventory = (skuIds) =>
    api.put('/inventory/sync', {
        skuIds: skuIds.map(Number),
    }).then((r) => r.data);

const updateInventoryStockRequest = ({ id, quantity, lock }) =>
    api.put(`/inventory/${Number(id)}/stock`, {
        quantity: Number(quantity),
        lock: Number(lock),
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
    { label: 'SKU Title', value: 'product_name' },
    { label: 'GTIN', value: 'gtin' },
];

export const MAPPING_TABS = [
    { label: 'All', value: 'all' },
    { label: 'Unmapped', value: 'unmapped' },
    { label: 'Mapped', value: 'mapped' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useInventoryList({ initialStockAlertStatus = '' } = {}) {
    const queryClient = useQueryClient();

    // ── Filter state ──────────────────────────────────────────────────────────
    const [warehouseId, setWarehouseId] = useState(() => getDefaultAllowedWarehouseId());
    const [warehouseName, setWarehouseName] = useState('Warehouse name here');
    const [skuType, setSkuType] = useState('sku_name');
    const [skuTypeLabel, setSkuTypeLabel] = useState('SKU Name');
    const [searchInput, setSearchInput] = useState('');    // live input
    const [searchApplied, setSearchApplied] = useState('');    // sent to API on Search click
    const [mappingStatus, setMappingStatus] = useState('all');
    const [stockAlertStatus] = useState(initialStockAlertStatus);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pageSizeInput, setPageSizeInput] = useState('10');

    // ── Selection ─────────────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState([]);   // sku_warehouse_stock IDs
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectionLoading, setSelectionLoading] = useState(false);

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

    const allowedWarehouses = filterWarehousesByPermission(dropdownData?.warehouses ?? []);
    const warehouseOptions = [
        { label: 'Warehouse name here', value: '' },
        ...allowedWarehouses.map((w) => ({
            label: w.name,
            value: String(w.id),
        })),
    ];

    useEffect(() => {
        if (!warehouseId || !allowedWarehouses.length) return;
        const selected = allowedWarehouses.find((warehouse) => String(warehouse.id) === String(warehouseId));
        if (selected) setWarehouseName(selected.name);
    }, [allowedWarehouses, warehouseId]);

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
        limit: pageSize,
        warehouseId: warehouseId || undefined,
        search: searchApplied || undefined,
        skuType: skuType || undefined,
        mappingStatus: mappingStatus !== 'all' ? mappingStatus : undefined,
        stockAlertStatus: stockAlertStatus || undefined,
        sortBy: 'created_at',
        sortOrder: 'DESC',
    };

    const {
        data: listData,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: INVENTORY_KEYS.list(listParams),
        queryFn: () => stockAlertStatus ? fetchInventoryListForAlert(listParams) : fetchInventoryList(listParams),
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 3,
        placeholderData: (prev) => prev,
    });

    const items = listData?.data ?? [];
    const pagination = listData?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 10 };

    useEffect(() => {
        setSelectedItems((prev) => {
            const rowById = new Map(prev.map((item) => [item.id, item]));
            items.forEach((item) => {
                if (selectedIds.includes(item.id)) rowById.set(item.id, item);
            });
            return selectedIds.map((id) => rowById.get(id)).filter(Boolean);
        });
    }, [items, selectedIds]);

    // ─────────────────────────────────────────────────────────────────────────
    // Mutation: set stock alert
    // ─────────────────────────────────────────────────────────────────────────
    const stockAlertMutation = useMutation({
        mutationFn: setStockAlert,
        onSuccess: (data) => {
            toast.success(data.message ?? 'Stock alert updated');
            setShowStockAlertModal(false);
            setSelectedIds([]);
            setSelectedItems([]);
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
    // previous
    // const syncMutation = useMutation({
    //     mutationFn: syncInventory,
    //     onSuccess: (data) => {
    //         toast.success(data.message ?? 'Stock sync queued successfully');
    //         setShowSyncModal(false);
    //         setSelectedIds([]);
    //         queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.all() });
    //     },
    //     onError: (err) => {
    //         toast.error(err?.response?.data?.message ?? 'Sync failed');
    //     },
    // });
//New
const syncMutation = useMutation({
    mutationFn: syncInventory,
    onSuccess: (data) => {
        // data = { queued, synced, failed, total, message, results[] }
        
        if (data.failed === 0 && data.synced > 0) {
            // ✅ All success
            toast.success(data.message ?? 'Stock synced successfully');

        } else if (data.synced === 0 && data.failed > 0) {
            // ❌ All failed
            toast.error(data.message ?? 'Stock sync failed');

        } else if (data.synced > 0 && data.failed > 0) {
            // ⚠️ Partial success
            toast.warning(data.message ?? `Partial sync: ${data.synced} succeeded, ${data.failed} failed`);
        } else {
            toast.info(data.message ?? 'No eligible mappings found');
        }

        setShowSyncModal(false);
        setSelectedIds([]);
        setSelectedItems([]);
        queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.all() });
    },
    onError: (err) => {
         console.error(err)
        toast.error(err?.message ?? 'Sync failed');
    },
});

    const updateStockMutation = useMutation({
        mutationFn: updateInventoryStockRequest,
        onSuccess: (data) => {
            toast.success(data?.message ?? 'Inventory updated');
            queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to update inventory');
        },
    });
    // ─────────────────────────────────────────────────────────────────────────
    // Mutation: batch delete
    // Uses existing /merchant-skus/bulk — needs merchant_sku_id not stock row id
    // ─────────────────────────────────────────────────────────────────────────
    const batchDeleteMutation = useMutation({
        mutationFn: (stockRowIds) => {
            // Resolve stock row IDs → merchant_sku_ids from current list data
            const sourceItems = selectedItems.length ? selectedItems : items;
            const merchantSkuIds = stockRowIds
                .map((id) => sourceItems.find((i) => i.id === id)?.merchantSku?.id)
                .filter(Boolean);

            if (!merchantSkuIds.length) {
                throw new Error('Could not resolve merchant SKU IDs');
            }
            return batchDeleteInventory(merchantSkuIds);
        },
        onSuccess: (data) => {
            toast.success(`${data.deleted ?? selectedIds.length} item(s) deleted`);
            setSelectedIds([]);
            setSelectedItems([]);
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

    const toggleAll = useCallback(async () => {
        const pageIds = items.map((i) => i.id);
        const allFilteredSelected =
            pagination.total > 0 &&
            selectedIds.length >= pagination.total &&
            pageIds.every((id) => selectedIds.includes(id));

        if (allFilteredSelected) {
            setSelectedIds([]);
            setSelectedItems([]);
            return;
        }

        setSelectionLoading(true);
        try {
            const allItems = await fetchAllInventoryList(listParams);
            setSelectedItems(allItems);
            setSelectedIds(allItems.map((item) => item.id));
        } catch (err) {
            toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to select all inventory items');
        } finally {
            setSelectionLoading(false);
        }
    }, [items, selectedIds, pagination.total, listParams]);

    // ─────────────────────────────────────────────────────────────────────────
    // Filter helpers
    // ─────────────────────────────────────────────────────────────────────────
    const handleWarehouseSelect = useCallback((opt) => {
        const nextWarehouseId = resolveAllowedWarehouseId(opt.value);
        const nextOption = warehouseOptions.find((item) => item.value === nextWarehouseId);
        setWarehouseId(nextWarehouseId);
        setWarehouseName(nextOption?.label ?? opt.label);
        setPage(1);
        setSelectedIds([]);
        setSelectedItems([]);
    }, [warehouseOptions]);

    const handleSkuTypeSelect = useCallback((opt) => {
        setSkuType(opt.value);
        setSkuTypeLabel(opt.label);
    }, []);

    // Search only fires when user clicks Search button or presses Enter
    const handleSearch = useCallback(() => {
        setSearchApplied(searchInput.trim());
        setPage(1);
        setSelectedIds([]);
        setSelectedItems([]);
    }, [searchInput]);

    const handleTabChange = useCallback((tab) => {
        setMappingStatus(tab.value);
        setPage(1);
        setSelectedIds([]);
        setSelectedItems([]);
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

    const applyPageSize = useCallback(() => {
        const nextPageSize = Math.max(1, Number.parseInt(pageSizeInput, 10) || 10);
        setPageSize(nextPageSize);
        setPageSizeInput(String(nextPageSize));
        setPage(1);
    }, [pageSizeInput]);

   const handleSyncOpen = useCallback(() => {
    if (selectedIds.length === 0) {
        toast.error('Select at least one mapped SKU to sync');
        return;
    }

    // Identify which items are actually selected from the data
    const currentSelectedItems = selectedItems.length === selectedIds.length
        ? selectedItems
        : items.filter((item) => selectedIds.includes(item.id));
    
    // Check if any selected item is unmapped 
    // (Assuming 'unmapped' means merchantSku is null/undefined based on your batchDelete logic)
    const hasUnmapped = currentSelectedItems.some((item) => !item.is_mapped);
 
    if (hasUnmapped) {
        toast.error('Only mapped SKUs are eligible for sync.');
        return;
    }

    setShowSyncModal(true);
}, [selectedIds, selectedItems, items]);

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
        pageSizeInput, setPageSizeInput, applyPageSize,

        // data
        items, pagination,
        isLoading, isFetching, isError, error, refetch,

        // selection
        selectedIds, selectedItems, toggleSelect, toggleAll, selectionLoading,
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

        updateInventoryStock: updateStockMutation.mutateAsync,
        inventoryStockUpdating: updateStockMutation.isPending,
    };
}
