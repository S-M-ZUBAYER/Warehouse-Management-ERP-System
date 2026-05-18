


// import { useRef, useEffect, useState, useCallback } from 'react';
// import {
//     Search, ChevronDown, Loader2, AlertCircle,
//     Unlink, Link2, X, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
// } from 'lucide-react';
// import { useQuery } from '@tanstack/react-query';

// import Topbar                        from '../../../../components/layout/Topbar';
// import { useByProductMapping }       from '../hooks/useByProductMapping';
// import { useSkuMappingDropdowns }    from '../hooks/useSkuMappingDropdowns';
// import { useAddMappingFromProduct }  from '../hooks/useAddMappingFromProduct';
// import WarehouseSelect               from '../components/WarehouseSelect';
// import ConfirmModal                  from '../components/ConfirmModal';
// import { TableSkeleton, EmptyState } from '../components/TableHelpers';
// import Pagination                    from '../../../../components/shared/Pagination';
// import api                           from '../../../../lib/api';
// import { toast } from 'sonner';

// const TABS = [
//     { label: 'All',      value: 'all'      },
//     { label: 'Unmapped', value: 'unmapped' },
//     { label: 'Mapped',   value: 'mapped'   },
// ];

// const SKU_TYPES = [
//     { label: 'Product Name', value: 'product_name'        },
//     { label: 'SKU',          value: 'seller_sku'          },
//     { label: 'Product ID',   value: 'platform_product_id' },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// export default function ByProductSKUMappingPage() {
//     const { platforms, getStoresForPlatform, warehouses } = useSkuMappingDropdowns();
//     const addFromProduct = useAddMappingFromProduct();

//     // ── Sync modal state ──────────────────────────────────────────────────────
//     const [showSyncModal, setShowSyncModal]   = useState(false);
//     const [syncPlatform,  setSyncPlatform]    = useState('');   // '' = all
//     const [syncStoreId,   setSyncStoreId]     = useState('');

//     const {
//         selectedPlatform, handlePlatformChange,
//         selectedStoreId,  handleStoreChange,
//         searchInput, setSearchInput, handleSearch,
//         skuType, setSkuType,
//         mappingStatus, handleTabChange,
//         page, setPage,
//         products, pagination,
//         counts,
//         isLoading, isFetching, isError, error,
//         selectedIds, toggleSelect, toggleAll,
//         allSelected, someSelected,
//         expandedIds, toggleExpand,
//         showSyncResultModal, setShowSyncResultModal,
//         syncResults,
//         handleSyncClick,
//         syncing,
//         showGenModal, setShowGenModal,
//         genWarehouseId, setGenWarehouseId,
//         genWarehouseName, setGenWarehouseName,
//         handleGenerateClick,
//         confirmGenerateSku,
//         generating,
//         showAutoMapModal, setShowAutoMapModal,
//         autoWarehouseId, setAutoWarehouseId,
//         autoWarehouseName, setAutoWarehouseName,
//         autoModalPlatform, setAutoModalPlatform,
//         autoModalStoreId,  setAutoModalStoreId,
//         handleAutoMapClick,
//         confirmAutoMap,
//         autoMappingResult, setAutoMappingResult,
//         autoMapping,
//         showUnlinkConfirm, setShowUnlinkConfirm,
//         unlinkTarget,
//         openUnlinkConfirm,
//         confirmUnlink,
//         unlinking,
//     } = useByProductMapping();

//     const storesForPlatform     = getStoresForPlatform(selectedPlatform);
//     const syncModalStores       = getStoresForPlatform(syncPlatform);
//     const autoModalStores       = getStoresForPlatform(autoModalPlatform);

//     const tabsWithCount = TABS.map((t) => ({
//         ...t,
//         displayLabel: `${t.label} (${
//             t.value === 'all' ? counts.all
//             : t.value === 'mapped' ? counts.mapped
//             : counts.unmapped
//         })`,
//     }));

//     // "Generate Merchant SKU" single button — needs platform selected first
//     const handleGenerateBtnClick = () => {
//         if (!selectedPlatform) {
//             toast.error('Please select a platform first');
//             return;
//         }
//         if (!selectedIds.length) {
//             toast.error('Select at least one product first');
//             return;
//         }
//         setGenWarehouseId('');
//         setShowGenModal(true);
//     };

//     const openSyncModal = () => {
//         setSyncPlatform(selectedPlatform || '');
//         setSyncStoreId(selectedStoreId  || '');
//         setShowSyncModal(true);
//     };

//     const confirmSync = () => {
//         handleSyncClick(syncPlatform || undefined, syncStoreId || undefined);
//         setShowSyncModal(false);
//     };

//     return (
//         <div className="space-y-4 font-body">
//             <Topbar PageTitle="SKU Mapping" />

//             {/* ── Filter bar ── */}
//             <div className="bg-white rounded-xl border border-surface-border p-4">
//                 <div className="flex items-end gap-3 flex-wrap">
//                     <div className="flex-1 min-w-36">
//                         <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Platform</p>
//                         <div className="relative">
//                             <select
//                                 value={selectedPlatform}
//                                 onChange={(e) => handlePlatformChange(e.target.value)}
//                                 className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
//                             >
//                                 <option value="">All Platforms</option>
//                                 {platforms.map((p) => (
//                                     <option key={p.value} value={p.value}>
//                                         {p.label.charAt(0).toUpperCase() + p.label.slice(1)}
//                                     </option>
//                                 ))}
//                             </select>
//                             <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                         </div>
//                     </div>

//                     <div className="flex-1 min-w-36">
//                         <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Shop</p>
//                         <div className="relative">
//                             <select
//                                 value={selectedStoreId}
//                                 onChange={(e) => handleStoreChange(e.target.value)}
//                                 disabled={!selectedPlatform}
//                                 className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer disabled:opacity-50"
//                             >
//                                 <option value="">All Shops</option>
//                                 {storesForPlatform.map((s) => (
//                                     <option key={s.value} value={s.value}>{s.label}</option>
//                                 ))}
//                             </select>
//                             <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                         </div>
//                     </div>

//                     <div className="relative w-36">
//                         <select
//                             value={skuType}
//                             onChange={(e) => setSkuType(e.target.value)}
//                             className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
//                         >
//                             {SKU_TYPES.map((t) => (
//                                 <option key={t.value} value={t.value}>{t.label}</option>
//                             ))}
//                         </select>
//                         <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                     </div>

//                     <div className="flex-1 relative min-w-40">
//                         <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                         <input
//                             type="text"
//                             placeholder="Search product name / SKU / ID"
//                             value={searchInput}
//                             onChange={(e) => setSearchInput(e.target.value)}
//                             onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
//                             className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
//                         />
//                         {isFetching && !isLoading && (
//                             <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
//                         )}
//                     </div>
//                     <button onClick={handleSearch} className="px-6 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors whitespace-nowrap">
//                         Search
//                     </button>
//                 </div>
//             </div>

//             {/* ── Main Card ── */}
//             <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
//                 <div className="px-5 pt-5 pb-0">
//                     <h2 className="text-base font-bold text-slate-800 font-display mb-4">SKU Mapping by Product</h2>

//                     {/* Action buttons */}
//                     <div className="flex items-center gap-2 mb-3 flex-wrap">
//                         {/* Auto Mapping */}
//                         <button
//                             onClick={handleAutoMapClick}
//                             className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
//                         >
//                             Auto Mapping
//                         </button>

//                         {/* Generate Merchant SKU — single button, no dropdown */}
//                         <button
//                             onClick={handleGenerateBtnClick}
//                             className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
//                         >
//                             Generate Merchant SKU
//                         </button>

//                         {/* Sync Product — opens platform/store modal */}
//                         <button
//                             onClick={openSyncModal}
//                             disabled={syncing}
//                             className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-60"
//                         >
//                             {syncing
//                                 ? <><Loader2 size={13} className="animate-spin text-primary" /> Syncing...</>
//                                 : <><RefreshCw size={13} /> Sync Product</>}
//                         </button>

//                         {selectedIds.length > 0 && (
//                             <span className="text-xs text-slate-500 bg-surface-card px-2.5 py-1 rounded-full ml-1">
//                                 {selectedIds.length} selected
//                             </span>
//                         )}
//                     </div>

//                     {/* Tabs */}
//                     <div className="flex items-center gap-5 border-b border-surface-border">
//                         {tabsWithCount.map((tab) => (
//                             <button
//                                 key={tab.value}
//                                 onClick={() => handleTabChange(tab.value)}
//                                 className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative
//                                     ${mappingStatus === tab.value
//                                         ? 'text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
//                                         : 'text-slate-500 hover:text-slate-700'}`}
//                             >
//                                 {tab.displayLabel}
//                             </button>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Table */}
//                 <div className="overflow-x-auto">
//                     {isLoading ? (
//                         <TableSkeleton cols={10} rows={5} />
//                     ) : isError ? (
//                         <div className="flex flex-col items-center py-16 gap-3 text-slate-400">
//                             <AlertCircle size={28} className="text-red-400" />
//                             <p className="text-sm">{error?.response?.data?.message ?? 'Failed to load products'}</p>
//                             <button onClick={() => setPage(1)} className="text-xs text-primary hover:underline">Retry</button>
//                         </div>
//                     ) : (
//                         <table className="w-full text-sm font-body">
//                             <thead>
//                                 <tr className="border-b border-surface-border">
//                                     <th className="py-3 pl-5 w-28 text-left">
//                                         <label className="flex items-center gap-2 cursor-pointer select-none">
//                                             <input
//                                                 type="checkbox"
//                                                 checked={allSelected}
//                                                 ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
//                                                 onChange={toggleAll}
//                                                 className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                                             />
//                                             <span className="text-xs font-semibold text-slate-600">Select All</span>
//                                         </label>
//                                     </th>
//                                     {['Image', 'Product Name', 'Product ID', 'Store Name', 'Parent SKU', 'Variation Name', 'SKU', 'Merchant SKU', 'Actions'].map((h) => (
//                                         <th key={h} className="py-3 pr-4 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">{h}</th>
//                                     ))}
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-surface-border">
//                                 {products.length === 0 ? (
//                                     <EmptyState message="No platform products found — try Sync Product" colSpan={10} />
//                                 ) : (
//                                     products.map((p) => {
//                                         const isSelected = selectedIds.includes(p.id);
//                                         const isExpanded = expandedIds.includes(p.id);
//                                         const isMapped   = !!p.is_mapped;
//                                         const isParent   = p.row_type === 'parent';
//                                         return (
//                                             <tr
//                                                 key={p.id}
//                                                 className={`transition-colors hover:bg-surface/50 ${isSelected ? 'bg-blue-50/40' : ''} ${isParent ? 'bg-slate-50/60 font-medium' : ''}`}
//                                             >
//                                                 <td className="pl-5 py-3">
//                                                     <div className="flex items-center gap-2">
//                                                         <input
//                                                             type="checkbox"
//                                                             checked={isSelected}
//                                                             onChange={() => toggleSelect(p.id)}
//                                                             className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                                                         />
//                                                         {isParent && (
//                                                             <button onClick={() => toggleExpand(p.id)} className="text-slate-400 hover:text-slate-600 transition-colors">
//                                                                 <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
//                                                             </button>
//                                                         )}
//                                                     </div>
//                                                 </td>
//                                                 <td className="py-3 pr-4">
//                                                     <img
//                                                         src={p.image_url || 'https://placehold.co/36x36/E6ECF0/004368?text=?'}
//                                                         alt={p.product_name}
//                                                         className="w-9 h-9 rounded-lg object-cover"
//                                                         onError={(e) => { e.target.src = 'https://placehold.co/36x36/E6ECF0/004368?text=?'; }}
//                                                     />
//                                                 </td>
//                                                 <td className="py-3 pr-4 text-slate-700 max-w-[180px]">
//                                                     <p className="truncate text-sm" title={p.product_name}>{p.product_name}</p>
//                                                     <p className="text-xs text-slate-400 mt-0.5">{p.platform?.toUpperCase()}</p>
//                                                 </td>
//                                                 <td className="py-3 pr-4 font-mono text-xs text-slate-500">{p.platform_product_id}</td>
//                                                 <td className="py-3 pr-4 text-slate-600 text-xs">{p.store_name ?? '—'}</td>
//                                                 <td className="py-3 pr-4 font-mono text-xs text-slate-600">{p.parent_sku ?? '—'}</td>
//                                                 <td className="py-3 pr-4 text-slate-600 text-xs">{p.variation_name ?? '—'}</td>
//                                                 <td className="py-3 pr-4 font-mono text-xs text-slate-600">{p.seller_sku ?? '—'}</td>
//                                                 <td className="py-3 pr-4 font-mono text-xs">
//                                                     {p.merchant_sku
//                                                         ? <span className="text-primary font-semibold">{p.merchant_sku.sku_name}</span>
//                                                         : <span className="text-slate-300">—</span>}
//                                                 </td>
//                                                 {/* Action: blue link icon if mapped, grey link if not */}
//                                                 <td className="py-3 pr-5">
//                                                     {isMapped ? (
//                                                         <button
//                                                             onClick={() => openUnlinkConfirm(p)}
//                                                             title="Unlink mapping"
//                                                             className="p-1.5 rounded-lg text-primary hover:text-red-500 hover:bg-red-50 transition-colors"
//                                                         >
//                                                             <Unlink size={15} />
//                                                         </button>
//                                                     ) : (
//                                                         <button
//                                                             onClick={() => addFromProduct.openModal(p)}
//                                                             title="Add mapping with store"
//                                                             className="p-1.5 rounded-lg text-slate-300 hover:text-primary hover:bg-blue-50 transition-colors"
//                                                         >
//                                                             <Link2 size={15} />
//                                                         </button>
//                                                     )}
//                                                 </td>
//                                             </tr>
//                                         );
//                                     })
//                                 )}
//                             </tbody>
//                         </table>
//                     )}
//                 </div>

//                 <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />

//                 <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
//                     <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
//                         Export <ChevronDown size={13} className="text-slate-400" />
//                     </button>
//                     <button className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">Print</button>
//                 </div>
//             </div>

//             {/* ══════════════════ Sync Product Modal ══════════════════ */}
//             {showSyncModal && (
//                 <Modal onClose={() => !syncing && setShowSyncModal(false)}>
//                     <div className="px-8 py-5 border-b border-surface-border">
//                         <h2 className="text-base font-bold text-slate-800 font-display">Sync Products</h2>
//                         <p className="text-xs text-slate-500 mt-0.5">Choose which platform and store to sync, or leave blank to sync all.</p>
//                     </div>
//                     <div className="px-8 py-6 space-y-4">
//                         <div>
//                             <p className="text-xs font-semibold text-slate-600 mb-1.5">Platform <span className="text-slate-400 font-normal">(optional — blank = all)</span></p>
//                             <div className="relative">
//                                 <select
//                                     value={syncPlatform}
//                                     onChange={(e) => { setSyncPlatform(e.target.value); setSyncStoreId(''); }}
//                                     className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary"
//                                 >
//                                     <option value="">All Platforms</option>
//                                     {platforms.map((p) => (
//                                         <option key={p.value} value={p.value}>{p.label.charAt(0).toUpperCase() + p.label.slice(1)}</option>
//                                     ))}
//                                 </select>
//                                 <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                             </div>
//                         </div>
//                         <div>
//                             <p className="text-xs font-semibold text-slate-600 mb-1.5">Store <span className="text-slate-400 font-normal">(optional — blank = all stores)</span></p>
//                             <div className="relative">
//                                 <select
//                                     value={syncStoreId}
//                                     onChange={(e) => setSyncStoreId(e.target.value)}
//                                     disabled={!syncPlatform}
//                                     className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary disabled:opacity-50"
//                                 >
//                                     <option value="">All Stores</option>
//                                     {syncModalStores.map((s) => (
//                                         <option key={s.value} value={s.value}>{s.label}</option>
//                                     ))}
//                                 </select>
//                                 <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                             </div>
//                         </div>
//                         <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
//                             <p className="text-xs text-amber-700">
//                                 {syncPlatform
//                                     ? `Will sync ${syncStoreId ? 'selected store' : 'all stores'} on ${syncPlatform.charAt(0).toUpperCase() + syncPlatform.slice(1)}.`
//                                     : 'Will sync ALL platforms and ALL stores. This may take a moment.'}
//                             </p>
//                         </div>
//                     </div>
//                     <div className="flex gap-3 px-8 pb-8">
//                         <button onClick={() => setShowSyncModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card">Cancel</button>
//                         <button onClick={confirmSync} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-2">
//                             <RefreshCw size={14} /> Confirm Sync
//                         </button>
//                     </div>
//                 </Modal>
//             )}

