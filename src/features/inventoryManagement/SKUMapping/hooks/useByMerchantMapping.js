import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../../../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────────────────────
export const BY_MERCHANT_KEYS = {
    all:    ()       => ['by-merchant'],
    list:   (params) => ['by-merchant', 'list', params],
    counts: ()       => ['by-merchant', 'counts'],
    picker: (params) => ['by-merchant', 'picker', params],
};

const PAGE_SIZE = 10;
const LOCAL_SEARCH_FETCH_LIMIT = 500;

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/sku-mapping/by-merchant — merchant SKU list with mapping status
const fetchMerchantList = (params) => {
    const qs = new URLSearchParams();
    qs.set('page',  params.page  ?? 1);
    qs.set('limit', params.limit ?? PAGE_SIZE);
    if (params.search?.trim()) qs.set('search',        params.search.trim());
    if (params.skuType)        qs.set('skuType',       params.skuType);
    if (params.mappingStatus && params.mappingStatus !== 'all')
        qs.set('mappingStatus', params.mappingStatus);
    return api.get(`/sku-mapping/by-merchant?${qs.toString()}`).then((r) => r);
};

const fetchAllMerchantList = async (params, knownTotal = 0) => {
    const pageLimit = Math.max(100, Number(knownTotal) || Number(params.limit) || PAGE_SIZE);
    const first = await fetchMerchantList({ ...params, page: 1, limit: pageLimit });
    const totalPages = Number(first?.pagination?.totalPages) || 1;

    if (totalPages <= 1) return first?.data ?? [];

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
            fetchMerchantList({ ...params, page: index + 2, limit: pageLimit })
        )
    );

    return [...(first?.data ?? []), ...rest.flatMap((response) => response?.data ?? [])];
};

// GET /api/v1/sku-mapping/by-merchant/counts
const fetchMerchantCounts = () =>
    api.get('/sku-mapping/by-merchant/counts').then((r) => r.data);

// GET /api/v1/sku-mapping/product-picker
// Left panel of Add Mapping modal — platform products for a given store
const fetchProductPicker = (params) => {
    const qs = new URLSearchParams();
    qs.set('page',  params.page  ?? 1);
    qs.set('limit', params.limit ?? 50);
    if (params.platformStoreId) qs.set('platformStoreId', params.platformStoreId);
    if (params.mappingStatus)   qs.set('mappingStatus',   params.mappingStatus);
    if (params.skuType)         qs.set('skuType',         params.skuType);
    if (params.search?.trim())  qs.set('search',          params.search.trim());
    return api.get(`/sku-mapping/product-picker?${qs.toString()}`).then((r) => r);
};

// POST /api/v1/sku-mapping/mapping — Confirm in Add Mapping modal
const createMapping = (body) =>
    api.post('/sku-mapping/mapping', body).then((r) => r.data);

// DELETE /api/v1/sku-mapping/mapping/:id — unlink from merchant side
const unlinkMapping = (id) =>
    api.delete(`/sku-mapping/mapping/${id}`).then((r) => r.data);

// POST /api/v1/sku-mapping/sync-mapped — mark out_of_sync for Java to push
const syncMapped = (body) =>
    api.post('/sku-mapping/sync-mapped', body).then((r) => r.data);

const LOCAL_MAPPING_SEARCH_TYPES = new Set(['platform_product_id', 'platform_shop_id']);

const mappingValueMatches = (value, query) =>
    String(value ?? '').toLowerCase().includes(query);

