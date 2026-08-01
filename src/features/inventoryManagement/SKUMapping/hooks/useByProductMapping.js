

// import { useState, useCallback } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import api from '../../../../lib/api';
// import useDebounce from '../../../../hooks/useDebounce';

// export const BY_PRODUCT_KEYS = {
//     all:    ()       => ['by-product'],
//     list:   (params) => ['by-product', 'list', params],
//     counts: (params) => ['by-product', 'counts', params],
// };

// const fetchProducts = (params) => {
//     const qs = new URLSearchParams();
//     qs.set('page',  params.page  ?? 1);
//     qs.set('limit', params.limit ?? 20);
//     if (params.platformStoreId) qs.set('platformStoreId', params.platformStoreId);
//     if (params.platform)        qs.set('platform',        params.platform);
//     if (params.search?.trim())  qs.set('search',          params.search.trim());
//     if (params.skuType)         qs.set('skuType',         params.skuType);
//     if (params.mappingStatus && params.mappingStatus !== 'all')
//         qs.set('mappingStatus', params.mappingStatus);
//     return api.get(`/platform-products?${qs.toString()}`).then((r) => r.data);
// };

// const fetchCounts = (params) => {
//     const qs = new URLSearchParams();
//     if (params.platformStoreId) qs.set('platformStoreId', params.platformStoreId);
//     if (params.platform)        qs.set('platform',        params.platform);
//     return api.get(`/platform-products/counts?${qs.toString()}`).then((r) => r.data);
// };

// // POST /api/v1/platform-products/sync
// // Now accepts { platform, platformStoreId } to sync specific platform/store
// const syncProducts = (body) =>
//     api.post('/platform-products/sync', {}, { params: body }).then((r) => r.data);

// // POST /api/v1/platform-products/generate-sku
// // Auto-creates merchant SKU from platform product (uses seller_sku as sku_name)
// const generateSku = (body) =>
//     api.post('/platform-products/generate-sku', body).then((r) => r.data);

// // POST /api/v1/platform-products/auto-mapping
// // Requires platform + platformStoreId now (mandatory in updated hook)
// const autoMap = (body) =>
//     api.post('/platform-products/auto-mapping', body).then((r) => r.data);

// const unlinkMapping = (id) =>
//     api.delete(`/platform-products/mapping/${id}`).then((r) => r.data);

// // ─────────────────────────────────────────────────────────────────────────────
// export function useByProductMapping() {
//     const queryClient = useQueryClient();

//     // ── Filter state ──────────────────────────────────────────────────────────
//     const [selectedPlatform, setSelectedPlatform] = useState('');
//     const [selectedStoreId,  setSelectedStoreId]  = useState('');
//     const [searchInput,      setSearchInput]       = useState('');
//     const [searchApplied,    setSearchApplied]     = useState('');
//     const [skuType,          setSkuType]           = useState('product_name');
//     const [mappingStatus,    setMappingStatus]     = useState('all');
//     const [page,             setPage]              = useState(1);

//     const [selectedIds, setSelectedIds] = useState([]);
//     const [expandedIds, setExpandedIds] = useState([]);

//     // ── Sync modal state ──────────────────────────────────────────────────────
//     const [showSyncResultModal, setShowSyncResultModal] = useState(false);
//     const [syncResults,         setSyncResults]         = useState(null);

//     // ── Generate Merchant SKU modal ───────────────────────────────────────────
//     const [showGenModal,     setShowGenModal]     = useState(false);
//     const [genWarehouseId,   setGenWarehouseId]   = useState('');
//     const [genWarehouseName, setGenWarehouseName] = useState('');

//     // ── Auto Mapping modal — now requires platform + store ────────────────────
//     const [showAutoMapModal,    setShowAutoMapModal]    = useState(false);
//     const [autoModalPlatform,   setAutoModalPlatform]   = useState('');
//     const [autoModalStoreId,    setAutoModalStoreId]    = useState('');
//     const [autoWarehouseId,     setAutoWarehouseId]     = useState('');
//     const [autoWarehouseName,   setAutoWarehouseName]   = useState('');
//     const [autoMappingResult,   setAutoMappingResult]   = useState(null);  // ← shows result in modal

//     // ── Unlink confirm ────────────────────────────────────────────────────────
//     const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
//     const [unlinkTarget,      setUnlinkTarget]      = useState(null);

//     const listParams = {
//         page,
//         limit:          20,
//         platformStoreId:selectedStoreId  || undefined,
//         platform:       selectedPlatform || undefined,
//         search:         searchApplied    || undefined,
//         skuType:        skuType          || undefined,
//         mappingStatus:  mappingStatus !== 'all' ? mappingStatus : undefined,
//     };

//     const countParams = {
//         platformStoreId: selectedStoreId  || undefined,
//         platform:        selectedPlatform || undefined,
//     };

//     const {
//         data: listData, isLoading, isFetching, isError, error,
//     } = useQuery({
//         queryKey:        BY_PRODUCT_KEYS.list(listParams),
//         queryFn:         () => fetchProducts(listParams),
//         staleTime:       1000 * 60,
//         placeholderData: (prev) => prev,
//     });

//     const products   = listData?.data       ?? listData       ?? [];
//     const pagination = listData?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 20 };

//     const { data: counts = { all: 0, mapped: 0, unmapped: 0 } } = useQuery({
//         queryKey:        BY_PRODUCT_KEYS.counts(countParams),
//         queryFn:         () => fetchCounts(countParams),
//         staleTime:       1000 * 30,
//         placeholderData: { all: 0, mapped: 0, unmapped: 0 },
//     });

//     // ── Mutations ─────────────────────────────────────────────────────────────

//     const syncMutation = useMutation({
//         mutationFn: (body) => syncProducts(body),
//         onSuccess: (data) => {
//             setSyncResults(data.results ?? []);
//             setShowSyncResultModal(true);
//             queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
//         },
//         onError: (err) => toast.error(err?.response?.data?.message ?? 'Sync failed'),
//     });

//     const generateMutation = useMutation({
//         mutationFn: generateSku,
//         onSuccess: (data) => {
//             toast.success(data.message ?? 'Merchant SKU(s) generated');
//             setShowGenModal(false);
//             setSelectedIds([]);
//             queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
//         },
//         onError: (err) => toast.error(err?.response?.data?.message ?? 'Generation failed'),
//     });

//     const autoMapMutation = useMutation({
//         mutationFn: autoMap,
//         onSuccess: (data) => {
//             // Show result breakdown inside the modal instead of closing immediately
//             setAutoMappingResult(data);
//             queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
//         },
//         onError: (err) => toast.error(err?.response?.data?.message ?? 'Auto mapping failed'),
//     });

//     const unlinkMutation = useMutation({
//         mutationFn: () => unlinkMapping(unlinkTarget?.mapping_id),
//         onSuccess: () => {
//             toast.success('Mapping removed');
//             setShowUnlinkConfirm(false);
//             setUnlinkTarget(null);
//             queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
//         },
//         onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to unlink'),
//     });

//     // ── Helpers ───────────────────────────────────────────────────────────────