//             {/* ══════════════════ Generate SKU Modal ══════════════════ */}
//             {showGenModal && (
//                 <Modal onClose={() => !generating && setShowGenModal(false)}>
//                     <div className="px-8 pt-8 pb-6 text-center">
//                         <h2 className="text-lg font-bold text-slate-800 font-display mb-2">Generate Merchant SKU</h2>
//                         <p className="text-sm text-slate-500 mb-1">
//                             A unique merchant SKU will be auto-created for{' '}
//                             <span className="font-semibold text-primary">{selectedIds.length} selected product(s)</span>{' '}
//                             from the selected platform product SKU rows.
//                         </p>
//                         <p className="text-xs text-slate-400 mb-5">SKU name will be exactly the child/variant seller SKU. No platform prefix, warehouse suffix, SP, or WH text will be added. Mapping to the selected store product is created automatically and marked synced.</p>
//                         <div className="mb-6 text-left">
//                             <WarehouseSelect
//                                 warehouses={warehouses}
//                                 value={genWarehouseId}
//                                 onChange={(id, label) => { setGenWarehouseId(id); setGenWarehouseName(label); }}
//                                 required
//                             />
//                         </div>
//                         <div className="flex gap-3">
//                             <button onClick={() => setShowGenModal(false)} disabled={generating} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 disabled:opacity-50">Cancel</button>
//                             <button onClick={confirmGenerateSku} disabled={generating} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2">
//                                 {generating && <Loader2 size={14} className="animate-spin" />}
//                                 {generating ? 'Generating...' : 'Generate SKU'}
//                             </button>
//                         </div>
//                     </div>
//                 </Modal>
//             )}

//             {/* ══════════════════ Auto Mapping Modal ══════════════════ */}
//             {showAutoMapModal && (
//                 <Modal onClose={() => !autoMapping && setShowAutoMapModal(false)} maxWidth="460px">
//                     <div className="px-8 pt-8 pb-2">
//                         <h2 className="text-base font-bold text-slate-800 font-display mb-1">Auto Mapping</h2>
//                         <p className="text-sm text-slate-500 mb-4">
//                             {selectedIds.length > 0
//                                 ? <><span className="font-semibold text-primary">{selectedIds.length} selected product(s)</span> will be auto-mapped to matching merchant SKUs by exact child/variant seller SKU.</>
//                                 : 'All unmapped platform product variants will be auto-mapped when an already-created merchant SKU can be found by exact child/variant seller SKU.'}
//                         </p>

//                         {/* Platform selector */}
//                         <div className="mb-3">
//                             <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Platform <span className="text-slate-400 font-normal">(optional)</span></p>
//                             <div className="relative">
//                                 <select
//                                     value={autoModalPlatform}
//                                     onChange={(e) => { setAutoModalPlatform(e.target.value); setAutoModalStoreId(''); }}
//                                     className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary"
//                                 >
//                                     <option value="">All Platforms</option>
//                                     {platforms.map((p) => (
//                                         <option key={p.value} value={p.value}>{p.label.charAt(0).toUpperCase() + p.label.slice(1)}</option>
//                                     ))}
//                                 </select>
//                                 <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                             </div>
//                         </div>

//                         {/* Store selector */}
//                         <div className="mb-4">
//                             <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Store <span className="text-slate-400 font-normal">(optional)</span></p>
//                             <div className="relative">
//                                 <select
//                                     value={autoModalStoreId}
//                                     onChange={(e) => setAutoModalStoreId(e.target.value)}
//                                     disabled={!autoModalPlatform}
//                                     className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary disabled:opacity-50"
//                                 >
//                                     <option value="">Select store</option>
//                                     {autoModalStores.map((s) => (
//                                         <option key={s.value} value={s.value}>{s.label}</option>
//                                     ))}
//                                 </select>
//                                 <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                             </div>
//                         </div>

//                         <div className="mb-5">
//                             <WarehouseSelect
//                                 warehouses={warehouses}
//                                 value={autoWarehouseId}
//                                 onChange={(id, label) => { setAutoWarehouseId(id); setAutoWarehouseName(label); }}
//                                 required
//                             />
//                         </div>

//                         {/* Auto-mapping result */}
//                         {autoMappingResult && (
//                             <div className="mb-4 rounded-xl border border-surface-border overflow-hidden">
//                                 <div className="bg-surface-card px-4 py-2 border-b border-surface-border flex items-center gap-2">
//                                     <CheckCircle2 size={14} className="text-emerald-500" />
//                                     <p className="text-xs font-bold text-slate-700">Mapping Results</p>
//                                 </div>
//                                 <div className="max-h-44 overflow-y-auto divide-y divide-surface-border">
//                                     {autoMappingResult.mapped?.length > 0 && autoMappingResult.mapped.map((m, i) => (
//                                         <div key={i} className="flex items-center gap-2 px-4 py-2">
//                                             <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
//                                             <p className="text-xs text-slate-700 truncate">{m.productName ?? m.sellerSku}</p>
//                                             <span className="ml-auto text-xs text-emerald-600 font-semibold">Mapped</span>
//                                         </div>
//                                     ))}
//                                     {autoMappingResult.failed?.length > 0 && autoMappingResult.failed.map((f, i) => (
//                                         <div key={i} className="flex items-start gap-2 px-4 py-2">
//                                             <XCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
//                                             <div>
//                                                 <p className="text-xs text-slate-700 truncate">{f.productName ?? f.sellerSku}</p>
//                                                 <p className="text-xs text-slate-400">{f.reason}</p>
//                                             </div>
//                                             <span className="ml-auto text-xs text-red-500 font-semibold whitespace-nowrap">Failed</span>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         )}

//                         <div className="flex gap-3 pb-8">
//                             <button onClick={() => { setShowAutoMapModal(false); setAutoMappingResult(null); }} disabled={autoMapping} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 disabled:opacity-50">
//                                 {autoMappingResult ? 'Close' : 'Cancel'}
//                             </button>
//                             {!autoMappingResult && (
//                                 <button onClick={confirmAutoMap} disabled={autoMapping} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2">
//                                     {autoMapping && <Loader2 size={14} className="animate-spin" />}
//                                     {autoMapping ? 'Mapping...' : 'Auto Map'}
//                                 </button>
//                             )}
//                         </div>
//                     </div>
//                 </Modal>
//             )}

//             {/* ══════════════════ Sync Result Modal ══════════════════ */}
//             {showSyncResultModal && (
//                 <Modal onClose={() => setShowSyncResultModal(false)} maxWidth="400px">
//                     <div className="px-8 py-8 text-center">
//                         <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                             <CheckCircle2 size={24} className="text-emerald-600" />
//                         </div>
//                         <h2 className="text-lg font-bold text-slate-800 font-display mb-1">Synchronize Results</h2>
//                         <p className="text-sm font-semibold text-emerald-600 mb-4">Sync completed</p>
//                         <div className="text-left bg-surface rounded-xl p-4 mb-5 space-y-2 max-h-48 overflow-y-auto">
//                             <p className="text-xs font-bold text-slate-700 mb-2">Updates per store</p>
//                             {syncResults?.length > 0 ? (
//                                 syncResults.map((r, i) => (
//                                     <div key={i} className="flex items-center gap-2">
//                                         {r.error
//                                             ? <XCircle size={12} className="text-red-400 flex-shrink-0" />
//                                             : <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />}
//                                         <p className="text-sm text-slate-600">
//                                             <span className="font-medium">{r.storeName}</span>
//                                             {' '}({r.synced ?? 0} product{r.synced !== 1 ? 's' : ''} updated)
//                                             {r.error && <span className="text-red-500 ml-1 text-xs">— {r.error}</span>}
//                                         </p>
//                                     </div>
//                                 ))
//                             ) : (
//                                 <p className="text-sm text-slate-400">No stores synced</p>
//                             )}
//                         </div>
//                         <button onClick={() => setShowSyncResultModal(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white">Close</button>
//                     </div>
//                 </Modal>
//             )}

//             {/* ══════════════════ Add Mapping from Product Modal ══════════════════ */}
//             {addFromProduct.showModal && (
//                 <AddMappingFromProductModal
//                     product={addFromProduct.targetProduct}
//                     onClose={() => addFromProduct.setShowModal(false)}
//                     onConfirm={addFromProduct.confirmMapping}
//                     confirming={addFromProduct.confirming}
//                 />
//             )}

//             {/* ══════════════════ Unlink Confirm ══════════════════ */}
//             {showUnlinkConfirm && unlinkTarget && (
//                 <ConfirmModal
//                     title="Remove Mapping"
//                     message={`Unmap "${unlinkTarget.merchant_sku?.sku_name ?? ''}" from this product? The product will return to unmapped status.`}
//                     confirmLabel={unlinking ? 'Removing...' : 'Unlink'}
//                     confirmClass="bg-red-500 hover:bg-red-600 text-white"
//                     loading={unlinking}
//                     onCancel={() => setShowUnlinkConfirm(false)}
//                     onConfirm={confirmUnlink}
//                 />
//             )}

//             <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
//         </div>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Shared Modal wrapper
// // ─────────────────────────────────────────────────────────────────────────────
// function Modal({ children, onClose, maxWidth = '420px' }) {
//     return (
//         <div
//             className="fixed inset-0 z-50 flex items-center justify-center p-4"
//             style={{ background: 'rgba(180,195,210,0.5)', backdropFilter: 'blur(3px)' }}
//             onClick={(e) => e.target === e.currentTarget && onClose()}
//         >
//             <div className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden" style={{ maxWidth, animation: 'popIn 0.18s ease both' }}>
//                 {children}
//             </div>
//         </div>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Add Mapping from Product modal (grey link icon click)
// // ─────────────────────────────────────────────────────────────────────────────
// function AddMappingFromProductModal({ product, onClose, onConfirm, confirming }) {
//     const [search,        setSearch]        = useState('');
//     const [searchApplied, setSearchApplied] = useState('');
//     const [selectedSkuId, setSelectedSkuId] = useState('');

//     const { data: skuData, isLoading } = useQuery({
//         queryKey:  ['merchant-skus-picker', searchApplied],
//         queryFn:   () => api.get(`/merchant-skus?search=${encodeURIComponent(searchApplied)}&limit=50`).then((r) => r.data),
//         staleTime: 1000 * 30,
//         select:    (r) => r?.data ?? [],
//     });
//     const merchantSkus = skuData ?? [];

//     return (
//         <Modal onClose={() => !confirming && onClose()} maxWidth="480px">
//             <div className="px-8 py-5 border-b border-surface-border flex items-center justify-between">
//                 <div>
//                     <h2 className="text-base font-bold text-slate-800 font-display">Add Mapping with Store</h2>
//                     <p className="text-xs text-slate-500 mt-0.5">
//                         Product: <span className="font-semibold text-primary truncate">{product?.product_name}</span>
//                     </p>
//                 </div>
//                 <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
//             </div>
//             <div className="px-8 py-4">
//                 <p className="text-xs font-semibold text-slate-600 mb-2">Select Merchant SKU to Link</p>
//                 <div className="flex gap-2 mb-3">
//                     <div className="relative flex-1">
//                         <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                         <input type="text" placeholder="Search SKU name..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setSearchApplied(search.trim())} className="w-full pl-8 pr-3 py-2 text-sm border border-surface-border rounded-lg outline-none focus:border-primary" />
//                     </div>
//                     <button onClick={() => setSearchApplied(search.trim())} className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg">Search</button>
//                 </div>
//                 <div className="border border-surface-border rounded-xl overflow-hidden" style={{ maxHeight: '260px', overflowY: 'auto' }}>
//                     {isLoading ? (
//                         <div className="flex items-center justify-center h-20 gap-2 text-xs text-slate-400"><Loader2 size={14} className="animate-spin text-primary" /> Loading...</div>
//                     ) : merchantSkus.length === 0 ? (
//                         <div className="flex items-center justify-center h-20 text-sm text-slate-400">No merchant SKUs found</div>
//                     ) : (
//                         <table className="w-full text-sm">
//                             <tbody className="divide-y divide-surface-border">
//                                 {merchantSkus.map((s) => (
//                                     <tr key={s.id} onClick={() => setSelectedSkuId(String(s.id))} className={`cursor-pointer hover:bg-surface/50 transition-colors ${String(selectedSkuId) === String(s.id) ? 'bg-blue-50' : ''}`}>
//                                         <td className="py-2.5 pl-4 w-8"><input type="radio" checked={String(selectedSkuId) === String(s.id)} onChange={() => setSelectedSkuId(String(s.id))} className="accent-primary cursor-pointer" /></td>
//                                         <td className="py-2.5 pl-3"><img src={s.image_url || 'https://placehold.co/28x28/E6ECF0/004368?text=?'} alt={s.sku_name} className="w-7 h-7 rounded-lg object-cover" onError={(e) => { e.target.src = 'https://placehold.co/28x28/E6ECF0/004368?text=?'; }} /></td>
//                                         <td className="py-2.5 px-3">
//                                             <p className="text-xs font-semibold text-slate-800 font-mono">{s.sku_name}</p>
//                                             <p className="text-xs text-slate-400 truncate max-w-[220px]">{s.sku_title}</p>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     )}
//                 </div>
//             </div>
//             <div className="flex gap-3 px-8 py-5 border-t border-surface-border">
//                 <button onClick={onClose} disabled={confirming} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card disabled:opacity-50">Cancel</button>
//                 <button onClick={() => onConfirm(selectedSkuId)} disabled={confirming || !selectedSkuId} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2">
//                     {confirming && <Loader2 size={14} className="animate-spin" />}
//                     {confirming ? 'Mapping...' : 'Confirm Mapping'}
//                 </button>
//             </div>
//         </Modal>
//     );
// }



// import { useRef, useEffect, useState, useCallback } from 'react';
// import {
//     Search, ChevronDown, Loader2, AlertCircle,
//     Unlink, Link2, X, RefreshCw, CheckCircle2, XCircle, MapPin,
// } from 'lucide-react';
// import { useQuery } from '@tanstack/react-query';

// import Topbar                        from '../../../../components/layout/Topbar';
// import { useByProductMapping }       from '../hooks/useByProductMapping';
// import { useSkuMappingDropdowns }    from '../hooks/useSkuMappingDropdowns';
// import { useAddMappingFromProduct }  from '../hooks/useAddMappingFromProduct';
// import WarehouseSelect               from '../components/WarehouseSelect';
// import ConfirmModal                  from '../components/ConfirmModal';
// import { TableSkeleton, EmptyState } from '../components/TableHelpers';
// import Pagination                    from '../../../../components/shared/Pagination';
// import api                           from '../../../../lib/api';
// import { toast }                     from 'sonner';

// const TABS = [
//     { label: 'All',      value: 'all'      },
//     { label: 'Unmapped', value: 'unmapped' },
//     { label: 'Mapped',   value: 'mapped'   },
// ];

