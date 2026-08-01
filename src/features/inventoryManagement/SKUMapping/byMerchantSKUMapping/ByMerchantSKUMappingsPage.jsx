import { Fragment, useMemo, useState } from 'react';
import {
    Search,
    ChevronDown,
    Loader2,
    AlertCircle,
    Link2,
    Unlink,
    GitMerge,
    X,
    Plus,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import Topbar from '../../../../components/layout/Topbar';
import { useByMerchantMapping, BY_MERCHANT_KEYS } from '../hooks/useByMerchantMapping';
import { useSkuMappingDropdowns } from '../hooks/useSkuMappingDropdowns';
import MappingStatusBadge from '../components/MappingStatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { TableSkeleton, EmptyState } from '../components/TableHelpers';
import ListPageSizePagination from '../../../../components/shared/ListPageSizePagination';
import ExportMenu from '../../../../components/shared/ExportMenu';
import api from '../../../../lib/api';
import { exportRowsToCsv, exportRowsToXlsx, printRows } from '../../../../utils/tableOutput';

const TABS = [
    { label: 'All', value: 'all' },
    { label: 'Mapped', value: 'mapped' },
    { label: 'Unmapped', value: 'unmapped' },
];

const SEARCH_TYPE_OPTIONS = [
    { label: 'SKU Name', value: 'sku_name' },
    { label: 'Product Name', value: 'product_name' },
    { label: 'Product ID', value: 'platform_product_id' },
    { label: 'Store ID', value: 'platform_shop_id' },
];

const fetchSyncGroups = () => api.get('/sku-sync-groups').then((r) => r.data ?? []);
const fetchEligibleMembers = (primarySkuId) =>
    api.get(`/sku-sync-groups/eligible-secondaries?primarySkuId=${primarySkuId}`).then((r) => r.data ?? []);
const createStoreMappings = (body) => api.post('/sku-mapping/store-mapping', body).then((r) => r.data ?? r);
const fetchStoreProducts = ({ storeIds, platform, mappingStatus = 'all' }) => {
    const qs = new URLSearchParams();
    qs.set('limit', '200');
    qs.set('mappingStatus', mappingStatus);
    if (platform) qs.set('platform', platform);
    if (storeIds?.length) qs.set('platformStoreIds', storeIds.join(','));
    return api.get(`/sku-mapping/product-picker?${qs.toString()}`).then((r) => r.data ?? []);
};
const unlinkSingleMapping = (mappingId) => api.delete(`/sku-mapping/mapping/${mappingId}`).then((r) => r.data ?? r);
const linkGroupMembers = ({ primarySkuId, secondarySkuIds }) =>
    api.post(`/sku-sync-groups/primary/${primarySkuId}/members`, { secondarySkuIds }).then((r) => r.data ?? r);
const removeGroupMember = ({ groupId, memberSkuId }) =>
    api.delete(`/sku-sync-groups/${groupId}/members/${memberSkuId}`).then((r) => r.data ?? r);

export default function ByMerchantSKUMappingsPage() {
    const qc = useQueryClient();
    const { platforms, stores, getStoresForPlatform } = useSkuMappingDropdowns();

    const {
        searchInput, setSearchInput, handleSearch,
        skuType, setSkuType,
        mappingStatus, handleTabChange,
        page, setPage,
        pageSizeInput, setPageSizeInput, applyPageSize,
        merchantSkus, pagination,
        counts,
        isLoading, isFetching, isError, error, refetch,
        selectedIds, selectedMerchantSkus, selectionLoading, toggleSelect, toggleAll,
        allSelected, someSelected,
        expandedIds, toggleExpand,
    } = useByMerchantMapping();
    const selectedRows = selectedMerchantSkus.length === selectedIds.length
        ? selectedMerchantSkus
        : merchantSkus.filter((sku) => selectedIds.includes(sku.id));
    const outputColumns = [
        { label: 'Merchant SKU', key: 'sku_name' },
        { label: 'SKU Title', key: 'sku_title' },
        { label: 'Mapped', render: (row) => row.is_mapped ? 'Yes' : 'No' },
        { label: 'Mapped Products', render: (row) => row.mappings?.length ?? 0 },
        { label: 'Status', key: 'status' },
    ];

    const { data: syncGroups = [], isLoading: groupsLoading } = useQuery({
        queryKey: ['sku-sync-groups'],
        queryFn: fetchSyncGroups,
        staleTime: 1000 * 60 * 5,
    });


    const getPrimaryGroupForSku = (skuId) =>
        syncGroups.find((g) => g.primarySku?.id === skuId) ?? null;

    const getChildGroupCountForSku = (skuId) =>
        syncGroups.filter((g) => g.members?.some((m) => m.memberSku?.id === skuId)).length;

    const getChildGroupsForSku = (skuId) =>
        syncGroups.filter((g) => g.members?.some((m) => m.memberSku?.id === skuId));

    const [mappedInfoExpandedIds, setMappedInfoExpandedIds] = useState([]);
    const toggleMappedInfo = (skuId) => {
        setMappedInfoExpandedIds((prev) =>
            prev.includes(skuId) ? prev.filter((id) => id !== skuId) : [...prev, skuId]
        );
    };

    const tabsWithCount = TABS.map((tab) => ({
        ...tab,
        displayLabel: `${tab.label} (${tab.value === 'all' ? counts.all : tab.value === 'mapped' ? counts.mapped : counts.unmapped})`,
    }));
    const selectedSearchTypeLabel =
        SEARCH_TYPE_OPTIONS.find((option) => option.value === skuType)?.label ?? 'SKU Name';

    // Store mapping modal: opens from the mapping icon when a parent SKU is not mapped.
    const [showMapModal, setShowMapModal] = useState(false);
    const [mapTarget, setMapTarget] = useState(null);
    const [mapPlatform, setMapPlatform] = useState('');
    const [selectedStoreIds, setSelectedStoreIds] = useState([]);
    const [selectedMapProductIds, setSelectedMapProductIds] = useState([]);
    const [selectedMapChildSkuIds, setSelectedMapChildSkuIds] = useState([]);
    const [showMapChildren, setShowMapChildren] = useState(false);
    const [showMapProducts, setShowMapProducts] = useState(false);
    const [mapProductFilter, setMapProductFilter] = useState('all');

    const visibleStores = useMemo(
        () => (mapPlatform ? getStoresForPlatform(mapPlatform) : stores),
        [mapPlatform, getStoresForPlatform, stores]
    );

    const { data: mapEligibleChildren = [], isLoading: mapChildrenLoading } = useQuery({
        queryKey: ['sku-sync-groups', 'eligible', 'map-modal', mapTarget?.id],
        queryFn: () => fetchEligibleMembers(mapTarget.id),
        enabled: showMapModal && !!mapTarget?.id,
        staleTime: 1000 * 30,
    });

    const { data: mapStoreProducts = [], isLoading: mapProductsLoading } = useQuery({
        queryKey: ['sku-mapping', 'store-products', mapPlatform, selectedStoreIds, mapProductFilter],
        queryFn: () => fetchStoreProducts({ storeIds: selectedStoreIds.map(Number), platform: mapPlatform || undefined, mappingStatus: mapProductFilter }),
        enabled: showMapModal && selectedStoreIds.length > 0,
        staleTime: 1000 * 30,
    });

    const mapMutation = useMutation({
        mutationFn: createStoreMappings,
        onSuccess: (data) => {
            toast.success(data?.message ?? 'Store mapping saved');
            setShowMapModal(false);
            setMapTarget(null);
            setSelectedStoreIds([]);
            setSelectedMapProductIds([]);
            setSelectedMapChildSkuIds([]);
            qc.invalidateQueries({ queryKey: BY_MERCHANT_KEYS.all() });
            qc.invalidateQueries({ queryKey: ['by-product'] });
        },
        onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to save store mapping'),
    });

    const openMapModal = (sku) => {
        const mappedStoreIds = [...new Set((sku.mappings ?? []).map((m) => String(m.platform_store_id)).filter(Boolean))];
        setMapTarget(sku);
        setMapPlatform('');
        setSelectedStoreIds(mappedStoreIds);
        setSelectedMapProductIds([]);
        setSelectedMapChildSkuIds([]);
        setMapProductFilter('all');
        setShowMapChildren(false);
        setShowMapProducts(!!sku.is_mapped);
        setShowMapModal(true);
    };

    const toggleStore = (storeId) => {
        setSelectedStoreIds((prev) =>
            prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
        );
        setSelectedMapProductIds([]);
    };

    const toggleMapProduct = (productId) => {
        setSelectedMapProductIds((prev) =>
            prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
        );
    };

    const toggleMapChildSku = (skuId) => {
        setSelectedMapChildSkuIds((prev) =>
            prev.includes(skuId) ? prev.filter((id) => id !== skuId) : [...prev, skuId]
        );
    };

    const isProductAlreadyMappedToTarget = (product) =>
        !!product.mapped_merchant_sku && Number(product.mapped_merchant_sku.id) === Number(mapTarget?.id);

    const toggleAllMapProducts = () => {
        const ids = mapStoreProducts.filter((p) => !isProductAlreadyMappedToTarget(p)).map((p) => p.id);
        const all = ids.length > 0 && ids.every((id) => selectedMapProductIds.includes(id));
        setSelectedMapProductIds(all ? [] : ids);
    };

    const toggleVisibleStores = () => {
        const ids = visibleStores.map((s) => String(s.value));
        const allVisibleSelected = ids.length > 0 && ids.every((id) => selectedStoreIds.includes(id));
        setSelectedStoreIds((prev) => {
            if (allVisibleSelected) return prev.filter((id) => !ids.includes(id));
            return [...new Set([...prev, ...ids])];
        });
    };

    const confirmStoreMapping = () => {
        if (!mapTarget) return;
        if (!selectedStoreIds.length) {
            toast.error('Select at least one store');
            return;
        }
        mapMutation.mutate({
            merchantSkuId: mapTarget.id,
            platformStoreIds: selectedStoreIds.map(Number),
            platformProductIds: selectedMapProductIds.map(Number),
            childMerchantSkuIds: selectedMapChildSkuIds.map(Number),
        });
    };

    // Unlink modal: opens from the same mapping icon when parent SKU is already mapped.
    const [showUnlinkModal, setShowUnlinkModal] = useState(false);
    const [unlinkTarget, setUnlinkTarget] = useState(null);
    const [unlinkMappingIds, setUnlinkMappingIds] = useState([]);

    const unlinkMutation = useMutation({
        mutationFn: async (mappingIds) => {
            for (const id of mappingIds) await unlinkSingleMapping(id);
            return mappingIds.length;
        },
        onSuccess: (count) => {
            toast.success(`${count} store mapping(s) removed`);
            setShowUnlinkModal(false);
            setUnlinkTarget(null);
            setUnlinkMappingIds([]);
            qc.invalidateQueries({ queryKey: BY_MERCHANT_KEYS.all() });
            qc.invalidateQueries({ queryKey: ['by-product'] });
        },
        onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to unlink mapping'),
    });

    const openUnlinkModal = (sku) => {
        const mappings = sku.mappings ?? [];
        setUnlinkTarget(sku);
        setUnlinkMappingIds(mappings.length === 1 ? [mappings[0].id] : []);
        setShowUnlinkModal(true);
    };

    const toggleUnlinkMapping = (mappingId) => {
        setUnlinkMappingIds((prev) =>
            prev.includes(mappingId) ? prev.filter((id) => id !== mappingId) : [...prev, mappingId]
        );
    };

    const unlinkStoreGroups = useMemo(
        () => getUnlinkStoreGroups(unlinkTarget?.mappings ?? []),
        [unlinkTarget]
    );

    const toggleUnlinkStoreGroup = (mappingIds) => {
        setUnlinkMappingIds((prev) => {
            const allSelected = mappingIds.length > 0 && mappingIds.every((id) => prev.includes(id));
            if (allSelected) return prev.filter((id) => !mappingIds.includes(id));
            return [...new Set([...prev, ...mappingIds])];
        });
    };

    const confirmUnlinkMappings = () => {
        if (!unlinkMappingIds.length) {
            toast.error('Select at least one mapped store to unlink');
            return;
        }
        unlinkMutation.mutate(unlinkMappingIds);
    };

    const handleMappingIconClick = (sku) => {
        openMapModal(sku);
    };

    // Group sync modal: only parent/mapped SKUs can add same-warehouse child SKUs.
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupTarget, setGroupTarget] = useState(null);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberSelectedIds, setMemberSelectedIds] = useState([]);

    const { data: eligibleMembers = [], isLoading: eligibleLoading } = useQuery({
        queryKey: ['sku-sync-groups', 'eligible', groupTarget?.id],
        queryFn: () => fetchEligibleMembers(groupTarget.id),
        enabled: showGroupModal && !!groupTarget?.id,
        staleTime: 1000 * 30,
    });

    const linkMembersMutation = useMutation({
        mutationFn: linkGroupMembers,
        onSuccess: (data) => {
            toast.success(data?.message ?? 'SKU(s) linked to parent');
            setShowGroupModal(false);
            setGroupTarget(null);
            setMemberSelectedIds([]);
            qc.invalidateQueries({ queryKey: ['sku-sync-groups'] });
            qc.invalidateQueries({ queryKey: BY_MERCHANT_KEYS.all() });
        },
        onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to link SKU(s)'),
    });

    const removeMemberMutation = useMutation({
        mutationFn: removeGroupMember,
        onSuccess: () => {
            toast.success('Child SKU removed from group');
            qc.invalidateQueries({ queryKey: ['sku-sync-groups'] });
            qc.invalidateQueries({ queryKey: BY_MERCHANT_KEYS.all() });
        },
        onError: (err) => toast.error(err?.response?.data?.message ?? 'Failed to remove child SKU'),
    });

    const openGroupModal = (sku) => {
        if (!sku.is_mapped) {
            toast.error('Map this parent SKU to at least one store before adding group SKUs');
            return;
        }
        setGroupTarget(sku);
        setMemberSearch('');
        setMemberSelectedIds([]);
        setShowGroupModal(true);
    };

    const toggleMember = (skuId) => {
        setMemberSelectedIds((prev) =>
            prev.includes(skuId) ? prev.filter((id) => id !== skuId) : [...prev, skuId]
        );
    };

    const confirmGroupSync = () => {
        if (!groupTarget) return;
        if (!memberSelectedIds.length) {
            toast.error('Select at least one child SKU');
            return;
        }
        linkMembersMutation.mutate({ primarySkuId: groupTarget.id, secondarySkuIds: memberSelectedIds });
    };

    const filteredEligible = eligibleMembers.filter((sku) => {
        const q = memberSearch.trim().toLowerCase();
        if (!q) return true;
        return sku.sku_name?.toLowerCase().includes(q) || sku.sku_title?.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-4 font-body">
            <Topbar PageTitle="SKU Mapping" />

            <div className="bg-white rounded-xl border border-surface-border px-7 py-5 flex items-center gap-3">
                <div className="relative">
                    <select
                        value={skuType}
                        onChange={(e) => {
                            setSkuType(e.target.value);
                            setPage(1);
                        }}
                        className="appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer w-36"
                    >
                        {SEARCH_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder={`Search by ${selectedSearchTypeLabel}`}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                    {isFetching && !isLoading && (
                        <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
                    )}
                </div>

                <button onClick={handleSearch} className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
                    Search
                </button>
            </div>

            <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
                <div className="px-5 pt-5 pb-0">
                    <h2 className="text-base font-bold text-slate-800 font-display mb-4">SKU Mapping by Merchant SKU</h2>
                    <div className="flex items-center gap-5 border-b border-surface-border">
                        {tabsWithCount.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => handleTabChange(tab.value)}
                                className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                                    mappingStatus === tab.value
                                        ? 'text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {tab.displayLabel}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <TableSkeleton cols={7} rows={5} />
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <AlertCircle size={36} className="text-red-400 opacity-70" />
                            <p className="text-sm font-medium text-slate-700">{error?.response?.data?.message ?? 'Failed to load merchant SKUs'}</p>
                            <button onClick={() => {
                                setPage(1);
                                refetch?.();
                            }} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
                                <RefreshCw size={12} /> Retry
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-sm font-body">
                            <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                                <tr className="border-b border-surface-border">
                                    <th className="py-3 pl-5 w-28 text-left">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            {selectionLoading ? (
                                                <Loader2 size={16} className="text-primary animate-spin" />
                                            ) : (
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                                    onChange={toggleAll}
                                                    className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                                                />
                                            )}
                                            <span className="text-sm font-bold text-slate-800">Select All</span>
                                        </label>
                                    </th>
                                    {['Image', 'Parent Merchant SKU', 'Mapped Stores', 'Status', 'Sync Group', 'Action'].map((h) => (
                                        <th key={h} className="py-3 pr-4 text-left text-sm font-bold text-slate-800">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {merchantSkus.length === 0 ? (
                                    <EmptyState message="No parent merchant SKUs found" colSpan={7} />
                                ) : (
                                    merchantSkus.map((sku) => {
                                        const isSelected = selectedIds.includes(sku.id);
                                        const isExpanded = expandedIds.includes(sku.id);
                                        const skuGroup = getPrimaryGroupForSku(sku.id);
                                        const childGroupCount = getChildGroupCountForSku(sku.id);
                                        const childCount = (skuGroup?.members ?? []).length;
                                        const childGroups = getChildGroupsForSku(sku.id);
                                        const groupPanelGroups = [skuGroup, ...childGroups].filter(Boolean).filter((g, idx, arr) => arr.findIndex((x) => x.id === g.id) === idx);
                                        const isMappedInfoExpanded = mappedInfoExpandedIds.includes(sku.id);

                                        return (
                                            <Fragment key={sku.id}>
                                                <tr className={`transition-colors hover:bg-surface/50 ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                                    <td className="pl-5 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSelect(sku.id)}
                                                            className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <img
                                                            src={sku.image_url || 'https://placehold.co/36x36/E6ECF0/004368?text=?'}
                                                            alt={sku.sku_name}
                                                            className="w-9 h-9 rounded-lg object-cover"
                                                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/36x36/E6ECF0/004368?text=?'; }}
                                                        />
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <p className="text-sm font-semibold text-slate-800 font-mono">{sku.sku_name}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[190px]" title={sku.sku_title}>{sku.sku_title}</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">{sku.warehouse_name ?? `Warehouse #${sku.warehouse_id ?? '—'}`}</p>
                                                    </td>
                                                    <td className="py-3 pr-4 text-xs text-slate-600">
                                                        {sku.is_mapped ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleMappedInfo(sku.id)}
                                                                className="inline-flex items-center gap-1.5 text-left hover:text-primary transition-colors"
                                                                title="Show mapped store and platform product list"
                                                            >
                                                                <span>
                                                                    {sku.mapped_store_sku?.split(' — ')?.[0] || 'Mapped'}
                                                                    {sku.mapping_count > 1 && <span className="ml-1 text-primary font-semibold">+{sku.mapping_count - 1}</span>}
                                                                </span>
                                                                <ChevronDown size={13} className={`transition-transform ${mappedInfoExpandedIds.includes(sku.id) ? 'rotate-180' : ''}`} />
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-300">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <MappingStatusBadge isMapped={sku.is_mapped} />
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        {skuGroup ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleExpand(sku.id)}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 transition-colors"
                                                                title="Show group sync merchant SKU list"
                                                            >
                                                                <GitMerge size={10} /> Parent ({childCount})
                                                                <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </button>
                                                        ) : childGroupCount > 0 ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleExpand(sku.id)}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors"
                                                                title="Show parent groups for this child SKU"
                                                            >
                                                                <GitMerge size={10} /> Child in {childGroupCount}
                                                                <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </button>
                                                        ) : groupsLoading ? (
                                                            <span className="text-xs text-slate-300">Loading...</span>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 pr-5">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => handleMappingIconClick(sku)}
                                                                title={sku.is_mapped ? 'View/change mapped platform SKU list' : 'Map to platform/store SKU'}
                                                                className={`p-1.5 rounded-lg transition-colors ${
                                                                    sku.is_mapped
                                                                        ? 'text-primary hover:bg-blue-50'
                                                                        : 'text-slate-300 hover:text-primary hover:bg-blue-50'
                                                                }`}
                                                            >
                                                                <Link2 size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => sku.is_mapped && openUnlinkModal(sku)}
                                                                title={sku.is_mapped ? 'Unlink mapped product SKU(s)' : 'No mapping to unlink'}
                                                                className={`p-1.5 rounded-lg transition-colors ${
                                                                    sku.is_mapped
                                                                        ? 'text-red-500 hover:bg-red-50'
                                                                        : 'text-slate-300 cursor-not-allowed'
                                                                }`}
                                                            >
                                                                <Unlink size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => openGroupModal(sku)}
                                                                title={sku.is_mapped ? 'Group sync child SKUs' : 'Map this parent SKU first'}
                                                                className={`p-1.5 rounded-lg transition-colors ${
                                                                    sku.is_mapped
                                                                        ? 'text-violet-600 hover:bg-violet-50'
                                                                        : 'text-slate-300 cursor-not-allowed'
                                                                }`}
                                                            >
                                                                <GitMerge size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {isMappedInfoExpanded && sku.is_mapped && (
                                                    <tr className="bg-blue-50/20">
                                                        <td colSpan={7} className="px-10 py-4">
                                                            <MappedProductsPanel mappings={sku.mappings ?? []} />
                                                        </td>
                                                    </tr>
                                                )}

                                                {isExpanded && groupPanelGroups.length > 0 && (
                                                    <tr className="bg-surface/40">
                                                        <td colSpan={7} className="px-10 py-4">
                                                            <GroupSyncPanel
                                                                groups={groupPanelGroups}
                                                                currentSkuId={sku.id}
                                                                onAdd={() => openGroupModal(sku)}
                                                                onRemove={(groupId, memberSkuId) => removeMemberMutation.mutate({ groupId, memberSkuId })}
                                                                removing={removeMemberMutation.isPending}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <ListPageSizePagination
                    page={page}
                    limit={pagination.limit || 10}
                    total={pagination.total || 0}
                    itemLabel="SKUs"
                    pageSizeInput={pageSizeInput}
                    onPageChange={setPage}
                    onPageSizeInputChange={setPageSizeInput}
                    onApplyPageSize={applyPageSize}
                    loading={isFetching}
                />
                <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
                    <ExportMenu
                        onExportCsv={() => exportRowsToCsv(selectedRows, outputColumns, 'sku-mapping-by-merchant.csv', 'SKU mapping')}
                        onExportXlsx={() => exportRowsToXlsx(selectedRows, outputColumns, 'sku-mapping-by-merchant.xlsx', 'SKU mapping')}
                    />
                    <button onClick={() => printRows(selectedRows, outputColumns, 'SKU Mapping By Merchant', 'SKU mapping')} className="px-16 py-2.5 text-base font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">Print</button>
                </div>
            </div>

            {showMapModal && mapTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(180,195,210,0.5)', backdropFilter: 'blur(3px)' }} onClick={(e) => e.target === e.currentTarget && !mapMutation.isPending && setShowMapModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden" style={{ maxWidth: '620px', animation: 'popIn 0.18s ease both' }}>
                        <div className="px-8 py-5 border-b border-surface-border flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-800 font-display">{mapTarget.is_mapped ? 'View / Change Platform SKU Mapping' : 'Map Parent SKU to Store'}</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Parent SKU: <span className="font-semibold text-primary">{mapTarget.sku_name}</span></p>
                            </div>
                            <button onClick={() => !mapMutation.isPending && setShowMapModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                        </div>

                        <div className="px-8 py-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-1.5">Shop Platform</p>
                                    <div className="relative">
                                        <select
                                            value={mapPlatform}
                                            onChange={(e) => { setMapPlatform(e.target.value); setSelectedStoreIds([]); setSelectedMapProductIds([]); }}
                                            className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary"
                                        >
                                            <option value="">All Platforms</option>
                                            {platforms.map((p) => (
                                                <option key={p.value} value={p.value}>{p.label.charAt(0).toUpperCase() + p.label.slice(1)}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="button"
                                        onClick={toggleVisibleStores}
                                        disabled={visibleStores.length === 0}
                                        className="w-full px-3 py-2 text-sm font-semibold border border-primary/30 rounded-lg text-primary bg-white hover:bg-blue-50 disabled:opacity-50"
                                    >
                                        Select / Unselect All Stores
                                    </button>
                                </div>
                            </div>

                            <div className="border border-surface-border rounded-xl overflow-hidden" style={{ maxHeight: 280, overflowY: 'auto' }}>
                                {visibleStores.length === 0 ? (
                                    <div className="h-24 flex items-center justify-center text-sm text-slate-400">No active stores found</div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-white border-b border-surface-border [&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                                            <tr>
                                                <th className="py-2.5 pl-4 text-left text-xs font-semibold text-slate-600 w-10">Select</th>
                                                <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-600">Platform</th>
                                                <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-600">Store</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-border">
                                            {visibleStores.map((store) => {
                                                const checked = selectedStoreIds.includes(String(store.value));
                                                return (
                                                    <tr key={store.value} onClick={() => toggleStore(String(store.value))} className={`cursor-pointer hover:bg-surface/50 ${checked ? 'bg-blue-50/50' : ''}`}>
                                                        <td className="py-2.5 pl-4">
                                                            <input type="checkbox" checked={checked} onClick={(e) => e.stopPropagation()} onChange={() => toggleStore(String(store.value))} className="accent-primary cursor-pointer" />
                                                        </td>
                                                        <td className="py-2.5 px-3 text-xs font-semibold capitalize text-slate-600">{store.platform ?? mapPlatform ?? '—'}</td>
                                                        <td className="py-2.5 px-3 text-xs text-slate-700">{store.label}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="border border-surface-border rounded-xl overflow-hidden">
                                    <button type="button" onClick={() => setShowMapChildren((v) => !v)} className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-semibold text-slate-700 bg-surface-card hover:bg-slate-50">
                                        <span>Child Merchant SKU {selectedMapChildSkuIds.length ? `(${selectedMapChildSkuIds.length} selected)` : ''}</span>
                                        <ChevronDown size={14} className={`transition-transform ${showMapChildren ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showMapChildren && (
                                        <div className="max-h-44 overflow-y-auto divide-y divide-surface-border bg-white">
                                            {mapChildrenLoading ? (
                                                <div className="py-4 text-center text-xs text-slate-400">Loading child SKUs...</div>
                                            ) : mapEligibleChildren.length === 0 ? (
                                                <div className="py-4 text-center text-xs text-slate-400">No same-warehouse child SKU found</div>
                                            ) : mapEligibleChildren.map((sku) => (
                                                <label key={sku.id} className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-surface/50">
                                                    <input type="checkbox" checked={selectedMapChildSkuIds.includes(sku.id)} onChange={() => toggleMapChildSku(sku.id)} className="accent-violet-600" />
                                                    <img src={sku.image_url || 'https://placehold.co/28x28/E6ECF0/004368?text=?'} className="w-7 h-7 rounded-lg object-cover" alt="" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-slate-800 font-mono">{sku.sku_name}</p>
                                                        <p className="text-xs text-slate-400 truncate">{sku.sku_title}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border border-surface-border rounded-xl overflow-hidden">
                                    <button type="button" onClick={() => setShowMapProducts((v) => !v)} className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-semibold text-slate-700 bg-surface-card hover:bg-slate-50">
                                        <span>Platform Store Product {selectedMapProductIds.length ? `(${selectedMapProductIds.length} selected)` : ''}</span>
                                        <ChevronDown size={14} className={`transition-transform ${showMapProducts ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showMapProducts && (
                                        <div className="bg-white">
                                            <div className="px-4 py-2 border-b border-surface-border flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs text-slate-500">All mapped and not-mapped platform SKU rows for selected store(s). Select not-mapped rows or rows mapped to another Merchant SKU to map/change to this Merchant SKU.</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <select
                                                        value={mapProductFilter}
                                                        onChange={(e) => { setMapProductFilter(e.target.value); setSelectedMapProductIds([]); }}
                                                        className="appearance-none px-2 py-1.5 text-xs border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary"
                                                    >
                                                        <option value="all">All</option>
                                                        <option value="not_mapped">Not Mapped</option>
                                                        <option value="mapped">Mapped</option>
                                                    </select>
                                                    <button type="button" onClick={toggleAllMapProducts} disabled={!mapStoreProducts.length} className="text-xs font-semibold text-primary disabled:text-slate-300">Select All</button>
                                                </div>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto divide-y divide-surface-border">
                                                {selectedStoreIds.length === 0 ? (
                                                    <div className="py-5 text-center text-xs text-slate-400">Select store first</div>
                                                ) : mapProductsLoading ? (
                                                    <div className="py-5 text-center text-xs text-slate-400">Loading store products...</div>
                                                ) : mapStoreProducts.length === 0 ? (
                                                    <div className="py-5 text-center text-xs text-slate-400">No product SKU found in selected store(s)</div>
                                                ) : mapStoreProducts.map((p) => {
                                                    const mappedToTarget = isProductAlreadyMappedToTarget(p);
                                                    const mappedToOther = !!p.mapped_merchant_sku && !mappedToTarget;
                                                    const selectable = !mappedToTarget;
                                                    const checked = mappedToTarget || selectedMapProductIds.includes(p.id);
                                                    return (
                                                        <label key={p.id} className={`flex items-center gap-3 px-4 py-2 hover:bg-surface/50 ${selectable ? 'cursor-pointer' : 'cursor-default bg-emerald-50/40'}`}>
                                                            <input type="checkbox" disabled={!selectable} checked={checked} onChange={() => selectable && toggleMapProduct(p.id)} className="accent-primary disabled:opacity-50" />
                                                            <img src={p.image_url || 'https://placehold.co/28x28/E6ECF0/004368?text=?'} className="w-7 h-7 rounded-lg object-cover" alt="" />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-semibold text-slate-800 truncate">{p.product_name}</p>
                                                                <p className="text-[11px] text-slate-400 truncate">{p.store_name} • {p.variation_name || 'Variant'} • Seller SKU: {p.seller_sku || '—'}</p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-[11px] text-slate-400 font-mono">{p.platform_sku_id || p.platform_product_id}</p>
                                                                {mappedToTarget ? (
                                                                    <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">Already mapped</span>
                                                                ) : mappedToOther ? (
                                                                    <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">Mapped: {p.mapped_merchant_sku?.sku_name}</span>
                                                                ) : (
                                                                    <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">Not mapped</span>
                                                                )}
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-slate-500">
                                Selected stores/products are saved under this Merchant SKU. Already mapped rows show their current Merchant SKU. Selecting a row mapped to another SKU will change that platform SKU mapping to this Merchant SKU.
                            </p>
                        </div>

                        <div className="flex gap-3 px-8 py-5 border-t border-surface-border">
                            <button onClick={() => setShowMapModal(false)} disabled={mapMutation.isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card disabled:opacity-50">Cancel</button>
                            <button onClick={confirmStoreMapping} disabled={mapMutation.isPending || selectedStoreIds.length === 0} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2">
                                {mapMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {mapMutation.isPending ? 'Saving...' : 'Save Mapping'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUnlinkModal && unlinkTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(180,195,210,0.5)', backdropFilter: 'blur(3px)' }} onClick={(e) => e.target === e.currentTarget && !unlinkMutation.isPending && setShowUnlinkModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden" style={{ maxWidth: '560px', animation: 'popIn 0.18s ease both' }}>
                        <div className="px-8 py-5 border-b border-surface-border flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-800 font-display">Unlink Store Mapping</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Parent SKU: <span className="font-semibold text-primary">{unlinkTarget.sku_name}</span></p>
                            </div>
                            <button onClick={() => !unlinkMutation.isPending && setShowUnlinkModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                        </div>

                        <div className="px-8 py-5">
                            <p className="text-xs text-slate-500 mb-3">
                                Select a whole store to unlink all mapped product SKUs for that store, or select individual product SKU rows.
                            </p>
                            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                {unlinkStoreGroups.map((group) => {
                                    const groupIds = group.mappings.map((m) => m.id);
                                    const groupSelected = groupIds.length > 0 && groupIds.every((id) => unlinkMappingIds.includes(id));
                                    const groupPartial = groupIds.some((id) => unlinkMappingIds.includes(id)) && !groupSelected;
                                    return (
                                        <div key={group.key} className="border border-surface-border rounded-xl overflow-hidden bg-white">
                                            <div
                                                onClick={() => toggleUnlinkStoreGroup(groupIds)}
                                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-surface-border ${groupSelected || groupPartial ? 'bg-red-50/60' : 'bg-surface-card'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={groupSelected}
                                                    ref={(el) => { if (el) el.indeterminate = groupPartial; }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={() => toggleUnlinkStoreGroup(groupIds)}
                                                    className="accent-red-500 cursor-pointer"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{group.storeName}</p>
                                                    <p className="text-xs text-slate-400 capitalize">{group.platform} · {group.mappings.length} mapped product SKU{group.mappings.length !== 1 ? 's' : ''}</p>
                                                </div>
                                                <span className="text-xs font-semibold text-red-500 whitespace-nowrap">
                                                    Select store
                                                </span>
                                            </div>
                                            <table className="w-full text-sm">
                                                <thead className="bg-white border-b border-surface-border [&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                                                    <tr>
                                                        <th className="py-2.5 pl-4 text-left text-xs font-semibold text-slate-600 w-10">Select</th>
                                                        <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-600">Product SKU</th>
                                                        <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-600">Product</th>
                                                        <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-600">Product ID</th>
                                                        <th className="py-2.5 px-3 text-left text-xs font-semibold text-slate-600">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-surface-border">
                                                    {group.mappings.map((mapping) => {
                                                        const checked = unlinkMappingIds.includes(mapping.id);
                                                        return (
                                                            <tr key={mapping.id} onClick={() => toggleUnlinkMapping(mapping.id)} className={`cursor-pointer hover:bg-surface/50 ${checked ? 'bg-red-50/50' : ''}`}>
                                                                <td className="py-2.5 pl-4">
                                                                    <input type="checkbox" checked={checked} onClick={(e) => e.stopPropagation()} onChange={() => toggleUnlinkMapping(mapping.id)} className="accent-red-500 cursor-pointer" />
                                                                </td>
                                                                <td className="py-2.5 px-3 font-mono text-xs font-semibold text-primary">{mapping.seller_sku || mapping.platform_sku_id || 'Store pending'}</td>
                                                                <td className="py-2.5 px-3 text-xs text-slate-700 max-w-[210px]">
                                                                    <div className="font-semibold truncate" title={mapping.product_name}>{mapping.product_name || 'Pending platform product'}</div>
                                                                    <div className="text-[11px] text-slate-400 truncate">{mapping.variation_name || '—'}</div>
                                                                </td>
                                                                <td className="py-2.5 px-3 font-mono text-xs text-slate-600">
                                                                    <div>{mapping.platform_product_id || mapping.platform_listing_id || '—'}</div>
                                                                    {mapping.platform_model_id && <div className="text-[10px] text-slate-400">Model: {mapping.platform_model_id}</div>}
                                                                </td>
                                                                <td className="py-2.5 px-3"><SyncBadge status={mapping.sync_status} /></td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-3 px-8 py-5 border-t border-surface-border">
                            <button onClick={() => setShowUnlinkModal(false)} disabled={unlinkMutation.isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card disabled:opacity-50">Cancel</button>
                            <button onClick={confirmUnlinkMappings} disabled={unlinkMutation.isPending || unlinkMappingIds.length === 0} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white disabled:opacity-60 flex items-center justify-center gap-2">
                                {unlinkMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {unlinkMutation.isPending ? 'Unlinking...' : `Unlink ${unlinkMappingIds.length || ''} Mapping(s)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showGroupModal && groupTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(180,195,210,0.5)', backdropFilter: 'blur(3px)' }} onClick={(e) => e.target === e.currentTarget && !linkMembersMutation.isPending && setShowGroupModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden" style={{ maxWidth: '620px', animation: 'popIn 0.18s ease both' }}>
                        <div className="px-8 py-5 border-b border-surface-border flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-800 font-display">Group Sync Child SKUs</h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Parent SKU: <span className="font-semibold text-violet-600">{groupTarget.sku_name}</span>
                                    {' · '}Warehouse: <span className="font-semibold text-slate-700">{groupTarget.warehouse_name ?? `#${groupTarget.warehouse_id ?? '—'}`}</span>
                                </p>
                            </div>
                            <button onClick={() => !linkMembersMutation.isPending && setShowGroupModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                        </div>

                        <div className="px-8 py-4">
                            <div className="bg-blue-100 border-violet-200 rounded-xl px-4 py-3 mb-4">
                                <p className="text-xs text-primary">Same-warehouse merchant SKUs are shown. A SKU can be child in multiple groups and can also be another parent SKU.</p>
                            </div>

                            <div className="relative mb-3">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search child SKU by name..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 text-sm border border-surface-border rounded-lg outline-none focus:border-primary"
                                />
                            </div>

                            <div className="border border-surface-border rounded-xl overflow-hidden" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {eligibleLoading ? (
                                    <div className="flex items-center justify-center h-20 gap-2 text-xs text-slate-400"><Loader2 size={14} className="animate-spin text-primary" /> Loading eligible SKUs...</div>
                                ) : filteredEligible.length === 0 ? (
                                    <div className="flex items-center justify-center h-20 text-sm text-slate-400">No eligible same-warehouse SKUs found</div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y divide-surface-border">
                                            {filteredEligible.map((sku) => {
                                                const checked = memberSelectedIds.includes(sku.id);
                                                return (
                                                    <tr key={sku.id} onClick={() => toggleMember(sku.id)} className={`cursor-pointer hover:bg-surface/50 transition-colors ${checked ? 'bg-violet-50/60' : ''}`}>
                                                        <td className="py-2.5 pl-4 w-8">
                                                            <input type="checkbox" checked={checked} onClick={(e) => e.stopPropagation()} onChange={() => toggleMember(sku.id)} className="accent-violet-600 cursor-pointer" />
                                                        </td>
                                                        <td className="py-2.5 pl-3 w-12">
                                                            <img src={sku.image_url || 'https://placehold.co/28x28/E6ECF0/004368?text=?'} alt="" className="w-7 h-7 rounded-lg object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/28x28/E6ECF0/004368?text=?'; }} />
                                                        </td>
                                                        <td className="py-2.5 px-3">
                                                            <p className="text-xs font-semibold text-slate-800 font-mono">{sku.sku_name}</p>
                                                            <p className="text-xs text-slate-400 truncate max-w-[260px]">{sku.sku_title}</p>
                                                        </td>
                                                        <td className="py-2.5 pr-4 text-xs text-slate-500">WH #{sku.warehouse_id ?? '—'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {memberSelectedIds.length > 0 && <p className="text-xs text-violet-600 font-semibold mt-2">{memberSelectedIds.length} SKU(s) selected</p>}
                        </div>

                        <div className="flex gap-3 px-8 py-5 border-t border-surface-border">
                            <button onClick={() => setShowGroupModal(false)} disabled={linkMembersMutation.isPending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card disabled:opacity-50">Cancel</button>
                            <button onClick={confirmGroupSync} disabled={linkMembersMutation.isPending || memberSelectedIds.length === 0} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2">
                                {linkMembersMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {linkMembersMutation.isPending ? 'Linking...' : `Link ${memberSelectedIds.length || ''} SKU(s)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.97) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
    );
}


function getUnlinkStoreGroups(mappings = []) {
    const groups = new Map();
    mappings.forEach((mapping) => {
        const key = `${mapping.platform_store_id ?? 'store'}|${mapping.platform ?? ''}|${mapping.store_name ?? ''}`;
        if (!groups.has(key)) {
            groups.set(key, {
                key,
                platform: mapping.platform ?? '—',
                storeName: mapping.store_name ?? 'Unknown Store',
                platformStoreId: mapping.platform_store_id,
                mappings: [],
            });
        }
        groups.get(key).mappings.push(mapping);
    });
    return [...groups.values()].sort((a, b) => String(a.storeName).localeCompare(String(b.storeName)));
}

function MappedProductsPanel({ mappings }) {
    return (
        <div className="rounded-xl border border-surface-border overflow-hidden bg-white">
            <div className="px-4 py-3 border-b border-surface-border">
                <h3 className="text-sm font-bold text-slate-800 font-display">Mapped Store & Platform Product List</h3>
                <p className="text-xs text-slate-400">This merchant SKU is mapped with these store/product SKU rows.</p>
            </div>
            {mappings.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No mapped product found</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-surface-card border-b border-surface-border [&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                            <tr>
                                <th className="py-2 px-3 text-left font-semibold text-slate-500">Platform</th>
                                <th className="py-2 px-3 text-left font-semibold text-slate-500">Store</th>
                                <th className="py-2 px-3 text-left font-semibold text-slate-500">Product</th>
                                <th className="py-2 px-3 text-left font-semibold text-slate-500">Variation</th>
                                <th className="py-2 px-3 text-left font-semibold text-slate-500">Seller SKU</th>
                                <th className="py-2 px-3 text-left font-semibold text-slate-500">Product ID</th>
                                <th className="py-2 px-3 text-left font-semibold text-slate-500">SKU/Model ID</th>
                                <th className="py-2 px-3 text-left font-semibold text-slate-500">Sync</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {mappings.map((mapping) => (
                                <tr key={mapping.id} className="hover:bg-surface/50">
                                    <td className="py-2.5 px-3 font-semibold capitalize text-slate-700">{mapping.platform ?? '—'}</td>
                                    <td className="py-2.5 px-3 text-slate-600">{mapping.store_name ?? '—'}</td>
                                    <td className="py-2.5 px-3">
                                        <div className="flex items-center gap-2 min-w-[220px]">
                                            <img src={mapping.product_image_url || 'https://placehold.co/28x28/E6ECF0/004368?text=?'} alt="" className="w-7 h-7 rounded-lg object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/28x28/E6ECF0/004368?text=?'; }} />
                                            <span className="font-semibold text-slate-800 truncate max-w-[230px]" title={mapping.product_name}>{mapping.product_name ?? 'Pending platform product'}</span>
                                        </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-600">{mapping.variation_name ?? '—'}</td>
                                    <td className="py-2.5 px-3 font-mono text-primary font-semibold">{mapping.seller_sku ?? '—'}</td>
                                    <td className="py-2.5 px-3 font-mono text-slate-600">{mapping.platform_product_id || mapping.platform_listing_id || '—'}</td>
                                    <td className="py-2.5 px-3 font-mono text-slate-600">
                                        <div>{mapping.platform_sku_id ?? '—'}</div>
                                        {mapping.platform_model_id && <div className="text-[10px] text-slate-400">Model: {mapping.platform_model_id}</div>}
                                    </td>
                                    <td className="py-2.5 px-3"><SyncBadge status={mapping.sync_status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function GroupSyncPanel({ groups, currentSkuId, onAdd, onRemove, removing }) {
    return (
        <div className="rounded-xl border border-surface-border overflow-hidden bg-white">
            <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 font-display">Group Sync Merchant SKU List</h3>
                    <p className="text-xs text-slate-400">Shows parent and child merchant SKUs connected with this SKU.</p>
                </div>
                <button onClick={onAdd} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark">
                    <Plus size={12} /> Add Child SKU
                </button>
            </div>

            {groups.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No group sync SKU added yet</div>
            ) : (
                <div className="divide-y divide-surface-border">
                    {groups.map((group) => {
                        const currentIsPrimary = group.primarySku?.id === currentSkuId;
                        const rows = [
                            { sku: group.primarySku, role: 'Parent' },
                            ...(group.members ?? []).map((m) => ({ sku: m.memberSku, role: 'Child' })),
                        ].filter((row) => row.sku?.id);

                        return (
                            <div key={group.id}>
                                <div className="px-4 py-2 bg-surface-card text-xs text-slate-500">
                                    Parent Group: <span className="font-semibold text-violet-700 font-mono">{group.primarySku?.sku_name ?? `#${group.primary_sku_id ?? group.id}`}</span>
                                    {!currentIsPrimary && <span className="ml-2 text-indigo-600 font-semibold">Current SKU is child in this group</span>}
                                </div>
                                <table className="w-full text-xs">
                                    <thead className="bg-white border-b border-surface-border [&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                                        <tr>
                                            <th className="py-2 px-3 text-left font-semibold text-slate-500">Image</th>
                                            <th className="py-2 px-3 text-left font-semibold text-slate-500">Merchant SKU</th>
                                            <th className="py-2 px-3 text-left font-semibold text-slate-500">Role</th>
                                            <th className="py-2 px-3 text-left font-semibold text-slate-500">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-border">
                                        {rows.map(({ sku, role }) => {
                                            const isPrimaryMember = role === 'Parent';
                                            return (
                                                <tr key={`${group.id}-${sku.id}-${role}`} className={sku.id === currentSkuId ? 'bg-violet-50/40' : 'hover:bg-surface/50'}>
                                                    <td className="py-2.5 px-3 w-12">
                                                        <img src={sku.image_url || 'https://placehold.co/30x30/E6ECF0/004368?text=?'} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <p className="font-semibold text-slate-800 font-mono">{sku.sku_name}</p>
                                                        <p className="text-slate-400 truncate max-w-[260px]">{sku.sku_title}</p>
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full border font-semibold ${isPrimaryMember ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                                            {role}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        {currentIsPrimary && !isPrimaryMember ? (
                                                            <button disabled={removing} onClick={() => onRemove(group.id, sku.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded text-red-500 hover:bg-red-50 font-semibold disabled:opacity-50">
                                                                <Trash2 size={11} /> Remove
                                                            </button>
                                                        ) : <span className="text-slate-300">—</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function SyncBadge({ status }) {
    const cfg = {
        synced: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        out_of_sync: 'bg-amber-100 text-amber-700 border-amber-200',
        pending: 'bg-blue-100 text-blue-700 border-blue-200',
        failed: 'bg-red-100 text-red-700 border-red-200',
    }[status] ?? 'bg-slate-100 text-slate-500 border-slate-200';
    const label = { synced: 'Synced', out_of_sync: 'Out of Sync', pending: 'Pending', failed: 'Failed' }[status] ?? status ?? '—';
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg}`}>{label}</span>;
}