//     const toggleSelect = useCallback((id) => {
//         setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
//     }, []);

//     const toggleAll = useCallback(() => {
//         const ids = products.map((p) => p.id);
//         setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids);
//     }, [products, selectedIds]);

//     const toggleExpand = useCallback((id) => {
//         setExpandedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
//     }, []);

//     const handleSearch = useCallback(() => {
//         setSearchApplied(searchInput.trim());
//         setPage(1);
//     }, [searchInput]);

//     const handleTabChange = useCallback((status) => {
//         setMappingStatus(status);
//         setPage(1);
//         setSelectedIds([]);
//     }, []);

//     const handlePlatformChange = useCallback((platform) => {
//         setSelectedPlatform(platform);
//         setSelectedStoreId('');
//         setPage(1);
//         setSelectedIds([]);
//     }, []);

//     const handleStoreChange = useCallback((storeId) => {
//         setSelectedStoreId(storeId);
//         setPage(1);
//         setSelectedIds([]);
//     }, []);

//     // handleSyncClick now accepts platform/storeId from the sync modal
//     const handleSyncClick = useCallback((platform, platformStoreId) => {
//         syncMutation.mutate({
//             platform:        platform        || undefined,
//             platformStoreId: platformStoreId || undefined,
//         });
//     }, [syncMutation]);

//     // handleGenerateClick: validation moved to page (page checks platform + selection)
//     const handleGenerateClick = useCallback(() => {
//         setGenWarehouseId('');
//         setShowGenModal(true);
//     }, []);

//     const handleAutoMapClick = useCallback(() => {
//         setAutoModalPlatform(selectedPlatform || '');
//         setAutoModalStoreId('');
//         setAutoWarehouseId('');
//         setAutoMappingResult(null);
//         setShowAutoMapModal(true);
//     }, [selectedPlatform]);

//     const confirmGenerateSku = useCallback(() => {
//         if (!genWarehouseId) { toast.error('Select a warehouse'); return; }
//         generateMutation.mutate({
//             platformProductIds: selectedIds,
//             warehouseId:        Number(genWarehouseId),
//         });
//     }, [selectedIds, genWarehouseId, generateMutation]);

//     const confirmAutoMap = useCallback(() => {
//         if (!autoModalPlatform)  { toast.error('Select a platform'); return; }
//         if (!autoModalStoreId)   { toast.error('Select a store');    return; }
//         if (!autoWarehouseId)    { toast.error('Select a warehouse'); return; }
//         autoMapMutation.mutate({
//             platformProductIds: selectedIds.length ? selectedIds : [],
//             platformStoreId:    Number(autoModalStoreId),
//             warehouseId:        Number(autoWarehouseId),
//         });
//     }, [selectedIds, autoModalPlatform, autoModalStoreId, autoWarehouseId, autoMapMutation]);

//     const openUnlinkConfirm = useCallback((product) => {
//         setUnlinkTarget(product);
//         setShowUnlinkConfirm(true);
//     }, []);

//     return {
//         // filter
//         selectedPlatform, handlePlatformChange,
//         selectedStoreId,  handleStoreChange,
//         searchInput, setSearchInput, handleSearch,
//         skuType, setSkuType,
//         mappingStatus, handleTabChange,
//         page, setPage,

//         // data
//         products, pagination,
//         counts,
//         isLoading, isFetching, isError, error,

//         // selection
//         selectedIds, toggleSelect, toggleAll,
//         allSelected:  products.length > 0 && products.every((p) => selectedIds.includes(p.id)),
//         someSelected: products.some((p) => selectedIds.includes(p.id)),

//         // expand/collapse
//         expandedIds, toggleExpand,

//         // sync
//         showSyncResultModal, setShowSyncResultModal,
//         syncResults,
//         handleSyncClick,
//         syncing: syncMutation.isPending,

//         // generate SKU modal
//         showGenModal, setShowGenModal,
//         genWarehouseId, setGenWarehouseId,
//         genWarehouseName, setGenWarehouseName,
//         handleGenerateClick,
//         confirmGenerateSku,
//         generating: generateMutation.isPending,

//         // auto map modal — platform + store required
//         showAutoMapModal, setShowAutoMapModal,
//         autoModalPlatform, setAutoModalPlatform,
//         autoModalStoreId,  setAutoModalStoreId,
//         autoWarehouseId, setAutoWarehouseId,
//         autoWarehouseName, setAutoWarehouseName,
//         handleAutoMapClick,
//         confirmAutoMap,
//         autoMappingResult, setAutoMappingResult,
//         autoMapping: autoMapMutation.isPending,

//         // unlink
//         showUnlinkConfirm, setShowUnlinkConfirm,
//         unlinkTarget,
//         openUnlinkConfirm,
//         confirmUnlink: () => unlinkMutation.mutate(),
//         unlinking: unlinkMutation.isPending,
//     };
// }


// import { useState, useCallback } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import api from '../../../../lib/api';
// import useDebounce from '../../../../hooks/useDebounce';

// // ─────────────────────────────────────────────────────────────────────────────
// // Query Keys
// // ─────────────────────────────────────────────────────────────────────────────
// export const BY_PRODUCT_KEYS = {
//     all:       ()       => ['by-product'],
//     hierarchy: (params) => ['by-product', 'hierarchy', params],
//     counts:    (params) => ['by-product', 'counts', params],
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // API helpers — all hit /api/v1/platform-products/*
// // ─────────────────────────────────────────────────────────────────────────────

// /**
//  * fetchHierarchy — GET /api/v1/platform-products/hierarchy
//  * Returns 3-level tree: parents → children[] → platform_mappings[]
//  */
// const fetchHierarchy = (params) => {
//     const qs = new URLSearchParams();
//     qs.set('page',  params.page  ?? 1);
//     qs.set('limit', params.limit ?? 20);
//     if (params.platformStoreId)  qs.set('platformStoreId', params.platformStoreId);
//     if (params.platform)         qs.set('platform',        params.platform);
//     if (params.search?.trim())   qs.set('search',          params.search.trim());
//     if (params.skuType)          qs.set('skuType',         params.skuType);
//     if (params.mappingStatus && params.mappingStatus !== 'all')
//         qs.set('mappingStatus', params.mappingStatus);
//     return api.get(`/platform-products/hierarchy?${qs.toString()}`).then((r) => r.data);
// };

// const fetchCounts = (params) => {
//     const qs = new URLSearchParams();
//     if (params.platformStoreId) qs.set('platformStoreId', params.platformStoreId);
//     if (params.platform)        qs.set('platform',        params.platform);
//     return api.get(`/platform-products/counts?${qs.toString()}`).then((r) => r.data);
// };

// // POST /api/v1/platform-products/sync
// const syncProducts = (params) =>
//     api.post('/platform-products/sync', {}, { params }).then((r) => r.data);

// // POST /api/v1/platform-products/generate-sku
// // Body: { platformProductIds: [childId,...], warehouseId }
// // Child IDs = ids of child rows (row_type='child') from the hierarchy
// const generateSku = (body) =>
//     api.post('/platform-products/generate-sku', body).then((r) => r.data);