// const SKU_TYPES = [
//     { label: 'Product Name', value: 'product_name'        },
//     { label: 'SKU',          value: 'seller_sku'          },
//     { label: 'Product ID',   value: 'platform_product_id' },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // COMPONENT: PlatformBadge
// // ─────────────────────────────────────────────────────────────────────────────
// function PlatformBadge({ platform }) {
//     if (!platform) return <span className="text-slate-300">—</span>;
//     const map = {
//         tiktok: { label: 'TikTok', cls: 'bg-slate-900 text-white' },
//         shopee: { label: 'Shopee', cls: 'bg-orange-500 text-white' },
//     };
//     const cfg = map[platform.toLowerCase()] ?? { label: platform, cls: 'bg-slate-100 text-slate-700' };
//     return (
//         <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.cls}`}>
//             {cfg.label}
//         </span>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // COMPONENT: Level3MappingRow — one row per platform store mapping
// // ─────────────────────────────────────────────────────────────────────────────
// function Level3MappingTable({ platformMappings, onUnlink }) {
//     if (!platformMappings?.length) {
//         return (
//             <div className="px-8 py-3 text-xs text-slate-400 italic">
//                 No platform store mappings for this SKU yet.
//             </div>
//         );
//     }
//     return (
//         <div className="overflow-x-auto">
//             <table className="w-full text-xs">
//                 <thead>
//                     <tr className="bg-violet-50 border-b border-violet-100">
//                         {['Platform', 'Shop / Store', 'Mapped Merchant SKU', 'Action'].map((h) => (
//                             <th key={h} className="py-2 px-4 text-left font-semibold text-violet-700">{h}</th>
//                         ))}
//                     </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                     {platformMappings.map((m) => (
//                         <tr key={m.mapping_id} className="hover:bg-violet-50/30">
//                             <td className="py-2 px-4">
//                                 <PlatformBadge platform={m.platform} />
//                             </td>
//                             <td className="py-2 px-4 text-slate-600">
//                                 {m.store_name ?? '—'}
//                             </td>
//                             <td className="py-2 px-4 font-mono text-primary font-semibold">
//                                 {m.merchant_sku_name ?? '—'}
//                             </td>
//                             <td className="py-2 px-4">
//                                 <button
//                                     onClick={() => onUnlink(m)}
//                                     title="Unlink this store mapping"
//                                     className="flex items-center gap-1 text-red-400 hover:text-red-600 font-semibold px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
//                                 >
//                                     <Unlink size={11} /> Unlink
//                                 </button>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>
//         </div>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // COMPONENT: ChildSKURow — Level-2 row
// // ─────────────────────────────────────────────────────────────────────────────
// function ChildSKURow({
//     child,
//     isSelected, onToggleSelect,
//     isExpanded, onToggleExpand,
//     onAddMapping, onUnlinkMapping,
//     colSpan,
// }) {
//     const isMapped     = !!child.is_mapped;
//     const mappingCount = child.platform_mappings?.length ?? 0;

//     return (
//         <>
//             {/* Level-2 row */}
//             <tr className={`transition-colors hover:bg-blue-50/30 ${isSelected ? 'bg-blue-50/60' : 'bg-white'}`}>
//                 {/* Indent + checkbox */}
//                 <td className="pl-10 py-2.5">
//                     <input
//                         type="checkbox"
//                         checked={isSelected}
//                         onChange={() => onToggleSelect(child.id)}
//                         className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                     />
//                 </td>
//                 {/* Image */}
//                 <td className="py-2.5 pr-3">
//                     <img
//                         src={child.image_url || 'https://placehold.co/32x32/E6ECF0/004368?text=?'}
//                         alt={child.variation_name ?? child.product_name}
//                         className="w-8 h-8 rounded-lg object-cover"
//                         onError={(e) => { e.target.src = 'https://placehold.co/32x32/E6ECF0/004368?text=?'; }}
//                     />
//                 </td>
//                 {/* Variant Name */}
//                 <td className="py-2.5 pr-3 text-slate-700 max-w-[140px]">
//                     <p className="truncate text-xs font-medium" title={child.variation_name ?? '—'}>
//                         {child.variation_name ?? '—'}
//                     </p>
//                 </td>
//                 {/* Child / Variant SKU */}
//                 <td className="py-2.5 pr-3 font-mono text-xs text-slate-600">
//                     {child.seller_sku ?? '—'}
//                 </td>
//                 {/* Price */}
//                 <td className="py-2.5 pr-3 text-xs text-slate-600">
//                     {child.platform_price != null
//                         ? `${child.currency ?? ''} ${Number(child.platform_price).toFixed(2)}`
//                         : '—'}
//                 </td>
//                 {/* Stock */}
//                 <td className="py-2.5 pr-3 text-xs text-slate-600">
//                     {child.platform_stock ?? 0}
//                 </td>
//                 {/* Merchant SKU */}
//                 <td className="py-2.5 pr-3 font-mono text-xs">
//                     {child.merchant_sku
//                         ? <span className="text-primary font-semibold">{child.merchant_sku.sku_name}</span>
//                         : <span className="text-slate-300">—</span>}
//                 </td>
//                 {/* Mapped Platforms — expand Level-3 */}
//                 <td className="py-2.5 pr-3">
//                     {isMapped ? (
//                         <button
//                             onClick={() => onToggleExpand(child.id)}
//                             className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
//                             title="View mapped platforms"
//                         >
//                             <MapPin size={11} />
//                             {mappingCount} store{mappingCount !== 1 ? 's' : ''}
//                             <ChevronDown size={11} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
//                         </button>
//                     ) : (
//                         <span className="text-slate-300 text-xs">—</span>
//                     )}
//                 </td>
//                 {/* Actions */}
//                 <td className="py-2.5 pr-4">
//                     {isMapped ? (
//                         <button
//                             onClick={() => onUnlinkMapping(child)}
//                             title="Unlink mapping"
//                             className="p-1 rounded-lg text-primary hover:text-red-500 hover:bg-red-50 transition-colors"
//                         >
//                             <Unlink size={13} />
//                         </button>
//                     ) : (
//                         <button
//                             onClick={() => onAddMapping(child)}
//                             title="Add mapping with store"
//                             className="p-1 rounded-lg text-slate-300 hover:text-primary hover:bg-blue-50 transition-colors"
//                         >
//                             <Link2 size={13} />
//                         </button>
//                     )}
//                 </td>
//             </tr>

//             {/* Level-3: platform mapping list */}
//             {isExpanded && isMapped && (
//                 <tr>
//                     <td colSpan={colSpan} className="px-0 py-0 bg-violet-50/40 border-b border-violet-100">
//                         <div className="ml-10 mr-4 my-2 rounded-xl border border-violet-100 overflow-hidden shadow-sm">
//                             <Level3MappingTable
//                                 platformMappings={child.platform_mappings}
//                                 onUnlink={(m) => onUnlinkMapping({ ...child, mapping_id: m.mapping_id, merchant_sku: { sku_name: m.merchant_sku_name } })}
//                             />
//                         </div>
//                     </td>
//                 </tr>
//             )}
//         </>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN PAGE
// // ─────────────────────────────────────────────────────────────────────────────
// export default function ByProductSKUMappingPage() {
//     const { platforms, getStoresForPlatform, warehouses } = useSkuMappingDropdowns();
//     const addFromProduct = useAddMappingFromProduct();

//     // ── Sync modal state ──────────────────────────────────────────────────────
//     const [showSyncModal, setShowSyncModal] = useState(false);
//     const [syncPlatform,  setSyncPlatform]  = useState('');
//     const [syncStoreId,   setSyncStoreId]   = useState('');

//     const {
//         selectedPlatform, handlePlatformChange,
//         selectedStoreId,  handleStoreChange,
//         searchInput, setSearchInput, handleSearch,
//         skuType, setSkuType,
//         mappingStatus, handleTabChange,
//         page, setPage,

//         // hierarchy data
//         parents, pagination,
//         counts,
//         isLoading, isFetching, isError, error,

//         // selection
//         selectedIds, toggleSelect, toggleAll,
//         allSelected, someSelected,

//         // expand
//         expandedParentIds, toggleExpandParent,
//         expandedChildIds,  toggleExpandChild,

//         // sync
//         showSyncResultModal, setShowSyncResultModal,
//         syncResults,
//         handleSyncClick,
//         syncing,

//         // generate SKU
//         showGenModal, setShowGenModal,
//         genWarehouseId, setGenWarehouseId,
//         genWarehouseName, setGenWarehouseName,
//         handleGenerateClick,
//         confirmGenerateSku,
//         generating,

//         // auto map
//         showAutoMapModal, setShowAutoMapModal,
//         autoModalPlatform, setAutoModalPlatform,
//         autoModalStoreId,  setAutoModalStoreId,
//         autoWarehouseId, setAutoWarehouseId,
//         autoWarehouseName, setAutoWarehouseName,
//         handleAutoMapClick,
//         confirmAutoMap,
//         autoMappingResult, setAutoMappingResult,
//         autoMapping,

//         // unlink
//         showUnlinkConfirm, setShowUnlinkConfirm,
//         unlinkTarget,
//         openUnlinkConfirm,
//         confirmUnlink,
//         unlinking,
//     } = useByProductMapping();

//     const storesForPlatform = getStoresForPlatform(selectedPlatform);
//     const syncModalStores   = getStoresForPlatform(syncPlatform);
//     const autoModalStores   = getStoresForPlatform(autoModalPlatform);

//     const tabsWithCount = TABS.map((t) => ({
//         ...t,
//         displayLabel: `${t.label} (${
//             t.value === 'all' ? counts.all
//             : t.value === 'mapped' ? counts.mapped
//             : counts.unmapped
//         })`,
//     }));

//     const handleGenerateBtnClick = () => {
//         if (!selectedIds.length) {
//             toast.error('Select at least one SKU first');
//             return;
//         }
//         setGenWarehouseId('');
//         setShowGenModal(true);
//     };

//     const openSyncModal = () => {
//         setSyncPlatform(selectedPlatform || '');
//         setSyncStoreId(selectedStoreId  || '');
//         setShowSyncModal(true);
//     };

//     const confirmSync = () => {
//         handleSyncClick(syncPlatform || undefined, syncStoreId || undefined);
//         setShowSyncModal(false);
//     };

//     // Total columns in the table (used for colSpan in Level-3 expansion)
//     const TABLE_COLS = 10; // checkbox, image, variant name, child sku, price, stock, merchant sku, mapped platforms, actions

//     return (
//         <div className="space-y-4 font-body">
//             <Topbar PageTitle="SKU Mapping" />

//             {/* ── Filter bar ── */}
//             <div className="bg-white rounded-xl border border-surface-border p-4">
//                 <div className="flex items-end gap-3 flex-wrap">
//                     <div className="flex-1 min-w-36">
//                         <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Platform</p>
//                         <div className="relative">
//                             <select
//                                 value={selectedPlatform}
//                                 onChange={(e) => handlePlatformChange(e.target.value)}
//                                 className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
//                             >
//                                 <option value="">All Platforms</option>
//                                 {platforms.map((p) => (
//                                     <option key={p.value} value={p.value}>
//                                         {p.label.charAt(0).toUpperCase() + p.label.slice(1)}
//                                     </option>
//                                 ))}
//                             </select>
//                             <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                         </div>
//                     </div>

//                     <div className="flex-1 min-w-36">
//                         <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Shop</p>
//                         <div className="relative">
//                             <select
//                                 value={selectedStoreId}
//                                 onChange={(e) => handleStoreChange(e.target.value)}
//                                 disabled={!selectedPlatform}
//                                 className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer disabled:opacity-50"
//                             >
//                                 <option value="">All Shops</option>
//                                 {storesForPlatform.map((s) => (
//                                     <option key={s.value} value={s.value}>{s.label}</option>
//                                 ))}
//                             </select>
//                             <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                         </div>
//                     </div>

//                     <div className="relative w-36">
//                         <select
//                             value={skuType}
//                             onChange={(e) => setSkuType(e.target.value)}
//                             className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
//                         >
//                             {SKU_TYPES.map((t) => (
//                                 <option key={t.value} value={t.value}>{t.label}</option>
//                             ))}
//                         </select>
//                         <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                     </div>

//                     <div className="flex-1 relative min-w-40">
//                         <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                         <input
//                             type="text"
//                             placeholder="Search product name / SKU / ID"
//                             value={searchInput}
//                             onChange={(e) => setSearchInput(e.target.value)}
//                             onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
//                             className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
//                         />
//                         {isFetching && !isLoading && (
//                             <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
//                         )}
//                     </div>
//                     <button
//                         onClick={handleSearch}
//                         className="px-6 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors whitespace-nowrap"
//                     >
//                         Search
//                     </button>
//                 </div>
//             </div>

//             {/* ── Main Card ── */}
//             <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
//                 <div className="px-5 pt-5 pb-0">
//                     <h2 className="text-base font-bold text-slate-800 font-display mb-4">
//                         SKU Mapping by Product
//                     </h2>

//                     {/* Action buttons */}
//                     <div className="flex items-center gap-2 mb-3 flex-wrap">
//                         <button
//                             onClick={handleAutoMapClick}
//                             className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
//                         >
//                             Auto Mapping
//                         </button>

//                         <button
//                             onClick={handleGenerateBtnClick}
//                             className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
//                         >
//                             Generate Merchant SKU
//                         </button>

//                         <button
//                             onClick={openSyncModal}
//                             disabled={syncing}
//                             className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-60"
//                         >
//                             {syncing
//                                 ? <><Loader2 size={13} className="animate-spin text-primary" /> Syncing...</>
//                                 : <><RefreshCw size={13} /> Sync Product</>}
//                         </button>

//                         {selectedIds.length > 0 && (
//                             <span className="text-xs text-slate-500 bg-surface-card px-2.5 py-1 rounded-full ml-1">
//                                 {selectedIds.length} child SKU(s) selected
//                             </span>
//                         )}
//                     </div>

//                     {/* Tabs */}
//                     <div className="flex items-center gap-5 border-b border-surface-border">
//                         {tabsWithCount.map((tab) => (
//                             <button
//                                 key={tab.value}
//                                 onClick={() => handleTabChange(tab.value)}
//                                 className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative
//                                     ${mappingStatus === tab.value
//                                         ? 'text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
//                                         : 'text-slate-500 hover:text-slate-700'}`}
//                             >
//                                 {tab.displayLabel}
//                             </button>
//                         ))}
//                     </div>
//                 </div>

//                 {/* ── Table — 3-level hierarchy ── */}
//                 <div className="overflow-x-auto">
//                     {isLoading ? (
//                         <TableSkeleton cols={TABLE_COLS} rows={5} />
//                     ) : isError ? (
//                         <div className="flex flex-col items-center py-16 gap-3 text-slate-400">
//                             <AlertCircle size={28} className="text-red-400" />
//                             <p className="text-sm">{error?.response?.data?.message ?? 'Failed to load products'}</p>
//                             <button onClick={() => setPage(1)} className="text-xs text-primary hover:underline">Retry</button>
//                         </div>
//                     ) : (
//                         <table className="w-full text-sm font-body">
//                             <thead>
//                                 <tr className="border-b border-surface-border bg-slate-50">
//                                     {/* Select all (only selects child rows) */}
//                                     <th className="py-3 pl-5 w-10 text-left">
//                                         <input
//                                             type="checkbox"
//                                             checked={allSelected}
//                                             ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
//                                             onChange={toggleAll}
//                                             className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                                             title="Select all child SKUs"
//                                         />
//                                     </th>
//                                     {[
//                                         'Image',
//                                         'Product / Variant',
//                                         'Variant / Child SKU',
//                                         'Price',
//                                         'Stock',
//                                         'Merchant SKU',
//                                         'Mapped Stores',
//                                         'Actions',
//                                     ].map((h) => (
//                                         <th key={h} className="py-3 pr-4 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">{h}</th>
//                                     ))}
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-surface-border">
//                                 {parents.length === 0 ? (
//                                     <EmptyState
//                                         message="No platform products found — try Sync Product"
//                                         colSpan={TABLE_COLS}
//                                     />
//                                 ) : (
//                                     parents.map((parent) => {
//                                         const isParentExpanded = expandedParentIds.includes(parent.id);
//                                         const children         = parent.children ?? [];

//                                         return (
//                                             <>
//                                                 {/* ═══════ Level-1: Parent Row ═══════ */}
//                                                 <tr
//                                                     key={`parent-${parent.id}`}
//                                                     className="bg-slate-100/70 hover:bg-slate-100 transition-colors"
//                                                 >
//                                                     {/* Expand chevron — no checkbox for parent */}
//                                                     <td className="pl-5 py-3" colSpan={1}>
//                                                         <button
//                                                             onClick={() => toggleExpandParent(parent.id)}
//                                                             className="text-slate-500 hover:text-slate-700 transition-colors"
//                                                             title={isParentExpanded ? 'Collapse variants' : 'Expand variants'}
//                                                         >
//                                                             <ChevronDown
//                                                                 size={15}
//                                                                 className={`transition-transform ${isParentExpanded ? 'rotate-180' : ''}`}
//                                                             />
//                                                         </button>
//                                                     </td>
//                                                     {/* Image */}
//                                                     <td className="py-3 pr-3">
//                                                         <img
//                                                             src={parent.image_url || 'https://placehold.co/36x36/E6ECF0/004368?text=?'}
//                                                             alt={parent.product_name}
//                                                             className="w-9 h-9 rounded-lg object-cover"
//                                                             onError={(e) => { e.target.src = 'https://placehold.co/36x36/E6ECF0/004368?text=?'; }}
//                                                         />
//                                                     </td>
//                                                     {/* Product Title */}
//                                                     <td className="py-3 pr-3 max-w-[200px]" colSpan={2}>
//                                                         <p className="text-sm font-semibold text-slate-800 truncate" title={parent.product_name}>
//                                                             {parent.product_name}
//                                                         </p>
//                                                         <div className="flex items-center gap-2 mt-0.5">
//                                                             <PlatformBadge platform={parent.platform} />
//                                                             <span className="text-xs text-slate-400">{parent.store_name}</span>
//                                                         </div>
//                                                     </td>
//                                                     {/* Parent SKU */}
//                                                     <td className="py-3 pr-3 font-mono text-xs text-slate-500 align-top pt-4">
//                                                         {parent.parent_sku ?? '—'}
//                                                     </td>
//                                                     {/* Empty cols */}
//                                                     <td />
//                                                     <td />
//                                                     {/* Child count */}
//                                                     <td className="py-3 pr-3 text-xs text-slate-400">
//                                                         {children.length} variant{children.length !== 1 ? 's' : ''}
//                                                     </td>
//                                                     {/* No action on parent */}
//                                                     <td />
//                                                 </tr>

