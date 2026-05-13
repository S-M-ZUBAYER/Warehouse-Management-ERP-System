import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import useDebounce from '../../../../hooks/useDebounce';
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

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/sku-mapping/by-merchant — merchant SKU list with mapping status
const fetchMerchantList = (params) => {
    const qs = new URLSearchParams();
    qs.set('page',  params.page  ?? 1);
    qs.set('limit', params.limit ?? 20);
    if (params.search?.trim()) qs.set('search',        params.search.trim());
    if (params.skuType)        qs.set('skuType',       params.skuType);
    if (params.mappingStatus && params.mappingStatus !== 'all')
        qs.set('mappingStatus', params.mappingStatus);
    return api.get(`/sku-mapping/by-merchant?${qs.toString()}`).then((r) => r);
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

    // ── Selection ─────────────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState([]);

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

    const debouncedModalSearch = useDebounce(modalSearchApplied, 0);  // already applied on button

    // ── Query: merchant SKU list ──────────────────────────────────────────────
    const listParams = {
        page,
        limit:         20,
        search:        searchApplied || undefined,
        skuType:       skuType       || undefined,
        mappingStatus: mappingStatus !== 'all' ? mappingStatus : undefined,
    };

    const {
        data: listData,
        isLoading,
        isFetching,
        isError,
        error,
    } = useQuery({
        queryKey:        BY_MERCHANT_KEYS.list(listParams),
        queryFn:         () => fetchMerchantList(listParams),
        staleTime:       1000 * 60,
        placeholderData: (prev) => prev,
    });

    const merchantSkus = listData?.data       ?? [];
    const pagination   = listData?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 20 };

    // ── Query: counts ─────────────────────────────────────────────────────────
    const { data: counts = { all: 0, mapped: 0, unmapped: 0 } } = useQuery({
        queryKey:        BY_MERCHANT_KEYS.counts(),
        queryFn:         fetchMerchantCounts,
        staleTime:       1000 * 30,
        placeholderData: { all: 0, mapped: 0, unmapped: 0 },
    });

    // ── Query: product picker (inside Add Mapping modal) ──────────────────────
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
    const resetModalState = () => {
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
    };

    const openAddModal = useCallback((merchantSku) => {
        resetModalState();
        setAddModalTarget(merchantSku);
        setShowAddModal(true);
    }, []);

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

    const toggleAll = useCallback(() => {
        const ids    = merchantSkus.map((s) => s.id);
        const allSel = ids.every((id) => selectedIds.includes(id));
        setSelectedIds(allSel ? [] : ids);
    }, [merchantSkus, selectedIds]);

    const toggleExpand = useCallback((id) => {
        setExpandedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    }, []);

    const handleSearch = useCallback(() => {
        setSearchApplied(searchInput.trim());
        setPage(1);
    }, [searchInput]);

    const handleTabChange = useCallback((status) => {
        setMappingStatus(status);
        setPage(1);
        setSelectedIds([]);
    }, []);

    return {
        // main list
        searchInput, setSearchInput, handleSearch,
        skuType, setSkuType,
        mappingStatus, handleTabChange,
        page, setPage,

        // data
        merchantSkus, pagination,
        counts,
        isLoading, isFetching, isError, error,

        // selection
        selectedIds, toggleSelect, toggleAll,
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