// // POST /api/v1/platform-products/auto-mapping
// // Body: { platformProductIds?: [], platformStoreId, warehouseId }
// const autoMap = (body) =>
//     api.post('/platform-products/auto-mapping', body).then((r) => r.data);

// // DELETE /api/v1/platform-products/mapping/:id
// const unlinkMapping = (id) =>
//     api.delete(`/platform-products/mapping/${id}`).then((r) => r.data);

// // ─────────────────────────────────────────────────────────────────────────────
// // Hook
// // ─────────────────────────────────────────────────────────────────────────────
// export function useByProductMapping() {
//     const queryClient = useQueryClient();

//     // ── Filter state ──────────────────────────────────────────────────────────
//     const [selectedPlatform, setSelectedPlatform] = useState('');
//     const [selectedStoreId,  setSelectedStoreId]  = useState('');
//     const [searchInput,      setSearchInput]       = useState('');
//     const [searchApplied,    setSearchApplied]     = useState('');
//     const [skuType,          setSkuType]           = useState('product_name');
//     const [mappingStatus,    setMappingStatus]     = useState('all');
//     const [page,             setPage]              = useState(1);

//     // ── Selection (for generate/auto-map) — selects child row IDs ─────────────
//     const [selectedIds, setSelectedIds] = useState([]);

//     // ── Expanded rows ─────────────────────────────────────────────────────────
//     // expandedParentIds: parent row chevron expanded (shows Level-2 children)
//     // expandedChildIds:  child row chevron expanded (shows Level-3 platform mappings)
//     const [expandedParentIds, setExpandedParentIds] = useState([]);
//     const [expandedChildIds,  setExpandedChildIds]  = useState([]);

//     // ── Modal state ───────────────────────────────────────────────────────────
//     const [showSyncResultModal, setShowSyncResultModal] = useState(false);
//     const [syncResults,         setSyncResults]         = useState(null);
//     const [showGenModal,        setShowGenModal]        = useState(false);
//     const [showAutoMapModal,    setShowAutoMapModal]    = useState(false);
//     const [showUnlinkConfirm,   setShowUnlinkConfirm]  = useState(false);
//     const [unlinkTarget,        setUnlinkTarget]       = useState(null);

//     // Generate SKU modal state
//     const [genWarehouseId,   setGenWarehouseId]   = useState('');
//     const [genWarehouseName, setGenWarehouseName] = useState('');

//     // Auto-map modal state
//     const [autoWarehouseId,   setAutoWarehouseId]   = useState('');
//     const [autoWarehouseName, setAutoWarehouseName] = useState('');
//     const [autoModalPlatform, setAutoModalPlatform] = useState('');
//     const [autoModalStoreId,  setAutoModalStoreId]  = useState('');
//     const [autoMappingResult, setAutoMappingResult] = useState(null);

//     const listParams = {
//         page,
//         limit:          20,
//         platformStoreId: selectedStoreId  || undefined,
//         platform:        selectedPlatform || undefined,
//         search:          searchApplied    || undefined,
//         skuType:         skuType          || undefined,
//         mappingStatus:   mappingStatus !== 'all' ? mappingStatus : undefined,
//     };

//     const countParams = {
//         platformStoreId: selectedStoreId  || undefined,
//         platform:        selectedPlatform || undefined,
//     };

//     // ── Query: hierarchy (3-level tree) ──────────────────────────────────────
//     const {
//         data: hierarchyData,
//         isLoading,
//         isFetching,
//         isError,
//         error,
//     } = useQuery({
//         queryKey:        BY_PRODUCT_KEYS.hierarchy(listParams),
//         queryFn:         () => fetchHierarchy(listParams),
//         staleTime:       1000 * 60,
//         placeholderData: (prev) => prev,
//     });

//     // hierarchyData.data = array of parent rows, each with .children[]
//     const parents    = hierarchyData?.data       ?? hierarchyData       ?? [];
//     const pagination = hierarchyData?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 20 };

//     // Flat list of all child rows (for select-all logic)
//     const allChildren = parents.flatMap((p) => p.children ?? []);

//     // ── Query: counts for tabs ─────────────────────────────────────────────────
//     const { data: counts = { all: 0, mapped: 0, unmapped: 0 } } = useQuery({
//         queryKey:        BY_PRODUCT_KEYS.counts(countParams),
//         queryFn:         () => fetchCounts(countParams),
//         staleTime:       1000 * 30,
//         placeholderData: { all: 0, mapped: 0, unmapped: 0 },
//     });

//     // ── Mutations ─────────────────────────────────────────────────────────────

//     const syncMutation = useMutation({
//         mutationFn: (body) => syncProducts(body),
//         onSuccess: (data) => {
//             setSyncResults(data.results ?? []);
//             setShowSyncResultModal(true);
//             queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
//         },
//         onError: (err) => toast.error(err?.response?.data?.message ?? 'Sync failed'),
//     });

//     const generateMutation = useMutation({
//         mutationFn: generateSku,
//         onSuccess: (data) => {
//             toast.success(data.message ?? 'Merchant SKU(s) generated');
//             setShowGenModal(false);
//             setSelectedIds([]);
//             queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
//         },
//         onError: (err) => toast.error(err?.response?.data?.message ?? 'Generation failed'),
//     });

//     const autoMapMutation = useMutation({
//         mutationFn: autoMap,
//         onSuccess: (data) => {
//             // Show result breakdown inside the modal
//             setAutoMappingResult(data);
//             queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
//         },
//         onError: (err) => toast.error(err?.response?.data?.message ?? 'Auto mapping failed'),
//     });

//     const unlinkMutation = useMutation({
//         mutationFn: () => unlinkMapping(unlinkTarget?.mapping_id),
//         onSuccess: () => {
//             toast.success('Mapping removed');
//             setShowUnlinkConfirm(false);
//             setUnlinkTarget(null);
//             queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
//         },
//         onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to unlink'),
//     });

//     // ── Helpers ───────────────────────────────────────────────────────────────

//     // Select/deselect individual child row
//     const toggleSelect = useCallback((childId) => {
//         setSelectedIds((p) => p.includes(childId) ? p.filter((x) => x !== childId) : [...p, childId]);
//     }, []);

//     // Select/deselect all visible child rows
//     const toggleAll = useCallback(() => {
//         const ids = allChildren.map((c) => c.id);
//         setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids);
//     }, [allChildren, selectedIds]);

//     // Expand/collapse parent rows (Level-2 children)
//     const toggleExpandParent = useCallback((parentId) => {
//         setExpandedParentIds((p) =>
//             p.includes(parentId) ? p.filter((x) => x !== parentId) : [...p, parentId]
//         );
//     }, []);

//     // Expand/collapse child rows (Level-3 platform mappings)
//     const toggleExpandChild = useCallback((childId) => {
//         setExpandedChildIds((p) =>
//             p.includes(childId) ? p.filter((x) => x !== childId) : [...p, childId]
//         );
//     }, []);