//                                                 {/* ═══════ Level-2: Child SKU rows (expanded under parent) ═══════ */}
//                                                 {isParentExpanded && children.map((child) => (
//                                                     <ChildSKURow
//                                                         key={`child-${child.id}`}
//                                                         child={child}
//                                                         isSelected={selectedIds.includes(child.id)}
//                                                         onToggleSelect={toggleSelect}
//                                                         isExpanded={expandedChildIds.includes(child.id)}
//                                                         onToggleExpand={toggleExpandChild}
//                                                         onAddMapping={(c) => addFromProduct.openModal(c)}
//                                                         onUnlinkMapping={openUnlinkConfirm}
//                                                         colSpan={TABLE_COLS}
//                                                     />
//                                                 ))}
//                                             </>
//                                         );
//                                     })
//                                 )}
//                             </tbody>
//                         </table>
//                     )}
//                 </div>

//                 <Pagination
//                     page={page}
//                     totalPages={pagination.totalPages}
//                     total={pagination.total}
//                     limit={pagination.limit}
//                     onPageChange={setPage}
//                 />

//                 <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
//                     <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
//                         Export <ChevronDown size={13} className="text-slate-400" />
//                     </button>
//                     <button className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">
//                         Print
//                     </button>
//                 </div>
//             </div>

//             {/* ══════════════════ Sync Product Modal ══════════════════ */}
//             {showSyncModal && (
//                 <Modal onClose={() => !syncing && setShowSyncModal(false)}>
//                     <div className="px-8 py-5 border-b border-surface-border">
//                         <h2 className="text-base font-bold text-slate-800 font-display">Sync Products</h2>
//                         <p className="text-xs text-slate-500 mt-0.5">
//                             Choose which platform and store to sync, or leave blank to sync all.
//                         </p>
//                     </div>
//                     <div className="px-8 py-6 space-y-4">
//                         <div>
//                             <p className="text-xs font-semibold text-slate-600 mb-1.5">
//                                 Platform <span className="text-slate-400 font-normal">(optional — blank = all)</span>
//                             </p>
//                             <div className="relative">
//                                 <select
//                                     value={syncPlatform}
//                                     onChange={(e) => { setSyncPlatform(e.target.value); setSyncStoreId(''); }}
//                                     className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary"
//                                 >
//                                     <option value="">All Platforms</option>
//                                     {platforms.map((p) => (
//                                         <option key={p.value} value={p.value}>
//                                             {p.label.charAt(0).toUpperCase() + p.label.slice(1)}
//                                         </option>
//                                     ))}
//                                 </select>
//                                 <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                             </div>
//                         </div>
//                         <div>
//                             <p className="text-xs font-semibold text-slate-600 mb-1.5">
//                                 Store <span className="text-slate-400 font-normal">(optional)</span>
//                             </p>
//                             <div className="relative">
//                                 <select
//                                     value={syncStoreId}
//                                     onChange={(e) => setSyncStoreId(e.target.value)}
//                                     disabled={!syncPlatform}
//                                     className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary disabled:opacity-50"
//                                 >
//                                     <option value="">All Stores</option>
//                                     {syncModalStores.map((s) => (
//                                         <option key={s.value} value={s.value}>{s.label}</option>
//                                     ))}
//                                 </select>
//                                 <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                             </div>
//                         </div>
//                         <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
//                             <p className="text-xs text-amber-700">
//                                 {syncPlatform
//                                     ? `Will sync ${syncStoreId ? 'selected store' : 'all stores'} on ${syncPlatform.charAt(0).toUpperCase() + syncPlatform.slice(1)}.`
//                                     : 'Will sync ALL platforms and ALL stores. This may take a moment.'}
//                             </p>
//                         </div>
//                     </div>
//                     <div className="flex gap-3 px-8 pb-8">
//                         <button
//                             onClick={() => setShowSyncModal(false)}
//                             className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card"
//                         >
//                             Cancel
//                         </button>
//                         <button
//                             onClick={confirmSync}
//                             className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-2"
//                         >
//                             <RefreshCw size={14} /> Confirm Sync
//                         </button>
//                     </div>
//                 </Modal>
//             )}

//             {/* ══════════════════ Generate SKU Modal ══════════════════ */}
//             {showGenModal && (
//                 <Modal onClose={() => !generating && setShowGenModal(false)}>
//                     <div className="px-8 pt-8 pb-6 text-center">
//                         <h2 className="text-lg font-bold text-slate-800 font-display mb-2">
//                             Generate Merchant SKU
//                         </h2>
//                         <p className="text-sm text-slate-500 mb-1">
//                             A unique merchant SKU will be auto-created for{' '}
//                             <span className="font-semibold text-primary">{selectedIds.length} selected SKU(s)</span>.
//                         </p>
//                         <p className="text-xs text-slate-400 mb-1">
//                             Format: <span className="font-mono text-slate-600">[Platform]-[SellerSKU]-[WarehouseCode]</span>
//                         </p>
//                         <p className="text-xs text-slate-400 mb-5">
//                             Example: <span className="font-mono text-primary">TT-Aface01N-WH01</span>
//                         </p>
//                         <div className="mb-6 text-left">
//                             <WarehouseSelect
//                                 warehouses={warehouses}
//                                 value={genWarehouseId}
//                                 onChange={(id, label) => { setGenWarehouseId(id); setGenWarehouseName(label); }}
//                                 required
//                             />
//                         </div>
//                         <div className="flex gap-3">
//                             <button
//                                 onClick={() => setShowGenModal(false)}
//                                 disabled={generating}
//                                 className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 disabled:opacity-50"
//                             >
//                                 Cancel
//                             </button>
//                             <button
//                                 onClick={confirmGenerateSku}
//                                 disabled={generating}
//                                 className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2"
//                             >
//                                 {generating && <Loader2 size={14} className="animate-spin" />}
//                                 {generating ? 'Generating...' : 'Generate SKU'}
//                             </button>
//                         </div>
//                     </div>
//                 </Modal>
//             )}

//             {/* ══════════════════ Auto Mapping Modal ══════════════════ */}
//             {showAutoMapModal && (
//                 <Modal onClose={() => !autoMapping && setShowAutoMapModal(false)} maxWidth="460px">
//                     <div className="px-8 pt-8 pb-2">
//                         <h2 className="text-base font-bold text-slate-800 font-display mb-1">Auto Mapping</h2>
//                         <p className="text-sm text-slate-500 mb-4">
//                             {selectedIds.length > 0
//                                 ? <><span className="font-semibold text-primary">{selectedIds.length} selected SKU(s)</span> will be auto-mapped to matching Merchant SKUs.</>
//                                 : 'All unmapped platform SKUs in the selected store will be auto-mapped to matching Merchant SKUs.'}
//                         </p>

//                         <div className="mb-3">
//                             <p className="text-xs font-semibold text-slate-600 mb-1.5">
//                                 Select Platform <span className="text-slate-400 font-normal">(optional)</span>
//                             </p>
//                             <div className="relative">
//                                 <select
//                                     value={autoModalPlatform}
//                                     onChange={(e) => { setAutoModalPlatform(e.target.value); setAutoModalStoreId(''); }}
//                                     className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary"
//                                 >
//                                     <option value="">All Platforms</option>
//                                     {platforms.map((p) => (
//                                         <option key={p.value} value={p.value}>
//                                             {p.label.charAt(0).toUpperCase() + p.label.slice(1)}
//                                         </option>
//                                     ))}
//                                 </select>
//                                 <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                             </div>
//                         </div>

//                         <div className="mb-4">
//                             <p className="text-xs font-semibold text-slate-600 mb-1.5">
//                                 Select Store <span className="text-slate-400 font-normal">(optional)</span>
//                             </p>
//                             <div className="relative">
//                                 <select
//                                     value={autoModalStoreId}
//                                     onChange={(e) => setAutoModalStoreId(e.target.value)}
//                                     disabled={!autoModalPlatform}
//                                     className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary disabled:opacity-50"
//                                 >
//                                     <option value="">Select store</option>
//                                     {autoModalStores.map((s) => (
//                                         <option key={s.value} value={s.value}>{s.label}</option>
//                                     ))}
//                                 </select>
//                                 <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                             </div>
//                         </div>

//                         <div className="mb-5">
//                             <WarehouseSelect
//                                 warehouses={warehouses}
//                                 value={autoWarehouseId}
//                                 onChange={(id, label) => { setAutoWarehouseId(id); setAutoWarehouseName(label); }}
//                                 required
//                             />
//                         </div>

//                         {/* Auto-mapping result */}
//                         {autoMappingResult && (
//                             <div className="mb-4 rounded-xl border border-surface-border overflow-hidden">
//                                 <div className="bg-surface-card px-4 py-2 border-b border-surface-border flex items-center gap-2">
//                                     <CheckCircle2 size={14} className="text-emerald-500" />
//                                     <p className="text-xs font-bold text-slate-700">
//                                         Mapping Results — {autoMappingResult.matched} matched, {autoMappingResult.skipped} skipped
//                                     </p>
//                                 </div>
//                                 <div className="max-h-44 overflow-y-auto divide-y divide-surface-border">
//                                     {(autoMappingResult.mapped ?? []).map((m, i) => (
//                                         <div key={i} className="flex items-center gap-2 px-4 py-2">
//                                             <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
//                                             <p className="text-xs text-slate-700 truncate">{m.productName ?? m.sellerSku}</p>
//                                             <span className="ml-auto text-xs text-emerald-600 font-semibold whitespace-nowrap">{m.merchantSku}</span>
//                                         </div>
//                                     ))}
//                                     {(autoMappingResult.failed ?? []).map((f, i) => (
//                                         <div key={i} className="flex items-start gap-2 px-4 py-2">
//                                             <XCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
//                                             <div>
//                                                 <p className="text-xs text-slate-700 truncate">{f.productName ?? f.sellerSku}</p>
//                                                 <p className="text-xs text-slate-400">{f.reason}</p>
//                                             </div>
//                                             <span className="ml-auto text-xs text-red-500 font-semibold whitespace-nowrap">Failed</span>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         )}

//                         <div className="flex gap-3 pb-8">
//                             <button
//                                 onClick={() => { setShowAutoMapModal(false); setAutoMappingResult(null); }}
//                                 disabled={autoMapping}
//                                 className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 disabled:opacity-50"
//                             >
//                                 {autoMappingResult ? 'Close' : 'Cancel'}
//                             </button>
//                             {!autoMappingResult && (
//                                 <button
//                                     onClick={confirmAutoMap}
//                                     disabled={autoMapping}
//                                     className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2"
//                                 >
//                                     {autoMapping && <Loader2 size={14} className="animate-spin" />}
//                                     {autoMapping ? 'Mapping...' : 'Auto Map'}
//                                 </button>
//                             )}
//                         </div>
//                     </div>
//                 </Modal>
//             )}

//             {/* ══════════════════ Sync Result Modal ══════════════════ */}
//             {showSyncResultModal && (
//                 <Modal onClose={() => setShowSyncResultModal(false)} maxWidth="400px">
//                     <div className="px-8 py-8 text-center">
//                         <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                             <CheckCircle2 size={24} className="text-emerald-600" />
//                         </div>
//                         <h2 className="text-lg font-bold text-slate-800 font-display mb-1">Sync Results</h2>
//                         <p className="text-sm font-semibold text-emerald-600 mb-4">Sync completed</p>
//                         <div className="text-left bg-surface rounded-xl p-4 mb-5 space-y-2 max-h-48 overflow-y-auto">
//                             <p className="text-xs font-bold text-slate-700 mb-2">Updates per store</p>
//                             {syncResults?.length > 0 ? (
//                                 syncResults.map((r, i) => (
//                                     <div key={i} className="flex items-center gap-2">
//                                         {r.error
//                                             ? <XCircle size={12} className="text-red-400 flex-shrink-0" />
//                                             : <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />}
//                                         <p className="text-sm text-slate-600">
//                                             <span className="font-medium">{r.storeName}</span>
//                                             {' '}({r.synced ?? 0} product{r.synced !== 1 ? 's' : ''} updated)
//                                             {r.error && <span className="text-red-500 ml-1 text-xs">— {r.error}</span>}
//                                         </p>
//                                     </div>
//                                 ))
//                             ) : (
//                                 <p className="text-sm text-slate-400">No stores synced</p>
//                             )}
//                         </div>
//                         <button
//                             onClick={() => setShowSyncResultModal(false)}
//                             className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white"
//                         >
//                             Close
//                         </button>
//                     </div>
//                 </Modal>
//             )}

//             {/* ══════════════════ Add Mapping from Product Modal ══════════════════ */}
//             {addFromProduct.showModal && (
//                 <AddMappingFromProductModal
//                     product={addFromProduct.targetProduct}
//                     onClose={() => addFromProduct.setShowModal(false)}
//                     onConfirm={addFromProduct.confirmMapping}
//                     confirming={addFromProduct.confirming}
//                 />
//             )}

//             {/* ══════════════════ Unlink Confirm ══════════════════ */}
//             {showUnlinkConfirm && unlinkTarget && (
//                 <ConfirmModal
//                     title="Remove Mapping"
//                     message={`Unmap "${unlinkTarget.merchant_sku?.sku_name ?? ''}" from this product? The product will return to unmapped status.`}
//                     confirmLabel={unlinking ? 'Removing...' : 'Unlink'}
//                     confirmClass="bg-red-500 hover:bg-red-600 text-white"
//                     loading={unlinking}
//                     onCancel={() => setShowUnlinkConfirm(false)}
//                     onConfirm={confirmUnlink}
//                 />
//             )}

//             <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
//         </div>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Shared Modal wrapper
// // ─────────────────────────────────────────────────────────────────────────────
// function Modal({ children, onClose, maxWidth = '420px' }) {
//     return (
//         <div
//             className="fixed inset-0 z-50 flex items-center justify-center p-4"
//             style={{ background: 'rgba(180,195,210,0.5)', backdropFilter: 'blur(3px)' }}
//             onClick={(e) => e.target === e.currentTarget && onClose?.()}
//         >
//             <div
//                 className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden"
//                 style={{ maxWidth, animation: 'popIn 0.18s ease both' }}
//             >
//                 {children}
//             </div>
//         </div>
//     );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // AddMappingFromProductModal — select a Merchant SKU to link to a product
// // ─────────────────────────────────────────────────────────────────────────────
// function AddMappingFromProductModal({ product, onClose, onConfirm, confirming }) {
//     const [search,        setSearch]        = useState('');
//     const [searchApplied, setSearchApplied] = useState('');
//     const [selectedSkuId, setSelectedSkuId] = useState('');

//     const { data: skuData, isLoading } = useQuery({
//         queryKey:  ['merchant-skus-picker', searchApplied],
//         queryFn:   () =>
//             api.get(`/merchant-skus?search=${encodeURIComponent(searchApplied)}&limit=50`).then((r) => r.data),
//         staleTime: 1000 * 30,
//         select:    (r) => r?.data ?? [],
//     });
//     const merchantSkus = skuData ?? [];