const matchesLocalMappingSearch = (sku, skuType, query) => {
    if (!query) return true;
    const mappings = sku.mappings ?? [];

    if (skuType === 'platform_product_id') {
        return mappings.some((mapping) =>
            mappingValueMatches(mapping.platform_product_id, query)
        );
    }

    if (skuType === 'platform_shop_id') {
        return mappings.some((mapping) =>
            mappingValueMatches(mapping.platform_shop_id, query)
        );
    }

    return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useByMerchantMapping() {
    const queryClient = useQueryClient();

    // ── Main list filter state ────────────────────────────────────────────────
    const [searchInput,   setSearchInput]   = useState('');
    const [searchApplied, setSearchApplied] = useState('');
    const [skuType,       setSkuType]       = useState('sku_name');  // sku_name | product_name
    const [mappingStatus, setMappingStatus] = useState('all');
    const [page,          setPage]          = useState(1);
    const [pageSize,      setPageSize]      = useState(PAGE_SIZE);
    const [pageSizeInput, setPageSizeInput] = useState(String(PAGE_SIZE));

    // ── Selection ─────────────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedMerchantSkus, setSelectedMerchantSkus] = useState([]);
    const [selectionLoading, setSelectionLoading] = useState(false);

    // ── Expanded rows (mapping details dropdown per row) ──────────────────────
    const [expandedIds, setExpandedIds] = useState([]);

    // ── Add Mapping modal state ───────────────────────────────────────────────
    const [showAddModal,        setShowAddModal]       = useState(false);
    const [addModalTarget,      setAddModalTarget]     = useState(null);  // which merchant SKU row opened modal
    const [modalStoreId,        setModalStoreId]       = useState('');
    const [modalStoreName,      setModalStoreName]     = useState('Store name here');
    const [modalPlatform,       setModalPlatform]      = useState('');
    const [modalStatus,         setModalStatus]        = useState('All');  // All | Not Mapped
    const [modalSkuType,        setModalSkuType]       = useState('product_name');
    const [modalSkuTypeLabel,   setModalSkuTypeLabel]  = useState('SKU Name');
    const [modalSearchInput,    setModalSearchInput]   = useState('');
    const [modalSearchApplied,  setModalSearchApplied] = useState('');
    const [modalSelectedIds,    setModalSelectedIds]   = useState([]);
    const [modalSelectedMap,    setModalSelectedMap]   = useState({});  // id → product obj cache

    // ── Unlink confirm ────────────────────────────────────────────────────────
    const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
    const [unlinkTarget,      setUnlinkTarget]      = useState(null);  // { mappingId, skuName }

    // ── Query: merchant SKU list ──────────────────────────────────────────────
    const listParams = {
        page,
        limit:         LOCAL_MAPPING_SEARCH_TYPES.has(skuType) && searchApplied ? LOCAL_SEARCH_FETCH_LIMIT : pageSize,
        search:        LOCAL_MAPPING_SEARCH_TYPES.has(skuType) ? undefined : searchApplied || undefined,
        skuType:       LOCAL_MAPPING_SEARCH_TYPES.has(skuType) ? undefined : skuType || undefined,
        mappingStatus: mappingStatus !== 'all' ? mappingStatus : undefined,
    };

    const {
        data: listData,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey:        BY_MERCHANT_KEYS.list(listParams),
        queryFn:         () => fetchMerchantList(listParams),
        staleTime:       1000 * 60,
        placeholderData: (prev) => prev,
    });

    const rawMerchantSkus = useMemo(() => listData?.data ?? [], [listData]);
    const filteredMerchantSkus = useMemo(() => {
        if (!LOCAL_MAPPING_SEARCH_TYPES.has(skuType) || !searchApplied.trim()) {
            return rawMerchantSkus;
        }

        const query = searchApplied.trim().toLowerCase();
        return rawMerchantSkus.filter((sku) =>
            matchesLocalMappingSearch(sku, skuType, query)
        );
    }, [rawMerchantSkus, skuType, searchApplied]);

    // ── Query: counts ─────────────────────────────────────────────────────────
    const { data: counts = { all: 0, mapped: 0, unmapped: 0 } } = useQuery({
        queryKey:        BY_MERCHANT_KEYS.counts(),
        queryFn:         fetchMerchantCounts,
        staleTime:       1000 * 30,
        placeholderData: { all: 0, mapped: 0, unmapped: 0 },
    });

    // ── Query: product picker (inside Add Mapping modal) ──────────────────────
    const isLocalSearch = LOCAL_MAPPING_SEARCH_TYPES.has(skuType) && searchApplied.trim();
    const merchantSkus = useMemo(() => {
        if (!isLocalSearch) return filteredMerchantSkus;

        const start = (page - 1) * pageSize;
        return filteredMerchantSkus.slice(start, start + pageSize);
    }, [filteredMerchantSkus, isLocalSearch, page, pageSize]);

    const totalForCurrentTab =
        mappingStatus === 'mapped' ? counts.mapped
        : mappingStatus === 'unmapped' ? counts.unmapped
        : counts.all;

    const fallbackTotal = Number(totalForCurrentTab) || filteredMerchantSkus.length;
    const rawPagination = listData?.pagination ?? {
        total: fallbackTotal,
        totalPages: Math.max(1, Math.ceil(fallbackTotal / pageSize)),
        page,
        limit: pageSize,
    };
    const pagination = isLocalSearch
        ? {
            ...rawPagination,
            total: filteredMerchantSkus.length,
            totalPages: Math.max(1, Math.ceil(filteredMerchantSkus.length / pageSize)),
            page,
            limit: pageSize,
        }
        : {
            ...rawPagination,
            total: rawPagination.total ?? fallbackTotal,
            totalPages: rawPagination.totalPages ?? Math.max(1, Math.ceil(fallbackTotal / pageSize)),
            limit: Number(rawPagination.limit) || pageSize,
        };

    const applyPageSize = useCallback(() => {
        const nextPageSize = Math.max(1, Number.parseInt(pageSizeInput, 10) || PAGE_SIZE);
        setPageSize(nextPageSize);
        setPageSizeInput(String(nextPageSize));
        setPage(1);
    }, [pageSizeInput]);

    useEffect(() => {
        setSelectedMerchantSkus((prev) => {
            const rowById = new Map(prev.map((sku) => [sku.id, sku]));
            merchantSkus.forEach((sku) => {
                if (selectedIds.includes(sku.id)) rowById.set(sku.id, sku);
            });
            return selectedIds.map((id) => rowById.get(id)).filter(Boolean);
        });
    }, [merchantSkus, selectedIds]);

    const pickerParams = {
        platformStoreId: modalStoreId    || undefined,
        mappingStatus:   modalStatus === 'Not Mapped' ? 'not_mapped' : 'all',
        skuType:         modalSkuType    || undefined,
        search:          modalSearchApplied || undefined,
        page:            1,
        limit:           50,
    };

    const {
        data: pickerData,
        isLoading: pickerLoading,
        isFetching: pickerFetching,
    } = useQuery({
        queryKey:        BY_MERCHANT_KEYS.picker(pickerParams),
        queryFn:         () => fetchProductPicker(pickerParams),
        enabled:         showAddModal,   // only fetch when modal is open
        staleTime:       1000 * 60,
        placeholderData: (prev) => prev,
    });

    const pickerProducts  = pickerData?.data ?? [];
    const pickerPreview   = modalSelectedIds.map((id) => modalSelectedMap[id]).filter(Boolean);

    // ── Mutation: create mapping ──────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: createMapping,
        onSuccess: (data) => {
            toast.success(data.message ?? 'Mapping created');
            setShowAddModal(false);
            resetModalState();
            queryClient.invalidateQueries({ queryKey: BY_MERCHANT_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Failed to create mapping');
        },
    });

    // ── Mutation: unlink mapping ──────────────────────────────────────────────
    const unlinkMutation = useMutation({
        mutationFn: () => unlinkMapping(unlinkTarget?.mappingId),
        onSuccess: () => {
            toast.success('Mapping removed successfully');
            setShowUnlinkConfirm(false);
            setUnlinkTarget(null);
            queryClient.invalidateQueries({ queryKey: BY_MERCHANT_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Failed to unlink');
        },
    });

    // ── Mutation: sync mapped ─────────────────────────────────────────────────
    // Marks platform_sku_mappings as out_of_sync — Java picks up and pushes stock
    const syncMappedMutation = useMutation({
        mutationFn: syncMapped,
        onSuccess: (data) => {
            toast.success(data.message ?? 'Sync queued for Java');
            queryClient.invalidateQueries({ queryKey: BY_MERCHANT_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Sync failed');
        },
    });

    // ── Helpers ───────────────────────────────────────────────────────────────
    const resetModalState = useCallback(() => {
        setModalStoreId('');
        setModalStoreName('Store name here');
        setModalPlatform('');
        setModalStatus('All');
        setModalSkuType('product_name');
        setModalSkuTypeLabel('SKU Name');
        setModalSearchInput('');
        setModalSearchApplied('');
        setModalSelectedIds([]);
        setModalSelectedMap({});
        setAddModalTarget(null);
    }, []);

    const openAddModal = useCallback((merchantSku) => {
        resetModalState();
        setAddModalTarget(merchantSku);
        setShowAddModal(true);
    }, [resetModalState]);

    const handleModalSearch = useCallback(() => {
        setModalSearchApplied(modalSearchInput.trim());
    }, [modalSearchInput]);

    const toggleModalSelect = useCallback((product) => {
        setModalSelectedIds((prev) => {
            if (prev.includes(product.id)) return prev.filter((x) => x !== product.id);
            setModalSelectedMap((m) => ({ ...m, [product.id]: product }));
            return [...prev, product.id];
        });
    }, []);

    const removeFromPreview = useCallback((id) => {
        setModalSelectedIds((prev) => prev.filter((x) => x !== id));
    }, []);

    const clearModalSelection = useCallback(() => {
        setModalSelectedIds([]);
    }, []);

    const confirmAddMapping = useCallback(() => {
        if (!addModalTarget) return;
        if (!modalSelectedIds.length) { toast.error('Select at least one product'); return; }
        createMutation.mutate({
            merchantSkuId:      addModalTarget.id,
            platformProductIds: modalSelectedIds,
            platformStoreId:    modalStoreId ? Number(modalStoreId) : undefined,
        });
    }, [addModalTarget, modalSelectedIds, modalStoreId, createMutation]);

    const openUnlinkConfirm = useCallback((mappingId, skuName) => {
        setUnlinkTarget({ mappingId, skuName });
        setShowUnlinkConfirm(true);
    }, []);

    const handleSyncMapped = useCallback((merchantSkuId) => {
        syncMappedMutation.mutate({ merchantSkuId });
    }, [syncMappedMutation]);

    const toggleSelect = useCallback((id) => {
        setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    }, []);

    const toggleAll = useCallback(async () => {
        setSelectionLoading(true);
        const pageIds = merchantSkus.map((s) => s.id);
        const allFilteredSelected =
            pagination.total > 0 &&
            selectedIds.length >= pagination.total &&
            pageIds.every((id) => selectedIds.includes(id));

        if (allFilteredSelected) {
            setSelectedIds([]);
            setSelectedMerchantSkus([]);
            setSelectionLoading(false);
            return;
        }

        try {
            const allRows = await fetchAllMerchantList(listParams, pagination.total);
            const filteredRows = LOCAL_MAPPING_SEARCH_TYPES.has(skuType) && searchApplied.trim()
                ? allRows.filter((sku) => matchesLocalMappingSearch(sku, skuType, searchApplied.trim().toLowerCase()))
                : allRows;
            setSelectedMerchantSkus(filteredRows);
            setSelectedIds(filteredRows.map((sku) => sku.id));
        } catch (err) {
            toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to select all SKU mappings');
        } finally {
            setSelectionLoading(false);
        }
    }, [merchantSkus, selectedIds, pagination.total, listParams, skuType, searchApplied]);

    const toggleExpand = useCallback((id) => {
        setExpandedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    }, []);

    const handleSearch = useCallback(() => {
        setSearchApplied(searchInput.trim());
        setPage(1);
        setSelectedIds([]);
        setSelectedMerchantSkus([]);
    }, [searchInput]);

    const handleTabChange = useCallback((status) => {
        setMappingStatus(status);
        setPage(1);
        setSelectedIds([]);
        setSelectedMerchantSkus([]);
    }, []);

    return {
        // main list
        searchInput, setSearchInput, handleSearch,
        skuType, setSkuType,
        mappingStatus, handleTabChange,
        page, setPage,
        pageSizeInput, setPageSizeInput, applyPageSize,

        // data
        merchantSkus, pagination,
        counts,
        isLoading, isFetching, isError, error, refetch,

        // selection
        selectedIds, selectedMerchantSkus, selectionLoading, toggleSelect, toggleAll,
        allSelected:  merchantSkus.length > 0 && merchantSkus.every((s) => selectedIds.includes(s.id)),
        someSelected: merchantSkus.some((s) => selectedIds.includes(s.id)),

        // expand/collapse detail dropdown
        expandedIds, toggleExpand,

        // Add Mapping modal
        showAddModal, setShowAddModal,
        addModalTarget,
        modalPlatform, setModalPlatform,
        modalStoreId, setModalStoreId,
        modalStoreName, setModalStoreName,
        modalStatus, setModalStatus,
        modalSkuType, setModalSkuType,
        modalSkuTypeLabel, setModalSkuTypeLabel,
        modalSearchInput, setModalSearchInput,
        handleModalSearch,
        pickerProducts, pickerLoading, pickerFetching,
        modalSelectedIds,
        pickerPreview,
        toggleModalSelect,
        removeFromPreview,
        clearModalSelection,
        openAddModal,
        confirmAddMapping,
        creating: createMutation.isPending,

        // Unlink confirm
        showUnlinkConfirm, setShowUnlinkConfirm,
        unlinkTarget,
        openUnlinkConfirm,
        confirmUnlink: () => unlinkMutation.mutate(),
        unlinking: unlinkMutation.isPending,

        // Sync mapped
        handleSyncMapped,
        syncingMapped: syncMappedMutation.isPending,
    };
}