//     const handleSearch = useCallback(() => {
//         setSearchApplied(searchInput.trim());
//         setPage(1);
//     }, [searchInput]);

//     const handleTabChange = useCallback((status) => {
//         setMappingStatus(status);
//         setPage(1);
//         setSelectedIds([]);
//     }, []);

//     const handlePlatformChange = useCallback((platform) => {
//         setSelectedPlatform(platform);
//         setSelectedStoreId('');
//         setPage(1);
//         setSelectedIds([]);
//     }, []);

//     const handleStoreChange = useCallback((storeId) => {
//         setSelectedStoreId(storeId);
//         setPage(1);
//         setSelectedIds([]);
//     }, []);

//     const handleSyncClick = useCallback((platform, platformStoreId) => {
//         syncMutation.mutate({
//             platform:        platform        || undefined,
//             platformStoreId: platformStoreId || undefined,
//         });
//     }, [syncMutation]);

//     const handleGenerateClick = useCallback(() => {
//         setGenWarehouseId('');
//         setShowGenModal(true);
//     }, []);

//     const handleAutoMapClick = useCallback(() => {
//         setAutoModalPlatform(selectedPlatform || '');
//         setAutoModalStoreId('');
//         setAutoWarehouseId('');
//         setAutoMappingResult(null);
//         setShowAutoMapModal(true);
//     }, [selectedPlatform]);

//     const confirmGenerateSku = useCallback(() => {
//         if (!genWarehouseId) { toast.error('Select a warehouse'); return; }
//         generateMutation.mutate({
//             platformProductIds: selectedIds,   // child row IDs
//             warehouseId:        Number(genWarehouseId),
//         });
//     }, [selectedIds, genWarehouseId, generateMutation]);

//     const confirmAutoMap = useCallback(() => {
//         if (!autoModalPlatform) { toast.error('Select a platform');  return; }
//         if (!autoModalStoreId)  { toast.error('Select a store');     return; }
//         if (!autoWarehouseId)   { toast.error('Select a warehouse'); return; }
//         autoMapMutation.mutate({
//             platformProductIds: selectedIds.length ? selectedIds : [],
//             platformStoreId:    Number(autoModalStoreId),
//             warehouseId:        Number(autoWarehouseId),
//         });
//     }, [selectedIds, autoModalPlatform, autoModalStoreId, autoWarehouseId, autoMapMutation]);

//     const openUnlinkConfirm = useCallback((child) => {
//         setUnlinkTarget(child);
//         setShowUnlinkConfirm(true);
//     }, []);

//     const allChildrenSelected =
//         allChildren.length > 0 && allChildren.every((c) => selectedIds.includes(c.id));
//     const someChildrenSelected = allChildren.some((c) => selectedIds.includes(c.id));

//     return {
//         // filter
//         selectedPlatform, handlePlatformChange,
//         selectedStoreId,  handleStoreChange,
//         searchInput, setSearchInput, handleSearch,
//         skuType, setSkuType,
//         mappingStatus, handleTabChange,
//         page, setPage,

//         // data — hierarchy tree
//         parents,
//         allChildren,
//         pagination,
//         counts,
//         isLoading, isFetching, isError, error,

//         // selection (child IDs)
//         selectedIds, toggleSelect, toggleAll,
//         allSelected:  allChildrenSelected,
//         someSelected: someChildrenSelected,

//         // expand/collapse
//         expandedParentIds, toggleExpandParent,
//         expandedChildIds,  toggleExpandChild,

//         // sync
//         showSyncResultModal, setShowSyncResultModal,
//         syncResults,
//         handleSyncClick,
//         syncing: syncMutation.isPending,

//         // generate SKU modal
//         showGenModal, setShowGenModal,
//         genWarehouseId, setGenWarehouseId,
//         genWarehouseName, setGenWarehouseName,
//         handleGenerateClick,
//         confirmGenerateSku,
//         generating: generateMutation.isPending,

//         // auto map modal
//         showAutoMapModal, setShowAutoMapModal,
//         autoModalPlatform, setAutoModalPlatform,
//         autoModalStoreId,  setAutoModalStoreId,
//         autoWarehouseId, setAutoWarehouseId,
//         autoWarehouseName, setAutoWarehouseName,
//         handleAutoMapClick,
//         confirmAutoMap,
//         autoMappingResult, setAutoMappingResult,
//         autoMapping: autoMapMutation.isPending,

//         // unlink
//         showUnlinkConfirm, setShowUnlinkConfirm,
//         unlinkTarget,
//         openUnlinkConfirm,
//         confirmUnlink: () => unlinkMutation.mutate(),
//         unlinking: unlinkMutation.isPending,
//     };
// }


// import { useState, useCallback } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import api from '../../../../lib/api';
// import useDebounce from '../../../../hooks/useDebounce';

// // ─────────────────────────────────────────────────────────────────────────────
// // Query Keys
// // ─────────────────────────────────────────────────────────────────────────────
// export const BY_PRODUCT_KEYS = {
//     all:    ()       => ['by-product'],
//     list:   (params) => ['by-product', 'list', params],
//     counts: (params) => ['by-product', 'counts', params],
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // API helpers
// // All hit /api/v1/platform-products/* (Node.js — see platformProducts.routes.js)
// // ─────────────────────────────────────────────────────────────────────────────
// // const fetchProducts = (params) => {
// //     const qs = new URLSearchParams();
// //     qs.set('page',  params.page  ?? 1);
// //     qs.set('limit', params.limit ?? 20);
// //     if (params.platformStoreId) qs.set('platformStoreId', params.platformStoreId);
// //     if (params.platform)        qs.set('platform',        params.platform);
// //     if (params.search?.trim())  qs.set('search',          params.search.trim());
// //     if (params.skuType)         qs.set('skuType',         params.skuType);
// //     if (params.mappingStatus && params.mappingStatus !== 'all')
// //         qs.set('mappingStatus', params.mappingStatus);
// //     return api.get(`/platform-products?${qs.toString()}`).then((r) => r);
// // };
// const fetchProducts = (params) => {
//     console.log("start the fetching");
    
//     const qs = new URLSearchParams();
//     qs.set('page',  params.page  ?? 1);
//     qs.set('limit', params.limit ?? 20);
//     if (params.platformStoreId) qs.set('platformStoreId', params.platformStoreId);
//     if (params.platform)        qs.set('platform',        params.platform);
//     if (params.search?.trim())  qs.set('search',          params.search.trim());
//     if (params.skuType)         qs.set('skuType',         params.skuType);
//     if (params.mappingStatus && params.mappingStatus !== 'all')
//         qs.set('mappingStatus', params.mappingStatus);
//     return api.get(`/platform-products?${qs.toString()}`).then((r) => {
//         console.log('RAW API RESPONSE:', r);        // ← add this
//         console.log('RESPONSE DATA:', r.data);      // ← and this
//         return r.data;
//     });
// };