//     return (
//         <div
//             className="fixed inset-0 z-50 flex items-center justify-center p-4"
//             style={{ background: 'rgba(180,195,210,0.5)', backdropFilter: 'blur(3px)' }}
//             onClick={(e) => e.target === e.currentTarget && !confirming && onClose()}
//         >
//             <div
//                 className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden"
//                 style={{ maxWidth: '480px', animation: 'popIn 0.18s ease both' }}
//             >
//                 <div className="px-8 py-5 border-b border-surface-border flex items-center justify-between">
//                     <div>
//                         <h2 className="text-base font-bold text-slate-800 font-display">Add Mapping with Store</h2>
//                         <p className="text-xs text-slate-500 mt-0.5">
//                             Product:{' '}
//                             <span className="font-semibold text-primary truncate">{product?.product_name}</span>
//                             {product?.variation_name && (
//                                 <span className="text-slate-400"> · {product.variation_name}</span>
//                             )}
//                         </p>
//                     </div>
//                     <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
//                         <X size={18} />
//                     </button>
//                 </div>

//                 <div className="px-8 py-4">
//                     <p className="text-xs font-semibold text-slate-600 mb-2">Select Merchant SKU to Link</p>
//                     <div className="flex gap-2 mb-3">
//                         <div className="relative flex-1">
//                             <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                             <input
//                                 type="text"
//                                 placeholder="Search SKU name..."
//                                 value={search}
//                                 onChange={(e) => setSearch(e.target.value)}
//                                 onKeyDown={(e) => e.key === 'Enter' && setSearchApplied(search.trim())}
//                                 className="w-full pl-8 pr-3 py-2 text-sm border border-surface-border rounded-lg outline-none focus:border-primary"
//                             />
//                         </div>
//                         <button
//                             onClick={() => setSearchApplied(search.trim())}
//                             className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg"
//                         >
//                             Search
//                         </button>
//                     </div>

//                     <div
//                         className="border border-surface-border rounded-xl overflow-hidden"
//                         style={{ maxHeight: '260px', overflowY: 'auto' }}
//                     >
//                         {isLoading ? (
//                             <div className="flex items-center justify-center h-20 gap-2 text-xs text-slate-400">
//                                 <Loader2 size={14} className="animate-spin text-primary" /> Loading...
//                             </div>
//                         ) : merchantSkus.length === 0 ? (
//                             <div className="flex items-center justify-center h-20 text-sm text-slate-400">
//                                 No merchant SKUs found
//                             </div>
//                         ) : (
//                             <table className="w-full text-sm">
//                                 <tbody className="divide-y divide-surface-border">
//                                     {merchantSkus.map((s) => (
//                                         <tr
//                                             key={s.id}
//                                             onClick={() => setSelectedSkuId(String(s.id))}
//                                             className={`cursor-pointer hover:bg-surface/50 transition-colors ${String(selectedSkuId) === String(s.id) ? 'bg-blue-50' : ''}`}
//                                         >
//                                             <td className="py-2.5 pl-4 w-8">
//                                                 <input
//                                                     type="radio"
//                                                     checked={String(selectedSkuId) === String(s.id)}
//                                                     onChange={() => setSelectedSkuId(String(s.id))}
//                                                     className="accent-primary cursor-pointer"
//                                                 />
//                                             </td>
//                                             <td className="py-2.5 pl-3">
//                                                 <img
//                                                     src={s.image_url || 'https://placehold.co/28x28/E6ECF0/004368?text=?'}
//                                                     alt={s.sku_name}
//                                                     className="w-7 h-7 rounded-lg object-cover"
//                                                     onError={(e) => { e.target.src = 'https://placehold.co/28x28/E6ECF0/004368?text=?'; }}
//                                                 />
//                                             </td>
//                                             <td className="py-2.5 px-3">
//                                                 <p className="text-xs font-semibold text-slate-800 font-mono">{s.sku_name}</p>
//                                                 <p className="text-xs text-slate-400 truncate max-w-[220px]">{s.sku_title}</p>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         )}
//                     </div>
//                 </div>

//                 <div className="flex gap-3 px-8 py-5 border-t border-surface-border">
//                     <button
//                         onClick={onClose}
//                         disabled={confirming}
//                         className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card disabled:opacity-50"
//                     >
//                         Cancel
//                     </button>
//                     <button
//                         onClick={() => onConfirm(selectedSkuId)}
//                         disabled={confirming || !selectedSkuId}
//                         className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2"
//                     >
//                         {confirming && <Loader2 size={14} className="animate-spin" />}
//                         {confirming ? 'Mapping...' : 'Confirm Mapping'}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }




// from chat gpt............................




// import { useRef, useEffect, useState } from 'react';
// import { Search, ChevronDown, Loader2, AlertCircle, Unlink, Link2, X } from 'lucide-react';
// import { useQuery } from '@tanstack/react-query';
// import Topbar from '../../../../components/layout/Topbar';
// import { useByProductMapping }        from '../hooks/useByProductMapping';
// import { useSkuMappingDropdowns }     from '../hooks/useSkuMappingDropdowns';
// import { useAddMappingFromProduct }   from '../hooks/useAddMappingFromProduct';
// import MappingStatusBadge             from '../components/MappingStatusBadge';
// import WarehouseSelect                from '../components/WarehouseSelect';
// import ConfirmModal                   from '../components/ConfirmModal';
// import { TableSkeleton, EmptyState, MappingActionBtn, Pagination } from '../components/TableHelpers';
// import api from '../../../../lib/api';

// // ─────────────────────────────────────────────────────────────────────────────
// // ByProductSKUMappingPage
// // Shows platform products (synced from Shopee/TikTok).
// // Parent rows are expandable — child SKU rows show underneath.
// // Actions: Sync Product (calls Java proxy), Auto Mapping, Generate Merchant SKU.
// // ─────────────────────────────────────────────────────────────────────────────

// const TABS = [
//     { label: 'All',      value: 'all'      },
//     { label: 'Unmapped', value: 'unmapped' },
//     { label: 'Mapped',   value: 'mapped'   },
// ];

// const SKU_TYPES = [
//     { label: 'Product Name',  value: 'product_name'        },
//     { label: 'SKU',           value: 'seller_sku'          },
//     { label: 'Product ID',    value: 'platform_product_id' },
// ];

// // ════════════════════════════════════════════════════════════════════════════
// // COMPONENT: UnmappedActionDropdown
// // Replaces the silent MappingActionBtn for unmapped rows.
// // ════════════════════════════════════════════════════════════════════════════
// function UnmappedActionDropdown({ product, onAddMapping }) {
//     const [open, setOpen] = useState(false);
//     const ref = useRef(null);

//     useEffect(() => {
//         const handler = (e) => {
//             if (ref.current && !ref.current.contains(e.target)) setOpen(false);
//         };
//         document.addEventListener('mousedown', handler);
//         return () => document.removeEventListener('mousedown', handler);
//     }, []);

//     return (
//         <div className="relative" ref={ref}>
//             <button
//                 onClick={() => setOpen((p) => !p)}
//                 className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border border-surface-border rounded-lg text-slate-600 bg-white hover:bg-surface-card transition-colors"
//             >
//                 Actions <ChevronDown size={11} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
//             </button>
//             {open && (
//                 <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-xl py-1 min-w-[180px]">
//                     <button
//                         onClick={() => { onAddMapping(); setOpen(false); }}
//                         className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-slate-700 hover:bg-surface-card transition-colors"
//                     >
//                         <Link2 size={13} />
//                         Add Mapping with Store
//                     </button>
//                 </div>
//             )}
//         </div>
//     );
// }

// // ════════════════════════════════════════════════════════════════════════════
// // COMPONENT: AddMappingFromProductModal
// // Lets the user search for and select a merchant SKU to link to this product.
// // ════════════════════════════════════════════════════════════════════════════
// function AddMappingFromProductModal({ product, onClose, onConfirm, confirming }) {
//     const [search,        setSearch]        = useState('');
//     const [searchApplied, setSearchApplied] = useState('');
//     const [selectedSkuId, setSelectedSkuId] = useState('');

//     const { data: skuData, isLoading } = useQuery({
//         queryKey:  ['merchant-skus-picker', searchApplied],
//         queryFn:   () =>
//             api.get(`/merchant-skus?search=${encodeURIComponent(searchApplied)}&limit=50`).then((r) => r.data),
//         staleTime: 1000 * 30,
//         select:    (r) => r?.data ?? [],
//     });
//     const merchantSkus = skuData ?? [];

//     return (
//         <div
//             className="fixed inset-0 z-50 flex items-center justify-center p-4"
//             style={{ background: 'rgba(180,195,210,0.5)', backdropFilter: 'blur(3px)' }}
//             onClick={(e) => e.target === e.currentTarget && !confirming && onClose()}
//         >
//             <div
//                 className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden"
//                 style={{ maxWidth: '480px', animation: 'popIn 0.18s ease both' }}
//             >
//                 {/* Header */}
//                 <div className="px-8 py-5 border-b border-surface-border flex items-center justify-between">
//                     <div>
//                         <h2 className="text-base font-bold text-slate-800 font-display">Add Mapping with Store</h2>
//                         <p className="text-xs text-slate-500 mt-0.5">
//                             Product:{' '}
//                             <span className="font-semibold text-primary truncate">{product?.product_name}</span>
//                         </p>
//                     </div>
//                     <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
//                         <X size={18} />
//                     </button>
//                 </div>

//                 {/* Body */}
//                 <div className="px-8 py-4">
//                     <p className="text-xs font-semibold text-slate-600 mb-2">Select Merchant SKU to Link</p>

//                     {/* Search bar */}
//                     <div className="flex gap-2 mb-3">
//                         <div className="relative flex-1">
//                             <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                             <input
//                                 type="text"
//                                 placeholder="Search SKU name..."
//                                 value={search}
//                                 onChange={(e) => setSearch(e.target.value)}
//                                 onKeyDown={(e) => e.key === 'Enter' && setSearchApplied(search.trim())}
//                                 className="w-full pl-8 pr-3 py-2 text-sm border border-surface-border rounded-lg outline-none focus:border-primary"
//                             />
//                         </div>
//                         <button
//                             onClick={() => setSearchApplied(search.trim())}
//                             className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg"
//                         >
//                             Search
//                         </button>
//                     </div>

//                     {/* SKU list */}
//                     <div
//                         className="border border-surface-border rounded-xl overflow-hidden"
//                         style={{ maxHeight: '260px', overflowY: 'auto' }}
//                     >
//                         {isLoading ? (
//                             <div className="flex items-center justify-center h-20 gap-2 text-xs text-slate-400">
//                                 <Loader2 size={14} className="animate-spin text-primary" /> Loading...
//                             </div>
//                         ) : merchantSkus.length === 0 ? (
//                             <div className="flex items-center justify-center h-20 text-sm text-slate-400">
//                                 No merchant SKUs found
//                             </div>
//                         ) : (
//                             <table className="w-full text-sm">
//                                 <tbody className="divide-y divide-surface-border">
//                                     {merchantSkus.map((s) => (
//                                         <tr
//                                             key={s.id}
//                                             onClick={() => setSelectedSkuId(String(s.id))}
//                                             className={`cursor-pointer hover:bg-surface/50 transition-colors ${
//                                                 String(selectedSkuId) === String(s.id) ? 'bg-blue-50' : ''
//                                             }`}
//                                         >
//                                             <td className="py-2.5 pl-4 w-8">
//                                                 <input
//                                                     type="radio"
//                                                     checked={String(selectedSkuId) === String(s.id)}
//                                                     onChange={() => setSelectedSkuId(String(s.id))}
//                                                     className="accent-primary cursor-pointer"
//                                                 />
//                                             </td>
//                                             <td className="py-2.5 pl-3">
//                                                 <img
//                                                     src={s.image_url || 'https://placehold.co/28x28/E6ECF0/004368?text=?'}
//                                                     alt={s.sku_name}
//                                                     className="w-7 h-7 rounded-lg object-cover"
//                                                     onError={(e) => { e.target.src = 'https://placehold.co/28x28/E6ECF0/004368?text=?'; }}
//                                                 />
//                                             </td>
//                                             <td className="py-2.5 px-3">
//                                                 <p className="text-xs font-semibold text-slate-800 font-mono">{s.sku_name}</p>
//                                                 <p className="text-xs text-slate-400 truncate max-w-[220px]">{s.sku_title}</p>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         )}
//                     </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="flex gap-3 px-8 py-5 border-t border-surface-border">
//                     <button
//                         onClick={onClose}
//                         disabled={confirming}
//                         className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card disabled:opacity-50"
//                     >
//                         Cancel
//                     </button>
//                     <button
//                         onClick={() => onConfirm(selectedSkuId)}
//                         disabled={confirming || !selectedSkuId}
//                         className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2"
//                     >
//                         {confirming && <Loader2 size={14} className="animate-spin" />}
//                         {confirming ? 'Mapping...' : 'Confirm Mapping'}
//                     </button>
//                 </div>

//                 <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
//             </div>
//         </div>
//     );
// }

// // ════════════════════════════════════════════════════════════════════════════
// // PAGE
// // ════════════════════════════════════════════════════════════════════════════
// export default function ByProductSKUMappingPage() {
//     const genRef  = useRef(null);
//     const [showGenDrop, setShowGenDrop] = useState(false);

//     useEffect(() => {
//         const handler = (e) => {
//             if (genRef.current && !genRef.current.contains(e.target)) setShowGenDrop(false);
//         };
//         document.addEventListener('mousedown', handler);
//         return () => document.removeEventListener('mousedown', handler);
//     }, []);

//     const { platforms, getStoresForPlatform, warehouses } = useSkuMappingDropdowns();

//     // ── New: Add Mapping from Product hook ──────────────────────────────────
//     const addFromProduct = useAddMappingFromProduct();

//     const {
//         selectedPlatform, handlePlatformChange,
//         selectedStoreId,  handleStoreChange,
//         searchInput, setSearchInput, handleSearch,
//         skuType, setSkuType,
//         mappingStatus, handleTabChange,
//         page, setPage,

//         products, pagination,
//         counts,
//         isLoading, isFetching, isError, error,

//         selectedIds, toggleSelect, toggleAll,
//         allSelected, someSelected,

//         expandedIds, toggleExpand,

//         showSyncResultModal, setShowSyncResultModal,
//         syncResults,
//         handleSyncClick,
//         syncing,

//         showGenModal, setShowGenModal,
//         genWarehouseId, setGenWarehouseId,
//         genWarehouseName, setGenWarehouseName,
//         handleGenerateClick,
//         confirmGenerateSku,
//         generating,

//         showAutoMapModal, setShowAutoMapModal,
//         autoWarehouseId, setAutoWarehouseId,
//         autoWarehouseName, setAutoWarehouseName,
//         handleAutoMapClick,
//         confirmAutoMap,
//         autoMapping,

//         showUnlinkConfirm, setShowUnlinkConfirm,
//         unlinkTarget,
//         openUnlinkConfirm,
//         confirmUnlink,
//         unlinking,
//     } = useByProductMapping();
// console.log(products,"products");

//     const storesForPlatform = getStoresForPlatform(selectedPlatform);

//     const tabsWithCount = TABS.map((t) => ({
//         ...t,
//         displayLabel: `${t.label} (${t.value === 'all' ? counts.all : t.value === 'mapped' ? counts.mapped : counts.unmapped})`,
//     }));

//     return (
//         <div className="space-y-4 font-body">
//             <Topbar PageTitle="SKU Mapping" />

//             {/* ── Filter bar ── */}
//             <div className="bg-white rounded-xl border border-surface-border p-4">
//                 <div className="flex items-end gap-3 flex-wrap">
//                     {/* Select Platform */}
//                     <div className="flex-1 min-w-36">
//                         <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Platform</p>
//                         <div className="relative">
//                             <select
//                                 value={selectedPlatform}
//                                 onChange={(e) => handlePlatformChange(e.target.value)}
//                                 className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
//                             >
//                                 <option value="">Platform Name Here</option>
//                                 {platforms.map((p) => (
//                                     <option key={p.value} value={p.value}>
//                                         {p.label.charAt(0).toUpperCase() + p.label.slice(1)}
//                                     </option>
//                                 ))}
//                             </select>
//                             <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                         </div>
//                     </div>

//                     {/* Select Shop */}
//                     <div className="flex-1 min-w-36">
//                         <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Shop</p>
//                         <div className="relative">
//                             <select
//                                 value={selectedStoreId}
//                                 onChange={(e) => handleStoreChange(e.target.value)}
//                                 disabled={!selectedPlatform}
//                                 className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer disabled:opacity-50"
//                             >
//                                 <option value="">Shop Name Here</option>
//                                 {storesForPlatform.map((s) => (
//                                     <option key={s.value} value={s.value}>{s.label}</option>
//                                 ))}
//                             </select>
//                             <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                         </div>
//                     </div>