// const fetchCounts = (params) => {
//     const qs = new URLSearchParams();
//     if (params.platformStoreId) qs.set('platformStoreId', params.platformStoreId);
//     if (params.platform)        qs.set('platform',        params.platform);
//     return api.get(`/platform-products/counts?${qs.toString()}`).then((r) => r.data);
// };

// // POST /api/v1/platform-products/sync
// // Calls Java proxy internally for Shopee + TikTok — syncs all stores for the company
// // const syncProducts    = (params) => api.post('/platform-products/sync', null, { params }).then((r) => r.data);
// const syncProducts = (params) => 
//   api.post('/platform-products/sync', {}, { params }).then((r) => r.data);


// // POST /api/v1/platform-products/generate-sku
// // Creates merchant_sku rows + platform_sku_mapping for selected products
// const generateSku     = (body) => api.post('/platform-products/generate-sku', body).then((r) => r.data);

// // POST /api/v1/platform-products/auto-mapping
// // Matches seller_sku → sku_name, creates mapping rows, pushes stock
// const autoMap         = (body) => api.post('/platform-products/auto-mapping', body).then((r) => r.data);

// // DELETE /api/v1/platform-products/mapping/:id
// // Soft-deletes the mapping and resets is_mapped on the platform product
// const unlinkMapping   = (id) => api.delete(`/platform-products/mapping/${id}`).then((r) => r.data);

// // ─────────────────────────────────────────────────────────────────────────────
// // Hook
// // ─────────────────────────────────────────────────────────────────────────────
// export function useByProductMapping() {
//     const queryClient = useQueryClient();

//     // ── Filter state ──────────────────────────────────────────────────────────
//     const [selectedPlatform, setSelectedPlatform] = useState('');
//     const [selectedStoreId,  setSelectedStoreId]  = useState('');
//     const [searchInput,      setSearchInput]       = useState('');
//     const [searchApplied,    setSearchApplied]     = useState('');
//     const [skuType,          setSkuType]           = useState('product_name');
//     const [mappingStatus,    setMappingStatus]     = useState('all');
//     const [page,             setPage]              = useState(1);

//     // ── Selection (for generate/auto-map) ─────────────────────────────────────
//     const [selectedIds, setSelectedIds] = useState([]);

//     // ── Expanded rows (parent row chevron) ────────────────────────────────────
//     const [expandedIds, setExpandedIds] = useState([]);

//     // ── Modal state ───────────────────────────────────────────────────────────
//     const [showSyncResultModal, setShowSyncResultModal] = useState(false);
//     const [syncResults,         setSyncResults]         = useState(null);
//     const [showGenModal,        setShowGenModal]        = useState(false);
//     const [showAutoMapModal,    setShowAutoMapModal]    = useState(false);
//     const [showUnlinkConfirm,   setShowUnlinkConfirm]  = useState(false);
//     const [unlinkTarget,        setUnlinkTarget]       = useState(null);

//     // Generate SKU modal state
//     const [genWarehouseId,   setGenWarehouseId]   = useState('');
//     const [genWarehouseName, setGenWarehouseName] = useState('Warehouse name here');

//     // Auto-map modal state
//     const [autoWarehouseId,   setAutoWarehouseId]   = useState('');
//     const [autoWarehouseName, setAutoWarehouseName] = useState('Warehouse name here');

//     const debouncedSearch = useDebounce(searchInput, 300);

//     const listParams = {
//         page,
//         limit:          20,
//         platformStoreId:selectedStoreId  || undefined,
//         platform:       selectedPlatform || undefined,
//         search:         searchApplied    || undefined,
//         skuType:        skuType          || undefined,
//         mappingStatus:  mappingStatus !== 'all' ? mappingStatus : undefined,
//     };

//     const countParams = {
//         platformStoreId: selectedStoreId  || undefined,
//         platform:        selectedPlatform || undefined,
//     };

//     // ── Query: product list ───────────────────────────────────────────────────
//     const {
//         data: listData,
//         isLoading,
//         isFetching,
//         isError,
//         error,
//     } = useQuery({
//         queryKey:        BY_PRODUCT_KEYS.list(listParams),
//         queryFn:         () => fetchProducts(listParams),
//         staleTime:       1000 * 60,
//         placeholderData: (prev) => prev,
//     });

//     const products   = listData       ?? [];
//     const pagination = listData?.pagination  ?? { total: 0, totalPages: 1, page: 1, limit: 20 };

//     // ── Query: counts for tabs ────────────────────────────────────────────────
//     const { data: counts = { all: 0, mapped: 0, unmapped: 0 } } = useQuery({
//         queryKey:        BY_PRODUCT_KEYS.counts(countParams),
//         queryFn:         () => fetchCounts(countParams),
//         staleTime:       1000 * 30,
//         placeholderData: { all: 0, mapped: 0, unmapped: 0 },
//     });

//     // ── Mutation: sync products ───────────────────────────────────────────────
//     // Calls Node.js which internally calls Java proxy for Shopee + TikTok
//     const syncMutation = useMutation({
//         mutationFn: () => syncProducts({
//             platformStoreId: selectedStoreId || undefined,
//             platform:        selectedPlatform || undefined,
//         }),
//         onSuccess: (data) => {
//             setSyncResults(data.results ?? []);
//             setShowSyncResultModal(true);
//             queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
//         },
//         onError: (err) => {
//             toast.error(err?.response?.data?.message ?? 'Sync failed');
//         },
//     });

//     // ── Mutation: generate merchant SKU ───────────────────────────────────────
//     const generateMutation = useMutation({
//         mutationFn: generateSku,
//         onSuccess: (data) => {
//             toast.success(data.message ?? 'Merchant SKU(s) generated');
//             setShowGenModal(false);
//             setSelectedIds([]);
//             queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
//         },
//         onError: (err) => {
//             toast.error(err?.response?.data?.message ?? 'Generation failed');
//         },
//     });

//     // ── Mutation: auto mapping ────────────────────────────────────────────────
//     const autoMapMutation = useMutation({
//         mutationFn: autoMap,
//         onSuccess: (data) => {
//             toast.success(data.message ?? 'Auto mapping complete');
//             setShowAutoMapModal(false);
//             setSelectedIds([]);
//             queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
//         },
//         onError: (err) => {
//             toast.error(err?.response?.data?.message ?? 'Auto mapping failed');
//         },
//     });

//     // ── Mutation: unlink mapping ──────────────────────────────────────────────
//     const unlinkMutation = useMutation({
//         mutationFn: () => unlinkMapping(unlinkTarget?.mapping_id),
//         onSuccess: () => {
//             toast.success('Mapping removed');
//             setShowUnlinkConfirm(false);
//             setUnlinkTarget(null);
//             queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
//         },
//         onError: (err) => {
//             toast.error(err?.response?.data?.message ?? 'Failed to unlink');
//         },
//     });

//     // ── Selection helpers ─────────────────────────────────────────────────────
//     const toggleSelect = useCallback((id) => {
//         setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
//     }, []);

//     const toggleAll = useCallback(() => {
//         const ids    = products.map((p) => p.id);
//         const allSel = ids.every((id) => selectedIds.includes(id));
//         setSelectedIds(allSel ? [] : ids);
//     }, [products, selectedIds]);