//                     {/* SKU Type */}
//                     <div className="relative w-32">
//                         <select
//                             value={skuType}
//                             onChange={(e) => setSkuType(e.target.value)}
//                             className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
//                         >
//                             {SKU_TYPES.map((t) => (
//                                 <option key={t.value} value={t.value}>{t.label}</option>
//                             ))}
//                         </select>
//                         <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                     </div>

//                     {/* Search */}
//                     <div className="flex-1 relative min-w-40">
//                         <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                         <input
//                             type="text"
//                             placeholder="Search"
//                             value={searchInput}
//                             onChange={(e) => setSearchInput(e.target.value)}
//                             onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
//                             className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
//                         />
//                         {isFetching && !isLoading && (
//                             <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
//                         )}
//                     </div>
//                     <button
//                         onClick={handleSearch}
//                         className="px-6 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors whitespace-nowrap"
//                     >
//                         Search
//                     </button>
//                 </div>
//             </div>

//             {/* ── Main Card ── */}
//             <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
//                 <div className="px-5 pt-5 pb-0">
//                     <h2 className="text-base font-bold text-slate-800 font-display mb-4">SKU Mapping by Product</h2>

//                     {/* Action buttons */}
//                     <div className="flex items-center gap-2 mb-3 flex-wrap">
//                         {/* Auto Mapping */}
//                         <button
//                             onClick={handleAutoMapClick}
//                             className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
//                         >
//                             Auto Mapping
//                         </button>

//                         {/* Generate Merchant SKU dropdown */}
//                         <div className="relative" ref={genRef}>
//                             <button
//                                 onClick={() => setShowGenDrop((p) => !p)}
//                                 className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
//                             >
//                                 Generate Merchant SKU
//                                 <ChevronDown size={13} className={`text-slate-400 transition-transform ${showGenDrop ? 'rotate-180' : ''}`} />
//                             </button>
//                             {showGenDrop && (
//                                 <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-44">
//                                     <button
//                                         onClick={() => { handleGenerateClick(); setShowGenDrop(false); }}
//                                         className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors"
//                                     >
//                                         Add Single SKU
//                                     </button>
//                                     <button
//                                         onClick={() => setShowGenDrop(false)}
//                                         className="w-full text-left px-4 py-2 text-sm text-slate-400 cursor-not-allowed"
//                                     >
//                                         Add by Template
//                                     </button>
//                                 </div>
//                             )}
//                         </div>

//                         {/* Sync Product — calls Node.js which calls Java proxy */}
//                         <button
//                             onClick={handleSyncClick}
//                             disabled={syncing}
//                             className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-60"
//                         >
//                             {syncing
//                                 ? <><Loader2 size={13} className="animate-spin text-primary" /> Syncing...</>
//                                 : 'Sync Product'}
//                         </button>

//                         {selectedIds.length > 0 && (
//                             <span className="text-xs text-slate-500 bg-surface-card px-2.5 py-1 rounded-full ml-1">
//                                 {selectedIds.length} selected
//                             </span>
//                         )}
//                     </div>

//                     {/* Tabs */}
//                     <div className="flex items-center gap-5 border-b border-surface-border">
//                         {tabsWithCount.map((tab) => (
//                             <button
//                                 key={tab.value}
//                                 onClick={() => handleTabChange(tab.value)}
//                                 className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative
//                                     ${mappingStatus === tab.value
//                                         ? 'text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
//                                         : 'text-slate-500 hover:text-slate-700'}`}
//                             >
//                                 {tab.displayLabel}
//                             </button>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Table */}
//                 <div className="overflow-x-auto">
//                     {isLoading ? (
//                         <TableSkeleton cols={10} rows={5} />
//                     ) : isError ? (
//                         <div className="flex flex-col items-center py-16 gap-3 text-slate-400">
//                             <AlertCircle size={28} className="text-red-400" />
//                             <p className="text-sm">{error?.response?.data?.message ?? 'Failed to load products'}</p>
//                             <button onClick={() => setPage(1)} className="text-xs text-primary hover:underline">Retry</button>
//                         </div>
//                     ) : (
//                         <table className="w-full text-sm font-body">
//                             <thead>
//                                 <tr className="border-b border-surface-border">
//                                     <th className="py-3 pl-5 w-28 text-left">
//                                         <label className="flex items-center gap-2 cursor-pointer select-none">
//                                             <input
//                                                 type="checkbox"
//                                                 checked={allSelected}
//                                                 ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
//                                                 onChange={toggleAll}
//                                                 className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                                             />
//                                             <span className="text-xs font-semibold text-slate-600">Select All</span>
//                                         </label>
//                                     </th>
//                                     {['Image', 'Product Name', 'Product ID', 'Store Name', 'Parent SKU', 'Variation Name', 'SKU', 'Merchant SKU', 'Actions'].map((h) => (
//                                         <th key={h} className="py-3 pr-4 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">{h}</th>
//                                     ))}
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-surface-border">
//                                 {products.length === 0 ? (
//                                     <EmptyState message="No platform products found — try Sync Product" colSpan={10} />
//                                 ) : (
//                                     products.map((p) => {
//                                         const isSelected = selectedIds.includes(p.id);
//                                         const isExpanded = expandedIds.includes(p.id);
//                                         const isMapped   = !!p.is_mapped;
//                                         const isParent   = p.row_type === 'parent';

//                                         return (
//                                             <>
//                                                 <tr
//                                                     key={p.id}
//                                                     className={`transition-colors hover:bg-surface/50 ${isSelected ? 'bg-blue-50/40' : ''} ${isParent ? 'bg-slate-50/60 font-medium' : ''}`}
//                                                 >
//                                                     {/* Checkbox */}
//                                                     <td className="pl-5 py-3">
//                                                         <div className="flex items-center gap-2">
//                                                             <input
//                                                                 type="checkbox"
//                                                                 checked={isSelected}
//                                                                 onChange={() => toggleSelect(p.id)}
//                                                                 className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
//                                                             />
//                                                             {isParent && (
//                                                                 <button
//                                                                     onClick={() => toggleExpand(p.id)}
//                                                                     className="text-slate-400 hover:text-slate-600 transition-colors"
//                                                                 >
//                                                                     <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
//                                                                 </button>
//                                                             )}
//                                                         </div>
//                                                     </td>
//                                                     {/* Image */}
//                                                     <td className="py-3 pr-4">
//                                                         <img
//                                                             src={p.image_url || 'https://placehold.co/36x36/E6ECF0/004368?text=?'}
//                                                             alt={p.product_name}
//                                                             className="w-9 h-9 rounded-lg object-cover"
//                                                             onError={(e) => { e.target.src = 'https://placehold.co/36x36/E6ECF0/004368?text=?'; }}
//                                                         />
//                                                     </td>
//                                                     {/* Product Name */}
//                                                     <td className="py-3 pr-4 text-slate-700 max-w-[180px]">
//                                                         <p className="truncate text-sm" title={p.product_name}>{p.product_name}</p>
//                                                         <p className="text-xs text-slate-400 mt-0.5">{p.platform?.toUpperCase()}</p>
//                                                     </td>
//                                                     {/* Product ID */}
//                                                     <td className="py-3 pr-4 font-mono text-xs text-slate-500">
//                                                         {p.platform_product_id}
//                                                     </td>
//                                                     {/* Store Name */}
//                                                     <td className="py-3 pr-4 text-slate-600 text-xs">{p.store_name ?? '—'}</td>
//                                                     {/* Parent SKU */}
//                                                     <td className="py-3 pr-4 font-mono text-xs text-slate-600">{p.parent_sku ?? '—'}</td>
//                                                     {/* Variation Name */}
//                                                     <td className="py-3 pr-4 text-slate-600 text-xs">{p.variation_name ?? '—'}</td>
//                                                     {/* Seller SKU */}
//                                                     <td className="py-3 pr-4 font-mono text-xs text-slate-600">{p.seller_sku ?? '—'}</td>
//                                                     {/* Merchant SKU */}
//                                                     <td className="py-3 pr-4 font-mono text-xs">
//                                                         {p.merchant_sku
//                                                             ? <span className="text-primary font-semibold">{p.merchant_sku.sku_name}</span>
//                                                             : <span className="text-slate-300">—</span>}
//                                                     </td>
//                                                     {/* Action */}
//                                                     <td className="py-3 pr-5">
//                                                         {isMapped ? (
//                                                             <button
//                                                                 onClick={() => openUnlinkConfirm(p)}
//                                                                 title="Unlink mapping"
//                                                                 className="p-1 rounded text-primary hover:text-red-500 hover:bg-red-50 transition-colors"
//                                                             >
//                                                                 <Unlink size={14} />
//                                                             </button>
//                                                         ) : (
//                                                             // ── CHANGED: was silent MappingActionBtn, now opens AddMappingFromProductModal ──
//                                                             <UnmappedActionDropdown
//                                                                 product={p}
//                                                                 onAddMapping={() => addFromProduct.openModal(p)}
//                                                             />
//                                                         )}
//                                                     </td>
//                                                 </tr>
//                                             </>
//                                         );
//                                     })
//                                 )}
//                             </tbody>
//                         </table>
//                     )}
//                 </div>

//                 <Pagination
//                     page={page}
//                     totalPages={pagination.totalPages}
//                     total={pagination.total}
//                     limit={pagination.limit}
//                     onPageChange={setPage}
//                 />

//                 {/* Footer */}
//                 <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
//                     <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors">
//                         Export <ChevronDown size={13} className="text-slate-400" />
//                     </button>
//                     <button className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">
//                         Print
//                     </button>
//                 </div>
//             </div>

//             {/* ── Generate Merchant SKU Modal ── */}
//             {showGenModal && (
//                 <div
//                     className="fixed inset-0 z-50 flex items-center justify-center p-4"
//                     style={{ background: 'rgba(200,210,220,0.55)', backdropFilter: 'blur(3px)' }}
//                     onClick={(e) => e.target === e.currentTarget && !generating && setShowGenModal(false)}
//                 >
//                     <div className="bg-white rounded-2xl shadow-xl w-full font-body p-8 text-center" style={{ maxWidth: '380px', animation: 'popIn 0.18s ease both' }}>
//                         <h2 className="text-lg font-bold text-slate-800 font-display mb-2">Generate Merchant SKU?</h2>
//                         <p className="text-sm text-slate-500 mb-1">
//                             A unique SKU will be created for{' '}
//                             <span className="font-semibold text-primary">{selectedIds.length} selected product(s)</span>.
//                         </p>
//                         <p className="text-xs text-slate-400 mb-5">Stock will be initialised in the selected warehouse.</p>

//                         <div className="mb-5">
//                             <WarehouseSelect
//                                 warehouses={warehouses}
//                                 value={genWarehouseId}
//                                 onChange={(id, label) => { setGenWarehouseId(id); setGenWarehouseName(label); }}
//                                 required
//                             />
//                         </div>

//                         <div className="flex gap-3">
//                             <button
//                                 onClick={() => setShowGenModal(false)}
//                                 disabled={generating}
//                                 className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card disabled:opacity-50"
//                             >Cancel</button>
//                             <button
//                                 onClick={confirmGenerateSku}
//                                 disabled={generating}
//                                 className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2"
//                             >
//                                 {generating && <Loader2 size={14} className="animate-spin" />}
//                                 {generating ? 'Generating...' : 'Generate SKU'}
//                             </button>
//                         </div>
//                     </div>
//                     <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
//                 </div>
//             )}

//             {/* ── Auto Mapping Modal ── */}
//             {showAutoMapModal && (
//                 <div
//                     className="fixed inset-0 z-50 flex items-center justify-center p-4"
//                     style={{ background: 'rgba(200,210,220,0.55)', backdropFilter: 'blur(3px)' }}
//                     onClick={(e) => e.target === e.currentTarget && !autoMapping && setShowAutoMapModal(false)}
//                 >
//                     <div className="bg-white rounded-2xl shadow-xl w-full font-body p-8 text-center" style={{ maxWidth: '400px', animation: 'popIn 0.18s ease both' }}>
//                         <h2 className="text-lg font-bold text-slate-800 font-display mb-2">Auto Mapping</h2>
//                         <p className="text-sm text-slate-500 mb-1">
//                             {selectedIds.length > 0
//                                 ? <><span className="font-semibold text-primary">{selectedIds.length} selected product(s)</span> will be auto-mapped.</>
//                                 : 'All unmapped products will be auto-mapped by matching seller SKU → merchant SKU name.'}
//                         </p>
//                         <p className="text-xs text-slate-400 mb-5">Stock quantity will be updated on the platform after mapping.</p>

//                         <div className="mb-5">
//                             <WarehouseSelect
//                                 warehouses={warehouses}
//                                 value={autoWarehouseId}
//                                 onChange={(id, label) => { setAutoWarehouseId(id); setAutoWarehouseName(label); }}
//                                 required
//                             />
//                         </div>

//                         <div className="flex gap-3">
//                             <button
//                                 onClick={() => setShowAutoMapModal(false)}
//                                 disabled={autoMapping}
//                                 className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card disabled:opacity-50"
//                             >Cancel</button>
//                             <button
//                                 onClick={confirmAutoMap}
//                                 disabled={autoMapping}
//                                 className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2"
//                             >
//                                 {autoMapping && <Loader2 size={14} className="animate-spin" />}
//                                 {autoMapping ? 'Mapping...' : 'Auto Map'}
//                             </button>
//                         </div>
//                     </div>
//                     <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
//                 </div>
//             )}

//             {/* ── Sync Results Modal ── */}
//             {showSyncResultModal && (
//                 <div
//                     className="fixed inset-0 z-50 flex items-center justify-center p-4"
//                     style={{ background: 'rgba(200,210,220,0.55)', backdropFilter: 'blur(3px)' }}
//                     onClick={(e) => e.target === e.currentTarget && setShowSyncResultModal(false)}
//                 >
//                     <div className="bg-white rounded-2xl shadow-xl w-full font-body p-8 text-center" style={{ maxWidth: '400px', animation: 'popIn 0.18s ease both' }}>
//                         <h2 className="text-lg font-bold text-slate-800 font-display mb-1">Synchronize results</h2>
//                         <p className="text-sm font-semibold text-emerald-600 mb-4">Synchronize completed</p>
//                         <div className="text-left bg-surface rounded-xl p-4 mb-5 space-y-2 max-h-48 overflow-y-auto">
//                             <p className="text-xs font-bold text-slate-700 mb-2">Updates of store with quantity</p>
//                             {syncResults?.length > 0 ? (
//                                 syncResults.map((r, i) => (
//                                     <p key={i} className="text-sm text-slate-600">
//                                         <span className="font-medium">{r.storeName}</span>
//                                         {' '}({r.synced} product{r.synced !== 1 ? 's' : ''} updated)
//                                         {r.error && <span className="text-red-500 ml-1 text-xs">— {r.error}</span>}
//                                     </p>
//                                 ))
//                             ) : (
//                                 <p className="text-sm text-slate-400">No stores synced</p>
//                             )}
//                         </div>
//                         <button
//                             onClick={() => setShowSyncResultModal(false)}
//                             className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white transition-colors"
//                         >Close</button>
//                     </div>
//                     <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
//                 </div>
//             )}

//             {/* ── Unlink Confirm ── */}
//             {showUnlinkConfirm && unlinkTarget && (
//                 <ConfirmModal
//                     title="Remove Mapping"
//                     message={`Unmap "${unlinkTarget.merchant_sku?.sku_name ?? ''}" from this product? The product will return to unmapped status.`}
//                     confirmLabel={unlinking ? 'Removing...' : 'Unlink'}
//                     confirmClass="bg-red-500 hover:bg-red-600 text-white"
//                     loading={unlinking}
//                     onCancel={() => setShowUnlinkConfirm(false)}
//                     onConfirm={confirmUnlink}
//                 />
//             )}

//             {/* ── Add Mapping from Product Modal ── */}
//             {addFromProduct.showModal && (
//                 <AddMappingFromProductModal
//                     product={addFromProduct.targetProduct}
//                     onClose={() => addFromProduct.setShowModal(false)}
//                     onConfirm={addFromProduct.confirmMapping}
//                     confirming={addFromProduct.confirming}
//                 />
//             )}
//         </div>
//     );
// }