//     // ── Expand/collapse parent rows ───────────────────────────────────────────
//     const toggleExpand = useCallback((id) => {
//         setExpandedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
//     }, []);

//     // ── Action handlers ───────────────────────────────────────────────────────
//     const handleSearch = useCallback(() => {
//         setSearchApplied(searchInput.trim());
//         setPage(1);
//     }, [searchInput]);

//     const handleTabChange = useCallback((status) => {
//         setMappingStatus(status);
//         setPage(1);
//         setSelectedIds([]);
//     }, []);

//     const handlePlatformChange = useCallback((platform) => {
//         setSelectedPlatform(platform);
//         setSelectedStoreId('');
//         setPage(1);
//         setSelectedIds([]);
//     }, []);

//     const handleStoreChange = useCallback((storeId) => {
//         setSelectedStoreId(storeId);
//         setPage(1);
//         setSelectedIds([]);
//     }, []);

//     const handleSyncClick = useCallback(() => {
//         syncMutation.mutate();
//     }, [syncMutation]);

//     const handleGenerateClick = useCallback(() => {
//         if (!selectedIds.length) {
//             toast.error('Select at least one product first');
//             return;
//         }
//         setGenWarehouseId('');
//         setGenWarehouseName('Warehouse name here');
//         setShowGenModal(true);
//     }, [selectedIds]);

//     const handleAutoMapClick = useCallback(() => {
//         setAutoWarehouseId('');
//         setAutoWarehouseName('Warehouse name here');
//         setShowAutoMapModal(true);
//     }, []);

//     const confirmGenerateSku = useCallback(() => {
//         if (!genWarehouseId) { toast.error('Select a warehouse'); return; }
//         generateMutation.mutate({
//             platformProductIds: selectedIds,
//             warehouseId:        Number(genWarehouseId),
//         });
//     }, [selectedIds, genWarehouseId, generateMutation]);

//     const confirmAutoMap = useCallback(() => {
//         if (!autoWarehouseId) { toast.error('Select a warehouse'); return; }
//         autoMapMutation.mutate({
//             platformProductIds: selectedIds.length ? selectedIds : [],
//             warehouseId:        Number(autoWarehouseId),
//         });
//     }, [selectedIds, autoWarehouseId, autoMapMutation]);

//     const openUnlinkConfirm = useCallback((product) => {
//         setUnlinkTarget(product);
//         setShowUnlinkConfirm(true);
//     }, []);

//     return {
//         // filter
//         selectedPlatform, handlePlatformChange,
//         selectedStoreId,  handleStoreChange,
//         searchInput, setSearchInput, handleSearch,
//         skuType, setSkuType,
//         mappingStatus, handleTabChange,
//         page, setPage,

//         // data
//         products, pagination,
//         counts,
//         isLoading, isFetching, isError, error,

//         // selection
//         selectedIds, toggleSelect, toggleAll,
//         allSelected:  products.length > 0 && products.every((p) => selectedIds.includes(p.id)),
//         someSelected: products.some((p) => selectedIds.includes(p.id)),

//         // expand/collapse
//         expandedIds, toggleExpand,

//         // sync
//         showSyncResultModal, setShowSyncResultModal,
//         syncResults,
//         handleSyncClick,
//         syncing: syncMutation.isPending,

//         // generate SKU modal
//         showGenModal, setShowGenModal,
//         genWarehouseId, setGenWarehouseId,
//         genWarehouseName, setGenWarehouseName,
//         handleGenerateClick,
//         confirmGenerateSku,
//         generating: generateMutation.isPending,

//         // auto map modal
//         showAutoMapModal, setShowAutoMapModal,
//         autoWarehouseId, setAutoWarehouseId,
//         autoWarehouseName, setAutoWarehouseName,
//         handleAutoMapClick,
//         confirmAutoMap,
//         autoMapping: autoMapMutation.isPending,

//         // unlink
//         showUnlinkConfirm, setShowUnlinkConfirm,
//         unlinkTarget,
//         openUnlinkConfirm,
//         confirmUnlink: () => unlinkMutation.mutate(),
//         unlinking: unlinkMutation.isPending,
//     };
// }


import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../../../lib/api';

export const BY_PRODUCT_KEYS = {
    all:    ()       => ['by-product'],
    list:   (params) => ['by-product', 'list', params],
    statusList: (params) => ['by-product', 'status-list', params],
    counts: (params) => ['by-product', 'counts', params],
};

const PAGE_SIZE = 10;
const STATUS_FETCH_LIMIT = 200;

const fetchProducts = (params) => {
    const qs = new URLSearchParams();
    qs.set('page',  params.page  ?? 1);
    qs.set('limit', params.limit ?? 10);
    if (params.platformStoreId) qs.set('platformStoreId', params.platformStoreId);
    if (params.platform)        qs.set('platform',        params.platform);
    if (params.search?.trim())  qs.set('search',          params.search.trim());
    if (params.skuType)         qs.set('skuType',         params.skuType);
    if (params.mappingStatus && params.mappingStatus !== 'all')
        qs.set('mappingStatus', params.mappingStatus);
    return api.get(`/platform-products?${qs.toString()}`);
};

const fetchAllProducts = async (params, knownTotal = 0) => {
    const pageLimit = Math.max(100, Number(knownTotal) || Number(params.limit) || PAGE_SIZE);
    const first = await fetchProducts({ ...params, page: 1, limit: pageLimit });
    const totalPages = Number(first?.pagination?.totalPages) || 1;

    if (totalPages <= 1) return first?.data ?? [];

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
            fetchProducts({ ...params, page: index + 2, limit: pageLimit })
        )
    );

    return [...(first?.data ?? []), ...rest.flatMap((response) => response?.data ?? [])];
};

const getResponseRows = (response) => (
    Array.isArray(response) ? response : response?.data ?? []
);

const fetchAllProductsForStatusTabs = async (params) => {
    const baseParams = {
        ...params,
        page: 1,
        limit: STATUS_FETCH_LIMIT,
        mappingStatus: undefined,
    };
    const first = await fetchProducts(baseParams);
    const rows = [...getResponseRows(first)];
    const totalPages = Number(first?.pagination?.totalPages) || 1;

    if (totalPages <= 1) return rows;

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
            fetchProducts({ ...baseParams, page: index + 2 })
        )
    );

    return rows.concat(...rest.map(getResponseRows));
};

const isMappedProduct = (product) => (
    !!product?.is_mapped ||
    !!product?.mapping_id ||
    !!product?.merchant_sku ||
    !!product?.merchantSku ||
    !!product?.mapped_merchant_sku
);

const filterProductByStatus = (product, status) => {
    if (status === 'all') return product;

    const shouldKeep = status === 'mapped' ? isMappedProduct : (item) => !isMappedProduct(item);
    const children = product.children ?? [];

    if (children.length > 0) {
        const filteredChildren = children.filter(shouldKeep);
        if (filteredChildren.length === 0) return null;

        return {
            ...product,
            children: filteredChildren,
            mapping_count: filteredChildren.filter(isMappedProduct).length,
        };
    }

    return shouldKeep(product) ? product : null;
};

const fetchCounts = (params) => {
    const qs = new URLSearchParams();
    if (params.platformStoreId) qs.set('platformStoreId', params.platformStoreId);
    if (params.platform)        qs.set('platform',        params.platform);
    return api.get(`/platform-products/counts?${qs.toString()}`).then((r) => r.data);
};

// POST /api/v1/platform-products/sync
// Now accepts { platform, platformStoreId } to sync specific platform/store
const syncProducts = (body) =>
    api.post('/platform-products/sync', {}, { params: body }).then((r) => r.data);

// POST /api/v1/platform-products/generate-sku
// Auto-creates merchant SKU from platform product (uses seller_sku as sku_name)
const generateSku = (body) =>
    api.post('/platform-products/generate-sku', body).then((r) => r.data);

// POST /api/v1/platform-products/auto-mapping
// Requires platform + platformStoreId now (mandatory in updated hook)
const autoMap = (body) =>
    api.post('/platform-products/auto-mapping', body).then((r) => r.data);

const unlinkMapping = (id) =>
    api.delete(`/platform-products/mapping/${id}`).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
export function useByProductMapping() {
    const queryClient = useQueryClient();

    // ── Filter state ──────────────────────────────────────────────────────────
    const [selectedPlatform, setSelectedPlatform] = useState('');
    const [selectedStoreId,  setSelectedStoreId]  = useState('');
    const [searchInput,      setSearchInput]       = useState('');
    const [searchApplied,    setSearchApplied]     = useState('');
    const [skuType,          setSkuType]           = useState('product_name');
    const [mappingStatus,    setMappingStatus]     = useState('all');
    const [page,             setPage]              = useState(1);

    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectionLoading, setSelectionLoading] = useState(false);
    const [expandedIds, setExpandedIds] = useState([]);

    // ── Sync modal state ──────────────────────────────────────────────────────
    const [showSyncResultModal, setShowSyncResultModal] = useState(false);
    const [syncResults,         setSyncResults]         = useState(null);

    // ── Generate Merchant SKU modal ───────────────────────────────────────────
    const [showGenModal,     setShowGenModal]     = useState(false);
    const [genWarehouseId,   setGenWarehouseId]   = useState('');
    const [genWarehouseName, setGenWarehouseName] = useState('');

    // ── Auto Mapping modal — now requires platform + store ────────────────────
    const [showAutoMapModal,    setShowAutoMapModal]    = useState(false);
    const [autoModalPlatform,   setAutoModalPlatform]   = useState('');
    const [autoModalStoreIds,   setAutoModalStoreIds]   = useState([]);
    const [autoWarehouseId,     setAutoWarehouseId]     = useState('');
    const [autoWarehouseName,   setAutoWarehouseName]   = useState('');
    const [autoMappingResult,   setAutoMappingResult]   = useState(null);  // ← shows result in modal

    // ── Unlink confirm ────────────────────────────────────────────────────────
    const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
    const [unlinkTarget,      setUnlinkTarget]      = useState(null);

    const listParams = {
        page,
        limit:          PAGE_SIZE,
        platformStoreId:selectedStoreId  || undefined,
        platform:       selectedPlatform || undefined,
        search:         searchApplied    || undefined,
        skuType:        skuType          || undefined,
        mappingStatus:  mappingStatus !== 'all' ? mappingStatus : undefined,
    };

    const countParams = {
        platformStoreId: selectedStoreId  || undefined,
        platform:        selectedPlatform || undefined,
    };

    const {
        data: listData, isLoading, isFetching, isError, error, refetch,
    } = useQuery({
        queryKey:        BY_PRODUCT_KEYS.list(listParams),
        queryFn:         () => fetchProducts(listParams),
        staleTime:       1000 * 60,
        placeholderData: (prev) => prev,
    });

    const statusParams = {
        ...listParams,
        page: 1,
        limit: STATUS_FETCH_LIMIT,
        mappingStatus: undefined,
    };

    const {
        data: statusRows = [],
        isFetching: isStatusFetching,
    } = useQuery({
        queryKey: BY_PRODUCT_KEYS.statusList(statusParams),
        queryFn: () => fetchAllProductsForStatusTabs(statusParams),
        enabled: mappingStatus !== 'all',
        staleTime: 1000 * 60,
        placeholderData: (prev) => prev,
    });

    const { data: counts = { all: 0, mapped: 0, unmapped: 0 } } = useQuery({
        queryKey:        BY_PRODUCT_KEYS.counts(countParams),
        queryFn:         () => fetchCounts(countParams),
        staleTime:       1000 * 30,
        placeholderData: { all: 0, mapped: 0, unmapped: 0 },
    });

    const totalForCurrentTab =
        mappingStatus === 'mapped' ? counts.mapped
        : mappingStatus === 'unmapped' ? counts.unmapped
        : counts.all;

    const filteredStatusRows = useMemo(() => {
        if (mappingStatus === 'all') return [];
        return (statusRows ?? [])
            .map((product) => filterProductByStatus(product, mappingStatus))
            .filter(Boolean);
    }, [statusRows, mappingStatus]);

    const products = useMemo(() => {
        if (mappingStatus === 'all') {
            return getResponseRows(listData);
        }

        const start = (page - 1) * PAGE_SIZE;
        return filteredStatusRows.slice(start, start + PAGE_SIZE);
    }, [listData, mappingStatus, filteredStatusRows, page]);

    const activeTotal = Number(totalForCurrentTab) || filteredStatusRows.length || products.length;
    const pagination = mappingStatus === 'all'
        ? (listData?.pagination ?? {
            total: activeTotal,
            totalPages: Math.max(1, Math.ceil(activeTotal / PAGE_SIZE)),
            page,
            limit: PAGE_SIZE,
        })
        : {
            total: activeTotal,
            totalPages: Math.max(1, Math.ceil(activeTotal / PAGE_SIZE)),
            page,
            limit: PAGE_SIZE,
        };

    // ── Mutations ─────────────────────────────────────────────────────────────

    const syncMutation = useMutation({
        mutationFn: (body) => syncProducts(body),
        onSuccess: (data) => {
            setSyncResults(data.results ?? []);
            setShowSyncResultModal(true);
            queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
        },
        onError: (err) => toast.error(err?.response?.data?.message ?? 'Sync failed'),
    });

    const generateMutation = useMutation({
        mutationFn: generateSku,
        onSuccess: (data) => {
            toast.success(data.message ?? 'Merchant SKU(s) generated');
            setShowGenModal(false);
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
        },
        onError: (err) => toast.error(err?.response?.data?.message ?? 'Generation failed'),
    });

    const autoMapMutation = useMutation({
        mutationFn: autoMap,
        onSuccess: (data) => {
            // Show result breakdown inside the modal instead of closing immediately
            setAutoMappingResult(data);
            queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
        },
        onError: (err) => toast.error(err?.response?.data?.message ?? 'Auto mapping failed'),
    });

    const unlinkMutation = useMutation({
        mutationFn: () => unlinkMapping(unlinkTarget?.mapping_id),
        onSuccess: () => {
            toast.success('Mapping removed');
            setShowUnlinkConfirm(false);
            setUnlinkTarget(null);
            queryClient.invalidateQueries({ queryKey: BY_PRODUCT_KEYS.all() });
        },
        onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to unlink'),
    });

    // ── Helpers ───────────────────────────────────────────────────────────────

    const toggleSelect = useCallback((id) => {
        setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    }, []);

    const getSelectableProductIds = useCallback(() => (
        products.flatMap((p) => p.row_type === 'parent' ? (p.children ?? []).map((c) => c.id) : [p.id])
    ), [products]);

    const getSelectableIdsFromRows = useCallback((rows) => (
        rows.flatMap((p) => p.row_type === 'parent' ? (p.children ?? []).map((c) => c.id) : [p.id])
    ), []);

    useEffect(() => {
        setSelectedProducts((prev) => {
            const rowByChildId = new Map();
            prev.forEach((product) => {
                const ids = product.row_type === 'parent' ? (product.children ?? []).map((child) => child.id) : [product.id];
                ids.forEach((id) => rowByChildId.set(id, product));
            });
            products.forEach((product) => {
                const ids = product.row_type === 'parent' ? (product.children ?? []).map((child) => child.id) : [product.id];
                if (ids.some((id) => selectedIds.includes(id))) {
                    ids.forEach((id) => rowByChildId.set(id, product));
                }
            });

            const next = [];
            const seenProducts = new Set();
            selectedIds.forEach((id) => {
                const product = rowByChildId.get(id);
                if (product && !seenProducts.has(product.id)) {
                    seenProducts.add(product.id);
                    next.push(product);
                }
            });
            return next;
        });
    }, [products, selectedIds]);

    const toggleAll = useCallback(async () => {
        setSelectionLoading(true);
        const pageIds = getSelectableProductIds();
        const allFilteredSelected =
            pagination.total > 0 &&
            selectedIds.length >= pagination.total &&
            pageIds.every((id) => selectedIds.includes(id));

        if (allFilteredSelected) {
            setSelectedIds([]);
            setSelectedProducts([]);
            setSelectionLoading(false);
            return;
        }

        try {
            const allProducts = await fetchAllProducts(listParams, pagination.total);
            const ids = getSelectableIdsFromRows(allProducts);
            setSelectedProducts(allProducts);
            setSelectedIds(ids);
        } catch (err) {
            toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to select all SKU mappings');
        } finally {
            setSelectionLoading(false);
        }
    }, [getSelectableProductIds, getSelectableIdsFromRows, selectedIds, pagination.total, listParams]);

    const toggleExpand = useCallback((id) => {
        setExpandedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    }, []);

    const handleSearch = useCallback(() => {
        setSearchApplied(searchInput.trim());
        setPage(1);
        setSelectedIds([]);
        setSelectedProducts([]);
    }, [searchInput]);

    const handleTabChange = useCallback((status) => {
        setMappingStatus(status);
        setPage(1);
        setSelectedIds([]);
        setSelectedProducts([]);
    }, []);

    const handlePlatformChange = useCallback((platform) => {
        setSelectedPlatform(platform);
        setSelectedStoreId('');
        setPage(1);
        setSelectedIds([]);
        setSelectedProducts([]);
    }, []);

    const handleStoreChange = useCallback((storeId) => {
        setSelectedStoreId(storeId);
        setPage(1);
        setSelectedIds([]);
        setSelectedProducts([]);
    }, []);

    // handleSyncClick now accepts platform/storeId from the sync modal
    const handleSyncClick = useCallback((platform, platformStoreId) => {
        syncMutation.mutate({
            platform:        platform        || undefined,
            platformStoreId: platformStoreId || undefined,
        });
    }, [syncMutation]);

    // handleGenerateClick: validation moved to page (page checks platform + selection)
    const handleGenerateClick = useCallback(() => {
        setGenWarehouseId('');
        setShowGenModal(true);
    }, []);

    const handleAutoMapClick = useCallback(() => {
        setAutoModalPlatform(selectedPlatform || '');
        setAutoModalStoreIds([]);
        setAutoWarehouseId('');
        setAutoMappingResult(null);
        setShowAutoMapModal(true);
    }, [selectedPlatform]);

    const confirmGenerateSku = useCallback(() => {
        if (!genWarehouseId) { toast.error('Select a warehouse'); return; }
        generateMutation.mutate({
            platformProductIds: selectedIds,
            warehouseId:        Number(genWarehouseId),
        });
    }, [selectedIds, genWarehouseId, generateMutation]);

    const confirmAutoMap = useCallback(() => {
        autoMapMutation.mutate({
            platformProductIds: selectedIds.length ? selectedIds : [],
            platformStoreIds:   autoModalStoreIds.map(Number),
            platform:           autoModalPlatform || undefined,
        });
    }, [selectedIds, autoModalPlatform, autoModalStoreIds, autoMapMutation]);

    const openUnlinkConfirm = useCallback((product) => {
        setUnlinkTarget(product);
        setShowUnlinkConfirm(true);
    }, []);

    return {
        // filter
        selectedPlatform, handlePlatformChange,
        selectedStoreId,  handleStoreChange,
        searchInput, setSearchInput, handleSearch,
        skuType, setSkuType,
        mappingStatus, handleTabChange,
        page, setPage,

        // data
        products, pagination,
        counts,
        isLoading, isFetching: isFetching || isStatusFetching, isError, error, refetch,

        // selection
        selectedIds, selectedProducts, selectionLoading, toggleSelect, toggleAll,
        allSelected:  getSelectableProductIds().length > 0 && getSelectableProductIds().every((id) => selectedIds.includes(id)),
        someSelected: getSelectableProductIds().some((id) => selectedIds.includes(id)),

        // expand/collapse
        expandedIds, toggleExpand,

        // sync
        showSyncResultModal, setShowSyncResultModal,
        syncResults,
        handleSyncClick,
        syncing: syncMutation.isPending,

        // generate SKU modal
        showGenModal, setShowGenModal,
        genWarehouseId, setGenWarehouseId,
        genWarehouseName, setGenWarehouseName,
        handleGenerateClick,
        confirmGenerateSku,
        generating: generateMutation.isPending,

        // auto map modal — platform + store required
        showAutoMapModal, setShowAutoMapModal,
        autoModalPlatform, setAutoModalPlatform,
        autoModalStoreIds, setAutoModalStoreIds,
        autoWarehouseId, setAutoWarehouseId,
        autoWarehouseName, setAutoWarehouseName,
        handleAutoMapClick,
        confirmAutoMap,
        autoMappingResult, setAutoMappingResult,
        autoMapping: autoMapMutation.isPending,

        // unlink
        showUnlinkConfirm, setShowUnlinkConfirm,
        unlinkTarget,
        openUnlinkConfirm,
        confirmUnlink: () => unlinkMutation.mutate(),
        unlinking: unlinkMutation.isPending,
    };
}