import { Fragment, useEffect, useState, useCallback } from 'react';
import {
    Search, ChevronDown, Loader2, AlertCircle,
    Unlink, Link2, X, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import Topbar                        from '../../../../components/layout/Topbar';
import { useByProductMapping }       from '../hooks/useByProductMapping';
import { useSkuMappingDropdowns }    from '../hooks/useSkuMappingDropdowns';
import { useAddMappingFromProduct }  from '../hooks/useAddMappingFromProduct';
import WarehouseSelect               from '../components/WarehouseSelect';
import ConfirmModal                  from '../components/ConfirmModal';
import { TableSkeleton, EmptyState } from '../components/TableHelpers';
import Pagination                    from '../../../../components/shared/Pagination';
import ExportMenu                    from '../../../../components/shared/ExportMenu';
import api                           from '../../../../lib/api';
import { toast } from 'sonner';
import { exportRowsToCsv, exportRowsToXlsx, printRows } from '../../../../utils/tableOutput';

const TABS = [
    { label: 'All',      value: 'all'      },
    { label: 'Unmapped', value: 'unmapped' },
    { label: 'Mapped',   value: 'mapped'   },
];

const SKU_TYPES = [
    { label: 'Product Name', value: 'product_name'        },
    { label: 'SKU',          value: 'seller_sku'          },
    { label: 'Product ID',   value: 'platform_product_id' },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function ByProductSKUMappingPage() {
    const { platforms, getStoresForPlatform, warehouses } = useSkuMappingDropdowns();
    const addFromProduct = useAddMappingFromProduct();

    // ── Sync modal state ──────────────────────────────────────────────────────
    const [showSyncModal, setShowSyncModal]   = useState(false);
    const [syncPlatform,  setSyncPlatform]    = useState('');   // '' = all
    const [syncStoreId,   setSyncStoreId]     = useState('');

    const {
        selectedPlatform, handlePlatformChange,
        selectedStoreId,  handleStoreChange,
        searchInput, setSearchInput, handleSearch,
        skuType, setSkuType,
        mappingStatus, handleTabChange,
        page, setPage,
        products, pagination,
        counts,
        isLoading, isFetching, isError, error,
        selectedIds, toggleSelect, toggleAll,
        allSelected, someSelected,
        expandedIds, toggleExpand,
        showSyncResultModal, setShowSyncResultModal,
        syncResults,
        handleSyncClick,
        syncing,
        showGenModal, setShowGenModal,
        genWarehouseId, setGenWarehouseId,
        setGenWarehouseName,
        confirmGenerateSku,
        generating,
        showAutoMapModal, setShowAutoMapModal,
        autoModalPlatform, setAutoModalPlatform,
        autoModalStoreIds, setAutoModalStoreIds,
        handleAutoMapClick,
        confirmAutoMap,
        autoMappingResult, setAutoMappingResult,
        autoMapping,
        showUnlinkConfirm, setShowUnlinkConfirm,
        unlinkTarget,
        openUnlinkConfirm,
        confirmUnlink,
        unlinking,
    } = useByProductMapping();

    const storesForPlatform     = getStoresForPlatform(selectedPlatform);
    const syncModalStores       = getStoresForPlatform(syncPlatform);
    const autoModalStores       = getStoresForPlatform(autoModalPlatform);

    const tabsWithCount = TABS.map((t) => ({
        ...t,
        displayLabel: `${t.label} (${
            t.value === 'all' ? counts.all
            : t.value === 'mapped' ? counts.mapped
            : counts.unmapped
        })`,
    }));
    const selectedRows = products
        .flatMap((product) => (product.children ?? product.skus ?? product.items ?? []).map((child) => ({ ...child, parentProduct: product })))
        .filter((child) => selectedIds.includes(child.id));
    const outputColumns = [
        { label: 'Product Name', render: (row) => row.parentProduct?.product_name ?? row.parentProduct?.name ?? row.product_name ?? '' },
        { label: 'Seller SKU', render: (row) => row.seller_sku ?? row.sku ?? row.sku_name ?? '' },
        { label: 'Product ID', render: (row) => row.platform_product_id ?? row.product_id ?? row.parentProduct?.platform_product_id ?? '' },
        { label: 'Merchant SKU', render: (row) => row.merchant_sku?.sku_name ?? row.merchantSku?.sku_name ?? '' },
        { label: 'Status', render: (row) => row.mapping_status ?? row.status ?? '' },
    ];

    // "Generate Merchant SKU" works from selected child/variant rows only. No platform filter is required.
    const handleGenerateBtnClick = () => {
        if (!selectedIds.length) {
            toast.error('Select at least one platform product SKU/variant first');
            return;
        }
        setGenWarehouseId('');
        setShowGenModal(true);
    };

    const openSyncModal = () => {
        setSyncPlatform(selectedPlatform || '');
        setSyncStoreId(selectedStoreId  || '');
        setShowSyncModal(true);
    };

    const confirmSync = () => {
        handleSyncClick(syncPlatform || undefined, syncStoreId || undefined);
        setShowSyncModal(false);
    };

    const handleParentSelect = useCallback((parentId, children) => {
        const childIds = children.map((child) => child.id);
        if (!childIds.length) return;

        const allChildrenSelected = childIds.every((id) => selectedIds.includes(id));
        childIds.forEach((id) => {
            const isSelected = selectedIds.includes(id);
            if (allChildrenSelected ? isSelected : !isSelected) {
                toggleSelect(id);
            }
        });

        if (!allChildrenSelected && !expandedIds.includes(parentId)) {
            toggleExpand(parentId);
        }
    }, [expandedIds, selectedIds, toggleExpand, toggleSelect]);

    return (
        <div className="space-y-4 font-body">
            <Topbar PageTitle="SKU Mapping" />

            {/* ── Filter bar ── */}
            <div className="bg-white rounded-xl border border-surface-border p-4">
                <div className="flex items-end gap-3 flex-wrap">
                    <div className="flex-1 min-w-36">
                        <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Platform</p>
                        <div className="relative">
                            <select
                                value={selectedPlatform}
                                onChange={(e) => handlePlatformChange(e.target.value)}
                                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
                            >
                                <option value="">All Platforms</option>
                                {platforms.map((p) => (
                                    <option key={p.value} value={p.value}>
                                        {p.label.charAt(0).toUpperCase() + p.label.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-36">
                        <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Shop</p>
                        <div className="relative">
                            <select
                                value={selectedStoreId}
                                onChange={(e) => handleStoreChange(e.target.value)}
                                disabled={!selectedPlatform}
                                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                            >
                                <option value="">All Shops</option>
                                {storesForPlatform.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="relative w-36">
                        <select
                            value={skuType}
                            onChange={(e) => {
                                setSkuType(e.target.value);
                                setPage(1);
                            }}
                            className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
                        >
                            {SKU_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="flex-1 relative min-w-40">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search product name / SKU / ID"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                        {isFetching && !isLoading && (
                            <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
                        )}
                    </div>
                    <button onClick={handleSearch} className="px-6 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors whitespace-nowrap">
                        Search
                    </button>
                </div>
            </div>

            {/* ── Main Card ── */}
            <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
                <div className="px-5 pt-5 pb-0">
                    <h2 className="text-base font-bold text-slate-800 font-display mb-4">SKU Mapping by Product</h2>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {/* Auto Mapping */}
                        <button
                            onClick={handleAutoMapClick}
                            className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
                        >
                            Auto Mapping
                        </button>

                        {/* Generate Merchant SKU — single button, no dropdown */}
                        <button
                            onClick={handleGenerateBtnClick}
                            className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
                        >
                            Generate Merchant SKU
                        </button>

                        {/* Sync Product — opens platform/store modal */}
                        <button
                            onClick={openSyncModal}
                            disabled={syncing}
                            className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-60"
                        >
                            {syncing
                                ? <><Loader2 size={13} className="animate-spin text-primary" /> Syncing...</>
                                : <><RefreshCw size={13} /> Sync Product</>}
                        </button>

                        {selectedIds.length > 0 && (
                            <span className="text-xs text-slate-500 bg-surface-card px-2.5 py-1 rounded-full ml-1">
                                {selectedIds.length} selected
                            </span>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-5 border-b border-surface-border">
                        {tabsWithCount.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => handleTabChange(tab.value)}
                                className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative
                                    ${mappingStatus === tab.value
                                        ? 'text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                                        : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab.displayLabel}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <TableSkeleton cols={10} rows={5} />
                    ) : isError ? (
                        <div className="flex flex-col items-center py-16 gap-3 text-slate-400">
                            <AlertCircle size={28} className="text-red-400" />
                            <p className="text-sm">{error?.response?.data?.message ?? 'Failed to load products'}</p>
                            <button onClick={() => setPage(1)} className="text-xs text-primary hover:underline">Retry</button>
                        </div>
                    ) : (
                        <table className="w-full text-sm font-body">
                            <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                                <tr className="border-b border-surface-border">
                                    <th className="py-3 pl-5 w-28 text-left">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                                onChange={toggleAll}
                                                className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                                            />
                                            <span className="text-sm font-bold text-slate-800">Select All</span>
                                        </label>
                                    </th>
                                    {['Image', 'Product Name', 'Product ID', 'Store Name', 'Parent SKU', 'Variation Name', 'SKU', 'Merchant SKU', 'Actions'].map((h) => (
                                        <th key={h} className="py-3 pr-4 text-left text-sm font-bold text-slate-800 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {products.length === 0 ? (
                                    <EmptyState message="No platform products found — try Sync Product" colSpan={10} />
                                ) : (
                                    products.map((p) => {
                                        const isExpanded = expandedIds.includes(p.id);
                                        const children = p.children ?? [];
                                        const mappedCount = p.mapping_count ?? children.filter((c) => c.is_mapped).length;
                                        const childIds = children.map((child) => child.id);
                                        const allChildrenSelected = childIds.length > 0 && childIds.every((id) => selectedIds.includes(id));
                                        const someChildrenSelected = childIds.some((id) => selectedIds.includes(id));
                                        return (
                                            <Fragment key={p.id}>
                                                <tr className="transition-colors hover:bg-surface/50 bg-slate-50/70 font-medium">
                                                    <td className="pl-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={allChildrenSelected}
                                                                ref={(el) => {
                                                                    if (el) el.indeterminate = someChildrenSelected && !allChildrenSelected;
                                                                }}
                                                                onChange={() => handleParentSelect(p.id, children)}
                                                                disabled={!childIds.length}
                                                                title="Select all child SKUs"
                                                                className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                            />
                                                            
                                                        </div>
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <img
                                                            src={p.image_url || 'https://placehold.co/36x36/E6ECF0/004368?text=?'}
                                                            alt={p.product_name}
                                                            className="w-9 h-9 rounded-lg object-cover"
                                                            onError={(e) => { e.target.src = 'https://placehold.co/36x36/E6ECF0/004368?text=?'; }}
                                                        />
                                                    </td>
                                                    <td className="py-3 pr-4 text-slate-700 max-w-[220px]">
                                                        <p className="truncate text-sm font-semibold" title={p.product_name}>{p.product_name}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">{p.platform?.toUpperCase()} · {children.length} variant SKU(s)</p>
                                                    </td>
                                                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">{p.platform_product_id}</td>
                                                    <td className="py-3 pr-4 text-slate-600 text-xs">{p.store_name ?? '—'}</td>
                                                    <td className="py-3 pr-4 font-mono text-xs text-slate-600">{p.parent_sku ?? '—'}</td>
                                                    <td className="py-3 pr-4 text-slate-400 text-xs">—</td>
                                                    <td className="py-3 pr-4 text-slate-400 text-xs">—</td>
                                                    <td className="py-3 pr-4 text-xs">
                                                        {mappedCount > 0
                                                            ? <span className="text-primary font-semibold">{mappedCount} mapped</span>
                                                            : <span className="text-slate-300">—</span>}
                                                    </td>
                                                    <td className="py-3 pr-5">
                                                        <button
                                                            onClick={() => toggleExpand(p.id)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-surface-card transition-colors"
                                                            title={isExpanded ? 'Hide child SKUs' : 'Show child SKUs'}
                                                        >
                                                            <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    </td>
                                                </tr>

                                                {isExpanded && children.map((child) => {
                                                    const isSelected = selectedIds.includes(child.id);
                                                    const isMapped = !!child.is_mapped;
                                                    return (
                                                        <tr key={child.id} className={`transition-colors hover:bg-surface/50 ${isSelected ? 'bg-blue-50/40' : ''}`}>
                                                            <td className="pl-10 py-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleSelect(child.id)}
                                                                    className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                                                                />
                                                            </td>
                                                            <td className="py-3 pr-4">
                                                                <img
                                                                    src={child.image_url || p.image_url || 'https://placehold.co/36x36/E6ECF0/004368?text=?'}
                                                                    alt={child.product_name}
                                                                    className="w-9 h-9 rounded-lg object-cover"
                                                                    onError={(e) => { e.target.src = 'https://placehold.co/36x36/E6ECF0/004368?text=?'; }}
                                                                />
                                                            </td>
                                                            <td className="py-3 pr-4 text-slate-700 max-w-[180px]">
                                                                <p className="truncate text-sm" title={child.product_name}>{child.product_name}</p>
                                                                <p className="text-xs text-slate-400 mt-0.5">{child.platform?.toUpperCase()} variant</p>
                                                            </td>
                                                            <td className="py-3 pr-4 font-mono text-xs text-slate-500">{child.platform_product_id}</td>
                                                            <td className="py-3 pr-4 text-slate-600 text-xs">{child.store_name ?? p.store_name ?? '—'}</td>
                                                            <td className="py-3 pr-4 font-mono text-xs text-slate-600">{child.parent_sku ?? p.parent_sku ?? '—'}</td>
                                                            <td className="py-3 pr-4 text-slate-600 text-xs">{child.variation_name ?? '—'}</td>
                                                            <td className="py-3 pr-4 font-mono text-xs text-slate-600">{child.seller_sku ?? '—'}</td>
                                                            <td className="py-3 pr-4 font-mono text-xs">
                                                                {child.merchant_sku
                                                                    ? <span className="text-primary font-semibold">{child.merchant_sku.sku_name}</span>
                                                                    : <span className="text-slate-300">—</span>}
                                                            </td>
                                                            <td className="py-3 pr-5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        onClick={() => addFromProduct.openModal(child)}
                                                                        title={isMapped ? 'Change mapped Merchant SKU' : 'Map with Merchant SKU'}
                                                                        className={`p-1.5 rounded-lg transition-colors ${isMapped ? 'text-primary hover:bg-blue-50' : 'text-slate-300 hover:text-primary hover:bg-blue-50'}`}
                                                                    >
                                                                        <Link2 size={15} />
                                                                    </button>
                                                                    {isMapped && (
                                                                        <button
                                                                            onClick={() => openUnlinkConfirm(child)}
                                                                            title="Unlink mapping"
                                                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                                        >
                                                                            <Unlink size={15} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </Fragment>
                                        );
                                    })                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <Pagination page={page} totalPages={pagination.totalPages} total={pagination.total} limit={pagination.limit} onPageChange={setPage} />

                <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
                    <ExportMenu
                        onExportCsv={() => exportRowsToCsv(selectedRows, outputColumns, 'sku-mapping-by-product.csv', 'SKU mapping')}
                        onExportXlsx={() => exportRowsToXlsx(selectedRows, outputColumns, 'sku-mapping-by-product.xlsx', 'SKU mapping')}
                    />
                    <button onClick={() => printRows(selectedRows, outputColumns, 'SKU Mapping By Product', 'SKU mapping')} className="px-16 py-2.5 text-base font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">Print</button>
                </div>
            </div>

            {/* ══════════════════ Sync Product Modal ══════════════════ */}
            {showSyncModal && (
                <Modal onClose={() => !syncing && setShowSyncModal(false)}>
                    <div className="px-8 py-5 border-b border-surface-border">
                        <h2 className="text-base font-bold text-slate-800 font-display">Sync Products</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Choose which platform and store to sync, or leave blank to sync all.</p>
                    </div>
                    <div className="px-8 py-6 space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-slate-600 mb-1.5">Platform <span className="text-slate-400 font-normal">(optional — blank = all)</span></p>
                            <div className="relative">
                                <select
                                    value={syncPlatform}
                                    onChange={(e) => { setSyncPlatform(e.target.value); setSyncStoreId(''); }}
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
                        <div>
                            <p className="text-xs font-semibold text-slate-600 mb-1.5">Store <span className="text-slate-400 font-normal">(optional — blank = all stores)</span></p>
                            <div className="relative">
                                <select
                                    value={syncStoreId}
                                    onChange={(e) => setSyncStoreId(e.target.value)}
                                    disabled={!syncPlatform}
                                    className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary disabled:opacity-50"
                                >
                                    <option value="">All Stores</option>
                                    {syncModalStores.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <p className="text-xs text-amber-700">
                                {syncPlatform
                                    ? `Will sync ${syncStoreId ? 'selected store' : 'all stores'} on ${syncPlatform.charAt(0).toUpperCase() + syncPlatform.slice(1)}.`
                                    : 'Will sync ALL platforms and ALL stores. This may take a moment.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 px-8 pb-8">
                        <button onClick={() => setShowSyncModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card">Cancel</button>
                        <button onClick={confirmSync} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-2">
                            <RefreshCw size={14} /> Confirm Sync
                        </button>
                    </div>
                </Modal>
            )}

            {/* ══════════════════ Generate SKU Modal ══════════════════ */}
            {showGenModal && (
                <Modal onClose={() => !generating && setShowGenModal(false)}>
                    <div className="px-8 pt-8 pb-6 text-center">
                        <h2 className="text-lg font-bold text-slate-800 font-display mb-2">Generate Merchant SKU</h2>
                        <p className="text-sm text-slate-500 mb-1">
                            A unique merchant SKU will be auto-created for{' '}
                            <span className="font-semibold text-primary">{selectedIds.length} selected product(s)</span>{' '}
                            from the selected platform product SKU rows.
                        </p>
                        <p className="text-xs text-slate-400 mb-5">SKU name will be exactly the child/variant seller SKU. No platform prefix, warehouse suffix, SP, or WH text will be added. Mapping to the selected store product is created automatically and marked synced.</p>
                        <div className="mb-6 text-left">
                            <WarehouseSelect
                                warehouses={warehouses}
                                value={genWarehouseId}
                                onChange={(id, label) => { setGenWarehouseId(id); setGenWarehouseName(label); }}
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowGenModal(false)} disabled={generating} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 disabled:opacity-50">Cancel</button>
                            <button onClick={confirmGenerateSku} disabled={generating} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2">
                                {generating && <Loader2 size={14} className="animate-spin" />}
                                {generating ? 'Generating...' : 'Generate SKU'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ══════════════════ Auto Mapping Modal ══════════════════ */}
            {showAutoMapModal && (
                <Modal onClose={() => !autoMapping && setShowAutoMapModal(false)} maxWidth="460px">
                    <div className="px-8 pt-8 pb-2">
                        <h2 className="text-base font-bold text-slate-800 font-display mb-1">Auto Mapping</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            {selectedIds.length > 0
                                ? <><span className="font-semibold text-primary">{selectedIds.length} selected product(s)</span> will be auto-mapped to matching merchant SKUs by exact child/variant seller SKU.</>
                                : 'All unmapped platform product variants will be auto-mapped when an already-created merchant SKU can be found by exact child/variant seller SKU.'}
                        </p>

                        {/* Platform selector */}
                        <div className="mb-3">
                            <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Platform <span className="text-slate-400 font-normal">(optional)</span></p>
                            <div className="relative">
                                <select
                                    value={autoModalPlatform}
                                    onChange={(e) => { setAutoModalPlatform(e.target.value); setAutoModalStoreIds([]); }}
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

                        {/* Store selector */}
                        <div className="mb-4">
                            <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Store <span className="text-slate-400 font-normal">(optional)</span></p>
                            <div className="relative">
                                <div className="max-h-40 overflow-y-auto rounded-lg border border-surface-border bg-white p-2">
                                    {autoModalStores.length === 0 ? (
                                        <p className="px-2 py-2 text-xs text-slate-400">Select a platform to choose stores, or leave blank for selected/all products</p>
                                    ) : autoModalStores.map((s) => (
                                        <label key={s.value} className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-600 rounded-md hover:bg-slate-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={autoModalStoreIds.includes(String(s.value))}
                                                onChange={(e) => {
                                                    const id = String(s.value);
                                                    setAutoModalStoreIds((prev) => e.target.checked
                                                        ? [...prev, id]
                                                        : prev.filter((x) => x !== id)
                                                    );
                                                }}
                                                disabled={!autoModalPlatform}
                                                className="rounded border-surface-border text-primary focus:ring-primary"
                                            />
                                            <span>{s.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                            <p className="text-xs text-blue-700">Auto Mapping does not create new merchant SKUs. It only maps platform variants that already have a generated merchant SKU, using selected rows when checked or all unmapped rows when nothing is selected.</p>
                        </div>

                        {/* Auto-mapping result */}
                        {autoMappingResult && (
                            <div className="mb-4 rounded-xl border border-surface-border overflow-hidden">
                                <div className="bg-surface-card px-4 py-2 border-b border-surface-border flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    <p className="text-xs font-bold text-slate-700">Mapping Results</p>
                                </div>
                                <div className="max-h-44 overflow-y-auto divide-y divide-surface-border">
                                    {autoMappingResult.mapped?.length > 0 && autoMappingResult.mapped.map((m, i) => (
                                        <div key={i} className="flex items-center gap-2 px-4 py-2">
                                            <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                                            <p className="text-xs text-slate-700 truncate">{m.productName ?? m.sellerSku}</p>
                                            <span className="ml-auto text-xs text-emerald-600 font-semibold">Mapped</span>
                                        </div>
                                    ))}
                                    {autoMappingResult.failed?.length > 0 && autoMappingResult.failed.map((f, i) => (
                                        <div key={i} className="flex items-start gap-2 px-4 py-2">
                                            <XCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-slate-700 truncate">{f.productName ?? f.sellerSku}</p>
                                                <p className="text-xs text-slate-400">{f.reason}</p>
                                            </div>
                                            <span className="ml-auto text-xs text-red-500 font-semibold whitespace-nowrap">Failed</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pb-8">
                            <button onClick={() => { setShowAutoMapModal(false); setAutoMappingResult(null); }} disabled={autoMapping} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 disabled:opacity-50">
                                {autoMappingResult ? 'Close' : 'Cancel'}
                            </button>
                            {!autoMappingResult && (
                                <button onClick={confirmAutoMap} disabled={autoMapping} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2">
                                    {autoMapping && <Loader2 size={14} className="animate-spin" />}
                                    {autoMapping ? 'Mapping...' : 'Auto Map'}
                                </button>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {/* ══════════════════ Sync Result Modal ══════════════════ */}
            {showSyncResultModal && (
                <Modal onClose={() => setShowSyncResultModal(false)} maxWidth="400px">
                    <div className="px-8 py-8 text-center">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 size={24} className="text-emerald-600" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 font-display mb-1">Synchronize Results</h2>
                        <p className="text-sm font-semibold text-emerald-600 mb-4">Sync completed</p>
                        <div className="text-left bg-surface rounded-xl p-4 mb-5 space-y-2 max-h-48 overflow-y-auto">
                            <p className="text-xs font-bold text-slate-700 mb-2">Updates per store</p>
                            {syncResults?.length > 0 ? (
                                syncResults.map((r, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        {r.error
                                            ? <XCircle size={12} className="text-red-400 flex-shrink-0" />
                                            : <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />}
                                        <p className="text-sm text-slate-600">
                                            <span className="font-medium">{r.storeName}</span>
                                            {' '}({r.synced ?? 0} product{r.synced !== 1 ? 's' : ''} updated)
                                            {r.error && <span className="text-red-500 ml-1 text-xs">— {r.error}</span>}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400">No stores synced</p>
                            )}
                        </div>
                        <button onClick={() => setShowSyncResultModal(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white">Close</button>
                    </div>
                </Modal>
            )}

            {/* ══════════════════ Add Mapping from Product Modal ══════════════════ */}
            {addFromProduct.showModal && (
                <AddMappingFromProductModal
                    product={addFromProduct.targetProduct}
                    onClose={() => addFromProduct.setShowModal(false)}
                    onConfirm={addFromProduct.confirmMapping}
                    confirming={addFromProduct.confirming}
                />
            )}

            {/* ══════════════════ Unlink Confirm ══════════════════ */}
            {showUnlinkConfirm && unlinkTarget && (
                <ConfirmModal
                    title="Remove Mapping"
                    message={`Unmap "${unlinkTarget.merchant_sku?.sku_name ?? ''}" from this product? The product will return to unmapped status.`}
                    confirmLabel={unlinking ? 'Removing...' : 'Unlink'}
                    confirmClass="bg-red-500 hover:bg-red-600 text-white"
                    loading={unlinking}
                    onCancel={() => setShowUnlinkConfirm(false)}
                    onConfirm={confirmUnlink}
                />
            )}

            <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Modal wrapper
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ children, onClose, maxWidth = '420px' }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(180,195,210,0.5)', backdropFilter: 'blur(3px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden" style={{ maxWidth, animation: 'popIn 0.18s ease both' }}>
                {children}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Mapping from Product modal (blue/grey link icon click)
// ─────────────────────────────────────────────────────────────────────────────
function AddMappingFromProductModal({ product, onClose, onConfirm, confirming }) {
    const [search,        setSearch]        = useState('');
    const [searchApplied, setSearchApplied] = useState('');
    const [selectedSkuId, setSelectedSkuId] = useState('');
    const [showConfirm,   setShowConfirm]   = useState(false);

    const { data: optionData, isLoading } = useQuery({
        queryKey: ['product-merchant-sku-options', product?.id, searchApplied],
        enabled: !!product?.id,
        queryFn: () => {
            const qs = new URLSearchParams();
            if (searchApplied) qs.set('search', searchApplied);
            return api.get(`/platform-products/${product.id}/merchant-sku-options?${qs.toString()}`).then((r) => r.data?.data ?? r.data);
        },
        staleTime: 1000 * 20,
    });

    useEffect(() => {
        if (optionData && optionData.canMap === false) {
            toast.error(optionData.message || 'First generate Merchant SKU for this platform SKU');
            onClose();
        }
    }, [optionData, onClose]);

    const currentSku = optionData?.currentMerchantSku ?? product?.merchant_sku ?? null;
    const generatedSku = optionData?.generatedMerchantSku ?? product?.generated_merchant_sku ?? null;
    const warehouseId = optionData?.warehouseId ?? currentSku?.warehouse_id ?? generatedSku?.warehouse_id ?? '';
    const isChangeMode = !!currentSku?.id;
    const merchantSkus = optionData?.merchantSkus ?? [];
    const selectedSku = merchantSkus.find((s) => String(s.id) === String(selectedSkuId));

    const handlePrimaryConfirm = () => {
        if (!selectedSkuId) return;
        if (isChangeMode && String(selectedSkuId) !== String(currentSku.id)) {
            setShowConfirm(true);
            return;
        }
        onConfirm(selectedSkuId);
    };

    const confirmChange = () => {
        setShowConfirm(false);
        onConfirm(selectedSkuId);
    };

    return (
        <>
            <Modal onClose={() => !confirming && onClose()} maxWidth="620px">
                <div className="px-8 py-5 border-b border-surface-border flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-800 font-display">
                            {isChangeMode ? 'Change Mapped Merchant SKU' : 'Add Mapping with Merchant SKU'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Product: <span className="font-semibold text-primary truncate">{product?.product_name}</span>
                            {product?.seller_sku && <span className="text-slate-400"> · SKU: {product.seller_sku}</span>}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>

                <div className="px-8 py-4">
                    {isChangeMode ? (
                        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                            <p className="text-xs text-blue-700">
                                Current mapped Merchant SKU: <span className="font-bold font-mono">{currentSku.sku_name}</span>
                                {warehouseId && <span> · showing Merchant SKUs from same warehouse </span>}
                            </p>
                        </div>
                    ) : generatedSku ? (
                        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                            <p className="text-xs text-emerald-700">
                                Generated Merchant SKU found: <span className="font-bold font-mono">{generatedSku.sku_name}</span>
                                {warehouseId && <span> · showing Merchant SKUs from same warehouse </span>}
                            </p>
                        </div>
                    ) : null}

                    <p className="text-xs font-semibold text-slate-600 mb-2">
                        Select Merchant SKU to {isChangeMode ? 'change mapping to' : 'link'}
                    </p>
                    <div className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search SKU name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && setSearchApplied(search.trim())}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-surface-border rounded-lg outline-none focus:border-primary"
                            />
                        </div>
                        <button onClick={() => setSearchApplied(search.trim())} className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg">Search</button>
                    </div>

                    <div className="border border-surface-border rounded-xl overflow-hidden" style={{ maxHeight: '330px', overflowY: 'auto' }}>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-24 gap-2 text-xs text-slate-400"><Loader2 size={14} className="animate-spin text-primary" /> Loading Merchant SKUs...</div>
                        ) : merchantSkus.length === 0 ? (
                            <div className="flex items-center justify-center h-24 text-sm text-slate-400">No merchant SKUs found for this warehouse</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-surface-card text-xs text-slate-500 [&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                                    <tr>
                                        <th className="py-2 pl-4 w-8 text-left">Select</th>
                                        <th className="py-2 px-3 text-left">Image</th>
                                        <th className="py-2 px-3 text-left">Merchant SKU</th>
                                        <th className="py-2 px-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border">
                                    {merchantSkus.map((s) => {
                                        const isCurrent = String(s.id) === String(currentSku?.id ?? '') || s.is_current;
                                        const isGenerated = String(s.id) === String(generatedSku?.id ?? '') || s.is_generated;
                                        const selected = String(selectedSkuId) === String(s.id);
                                        return (
                                            <tr
                                                key={s.id}
                                                onClick={() => !isCurrent && setSelectedSkuId(String(s.id))}
                                                className={`transition-colors ${isCurrent ? 'bg-emerald-50/70 cursor-default' : 'cursor-pointer hover:bg-surface/50'} ${selected ? 'bg-blue-50' : ''}`}
                                            >
                                                <td className="py-2.5 pl-4 w-8">
                                                    <input
                                                        type="radio"
                                                        disabled={isCurrent}
                                                        checked={selected}
                                                        onChange={() => setSelectedSkuId(String(s.id))}
                                                        className="accent-primary cursor-pointer disabled:opacity-50"
                                                    />
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <img
                                                        src={s.image_url || 'https://placehold.co/28x28/E6ECF0/004368?text=?'}
                                                        alt={s.sku_name}
                                                        className="w-7 h-7 rounded-lg object-cover"
                                                        onError={(e) => { e.target.src = 'https://placehold.co/28x28/E6ECF0/004368?text=?'; }}
                                                    />
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <p className="text-xs font-semibold text-slate-800 font-mono">{s.sku_name}</p>
                                                    <p className="text-xs text-slate-400 truncate max-w-[300px]">{s.sku_title}</p>
                                                </td>
                                                <td className="py-2.5 px-3 text-right">
                                                    {isCurrent ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">Current mapped</span>
                                                    ) : isGenerated ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold">Generated SKU</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">WH #{s.warehouse_id ?? warehouseId ?? '—'}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 px-8 py-5 border-t border-surface-border">
                    <button onClick={onClose} disabled={confirming} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-surface-border text-slate-700 bg-white hover:bg-surface-card disabled:opacity-50">Cancel</button>
                    <button onClick={handlePrimaryConfirm} disabled={confirming || !selectedSkuId} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-dark text-white disabled:opacity-60 flex items-center justify-center gap-2">
                        {confirming && <Loader2 size={14} className="animate-spin" />}
                        {confirming ? 'Saving...' : isChangeMode ? 'Change Mapping' : 'Confirm Mapping'}
                    </button>
                </div>
            </Modal>

            {showConfirm && selectedSku && (
                <ConfirmModal
                    title="Change Merchant SKU Mapping"
                    message={`Are you sure you want to change this platform product SKU mapping from "${currentSku?.sku_name}" to "${selectedSku.sku_name}"?`}
                    confirmLabel={confirming ? 'Changing...' : 'Yes, Change Mapping'}
                    confirmClass="bg-primary hover:bg-primary-dark text-white"
                    loading={confirming}
                    onCancel={() => setShowConfirm(false)}
                    onConfirm={confirmChange}
                />
            )}
        </>
    );
}
