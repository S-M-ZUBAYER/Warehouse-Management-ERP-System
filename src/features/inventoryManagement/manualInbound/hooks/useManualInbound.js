// import { useState, useCallback } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import { INBOUND_KEYS } from '../../Inbound/hooks/useInboundList';
// import api from '../../../../lib/api';
// import useDebounce from '../../../../hooks/useDebounce';

// // ─────────────────────────────────────────────────────────────────────────────
// // API helpers — same endpoints as useCreateInbound
// // ─────────────────────────────────────────────────────────────────────────────

// const fetchSkuPicker = ({ search, warehouseId, page = 1, limit = 50 }) => {
//     const qs = new URLSearchParams({ page, limit });
//     if (search?.trim()) qs.set('search', search.trim());
//     if (warehouseId) qs.set('warehouseId', warehouseId);
//     return api.get(`/inbound/picker?${qs.toString()}`).then((r) => r);
// };

// const createManualInbound = (body) =>
//     api.post('/inbound', body).then((r) => r.data);

// // ─────────────────────────────────────────────────────────────────────────────
// // Empty form
// // ─────────────────────────────────────────────────────────────────────────────
// const EMPTY_FORM = {
//     warehouseId: '',
//     warehouseName: '',
//     supplierName: '',
//     supplierReference: '',
//     notes: '',
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Hook — mirrors useCreateInbound exactly
// // ─────────────────────────────────────────────────────────────────────────────
// export function useManualInbound({ onSuccess } = {}) {
//     const queryClient = useQueryClient();

//     const [form, setForm] = useState(EMPTY_FORM);
//     const [errors, setErrors] = useState({});
//     const [lines, setLines] = useState([]);
//     // [{ id, merchantSkuId, sku_name, sku_title, image_url, qtyExpected, unitCost }]

//     // picker modal state
//     const [skuSearch, setSkuSearch] = useState('');
//     const [selectedIds, setSelectedIds] = useState([]);
//     const [quantities, setQuantities] = useState({});

//     const debouncedSkuSearch = useDebounce(skuSearch, 300);

//     // ── SKU picker query — same queryKey as useCreateInbound ─────────────────
//     const {
//         data: pickerData,
//         isLoading: pickerLoading,
//         isFetching: pickerFetching,
//         isError: isPickerError,
//     } = useQuery({
//         queryKey: ['inbound', 'picker', debouncedSkuSearch, form.warehouseId],
//         queryFn: () => fetchSkuPicker({ search: debouncedSkuSearch, warehouseId: form.warehouseId }),
//         staleTime: 1000 * 60 * 2,
//         gcTime: 1000 * 60 * 5,
//         placeholderData: (prev) => prev,
//     });

//     const pickerSkus = pickerData?.data ?? [];

//     // skuMap cache — survives search filter changes
//     const [skuMap, setSkuMap] = useState({});

//     const toggleSku = useCallback((id) => {
//         setSelectedIds((prev) => {
//             if (prev.includes(id)) return prev.filter((x) => x !== id);
//             const sku = pickerSkus.find((s) => s.id === id);
//             if (sku) setSkuMap((m) => ({ ...m, [id]: sku }));
//             setQuantities((q) => ({ ...q, [id]: 1 }));
//             return [...prev, id];
//         });
//     }, [pickerSkus]);

//     const updatePickerQty = useCallback((id, val) => {
//         setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Number(val) || 1) }));
//     }, []);

//     const removeFromPicker = useCallback((id) => {
//         setSelectedIds((prev) => prev.filter((x) => x !== id));
//     }, []);

//     const clearPickerAll = useCallback(() => {
//         setSelectedIds([]);
//         setQuantities({});
//     }, []);

//     const pickerPreviewItems = selectedIds.map((id) => skuMap[id]).filter(Boolean);

//     // Confirm from modal → push to lines table (same as confirmSkuSelection)
//     const confirmSkuSelection = useCallback(() => {
//         const newLines = pickerPreviewItems.map((sku) => ({
//             id: sku.id,
//             merchantSkuId: sku.id,
//             sku_name: sku.sku_name,
//             sku_title: sku.sku_title,
//             image_url: sku.image_url,
//             qtyExpected: quantities[sku.id] ?? 1,
//             unitCost: '',
//         }));

//         setLines((prev) => {
//             const existingIds = prev.map((p) => p.id);
//             const fresh = newLines.filter((n) => !existingIds.includes(n.id));
//             return [...prev, ...fresh];
//         });

//         setSelectedIds([]);
//         setQuantities({});
//         setSkuSearch('');
//     }, [pickerPreviewItems, quantities]);

//     const removeLine = useCallback((id) => {
//         setLines((prev) => prev.filter((l) => l.id !== id));
//     }, []);

//     const updateLineQty = useCallback((id, val) => {
//         setLines((prev) =>
//             prev.map((l) => l.id === id ? { ...l, qtyExpected: Math.max(1, Number(val) || 1) } : l)
//         );
//     }, []);

//     const handleFormChange = useCallback((e) => {
//         const { name, value } = e.target;
//         setForm((prev) => ({ ...prev, [name]: value }));
//         if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
//     }, [errors]);

//     const handleWarehouseSelect = useCallback((wh) => {
//         setForm((prev) => ({
//             ...prev,
//             warehouseId: String(wh.id ?? wh.value),
//             warehouseName: wh.name ?? wh.label,
//         }));
//         if (errors.warehouseId) setErrors((p) => ({ ...p, warehouseId: '' }));
//     }, [errors]);

//     const validate = useCallback(() => {
//         const e = {};
//         if (!form.warehouseId) e.warehouseId = 'Receiving warehouse is required';
//         if (!lines.length) e.lines = 'Add at least one merchant SKU';
//         return e;
//     }, [form, lines]);

//     const createMutation = useMutation({
//         mutationFn: createManualInbound,
//         onSuccess: (data) => {
//             toast.success(`Manual inbound ${data.inbound_id} created successfully`);
//             queryClient.invalidateQueries({ queryKey: INBOUND_KEYS.all() });
//             setForm(EMPTY_FORM);
//             setLines([]);
//             onSuccess?.();
//         },
//         onError: (err) => {
//             const msg = err?.response?.data?.message ?? 'Failed to create manual inbound';
//             const fieldErrors = err?.response?.data?.errors ?? [];
//             if (fieldErrors.length) {
//                 const mapped = {};
//                 fieldErrors.forEach(({ field, message }) => { mapped[field] = message; });
//                 setErrors(mapped);
//             }
//             toast.error(msg);
//         },
//     });

//     const handleSave = useCallback(() => {
//         const e = validate();
//         if (Object.keys(e).length) {
//             setErrors(e);
//             toast.error('Please fix the highlighted fields');
//             return;
//         }
//         createMutation.mutate({
//             warehouseId: Number(form.warehouseId),
//             supplierName: form.supplierName || undefined,
//             supplierReference: form.supplierReference || undefined,
//             notes: form.notes || undefined,
//             lines: lines.map((l) => ({
//                 merchantSkuId: l.merchantSkuId,
//                 qtyExpected: l.qtyExpected,
//                 unitCost: l.unitCost ? Number(l.unitCost) : undefined,
//             })),
//         });
//     }, [form, lines, validate, createMutation]);

//     return {
//         form, errors,
//         handleFormChange,
//         handleWarehouseSelect,
//         lines,
//         removeLine,
//         updateLineQty,
//         skuSearch, setSkuSearch,
//         pickerSkus,
//         pickerLoading,
//         pickerFetching,
//         isPickerError,
//         selectedIds,
//         quantities,
//         toggleSku,
//         updatePickerQty,
//         removeFromPicker,
//         clearPickerAll,
//         pickerPreviewItems,
//         confirmSkuSelection,
//         saving: createMutation.isPending,
//         handleSave,
//     };
// }

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../../../lib/api';
import { INBOUND_KEYS } from '../../Inbound/hooks/useInboundList';
import useDebounce from '../../../../hooks/useDebounce';

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

const fetchSkuPicker = ({ search, warehouseId, page = 1, limit = 50 }) => {
    const qs = new URLSearchParams({ page, limit });
    if (search?.trim()) qs.set('search', search.trim());
    if (warehouseId) qs.set('warehouseId', warehouseId);
    return api.get(`/inbound/picker?${qs.toString()}`).then((r) => r);
};

// ✅ New manual inbound endpoint — POST /inbound/manual
const createManualInbound = (body) =>
    api.post('/inbound/manual', body).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
// Empty form
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
    warehouseId: '',
    warehouseName: '',
    supplierName: '',
    supplierReference: '',
    notes: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useManualInbound({ onSuccess } = {}) {
    const queryClient = useQueryClient();

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [lines, setLines] = useState([]);
    // [{ id, merchantSkuId, sku_name, sku_title, image_url, qtyReceived, unitCost }]

    // picker modal state
    const [skuSearch, setSkuSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [quantities, setQuantities] = useState({});

    const debouncedSkuSearch = useDebounce(skuSearch, 300);

    // ── SKU picker query ──────────────────────────────────────────────────────
    const {
        data: pickerData,
        isLoading: pickerLoading,
        isFetching: pickerFetching,
        isError: isPickerError,
    } = useQuery({
        queryKey: ['inbound', 'picker', debouncedSkuSearch, form.warehouseId],
        queryFn: () => fetchSkuPicker({ search: debouncedSkuSearch, warehouseId: form.warehouseId }),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
        placeholderData: (prev) => prev,
        // Only fetch when a warehouse is selected
        enabled: !!form.warehouseId,
    });

    const pickerSkus = pickerData?.data ?? [];

    // skuMap cache — survives search filter changes
    const [skuMap, setSkuMap] = useState({});

    const toggleSku = useCallback((id) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            const sku = pickerSkus.find((s) => s.id === id);
            if (sku) setSkuMap((m) => ({ ...m, [id]: sku }));
            setQuantities((q) => ({ ...q, [id]: 1 }));
            return [...prev, id];
        });
    }, [pickerSkus]);

    const updatePickerQty = useCallback((id, val) => {
        setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Number(val) || 1) }));
    }, []);

    const removeFromPicker = useCallback((id) => {
        setSelectedIds((prev) => prev.filter((x) => x !== id));
    }, []);

    const clearPickerAll = useCallback(() => {
        setSelectedIds([]);
        setQuantities({});
    }, []);

    const pickerPreviewItems = selectedIds.map((id) => skuMap[id]).filter(Boolean);

    // Confirm from modal → push to lines table
    const confirmSkuSelection = useCallback(() => {
        const newLines = pickerPreviewItems.map((sku) => ({
            id: sku.id,
            merchantSkuId: sku.id,
            sku_name: sku.sku_name,
            sku_title: sku.sku_title,
            image_url: sku.image_url,
            qtyReceived: quantities[sku.id] ?? 1,  // ✅ qtyReceived (not qtyExpected)
            unitCost: '',
        }));

        setLines((prev) => {
            const existingIds = prev.map((p) => p.id);
            const fresh = newLines.filter((n) => !existingIds.includes(n.id));
            return [...prev, ...fresh];
        });

        setSelectedIds([]);
        setQuantities({});
        setSkuSearch('');
    }, [pickerPreviewItems, quantities]);

    const removeLine = useCallback((id) => {
        setLines((prev) => prev.filter((l) => l.id !== id));
    }, []);

    // ✅ updateLineQty now updates qtyReceived
    const updateLineQty = useCallback((id, val) => {
        setLines((prev) =>
            prev.map((l) => l.id === id ? { ...l, qtyReceived: Math.max(1, Number(val) || 1) } : l)
        );
    }, []);

    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
    }, [errors]);

    const handleWarehouseSelect = useCallback((wh) => {
        setForm((prev) => ({
            ...prev,
            warehouseId: String(wh.id ?? wh.value),
            warehouseName: wh.name ?? wh.label,
        }));
        if (errors.warehouseId) setErrors((p) => ({ ...p, warehouseId: '' }));
        // Clear lines when warehouse changes — SKUs may differ per warehouse
        setLines([]);
        setSelectedIds([]);
        setQuantities({});
    }, [errors]);

    const validate = useCallback(() => {
        const e = {};
        if (!form.warehouseId) e.warehouseId = 'Receiving warehouse is required';
        if (!lines.length) e.lines = 'Add at least one merchant SKU';
        return e;
    }, [form, lines]);

    const createMutation = useMutation({
        mutationFn: createManualInbound,
        onSuccess: (data) => {
            toast.success(`Manual inbound ${data.inbound_id ?? ''} created successfully`);
            queryClient.invalidateQueries({ queryKey: INBOUND_KEYS.all() });
            setForm(EMPTY_FORM);
            setLines([]);
            onSuccess?.();
        },
        onError: (err) => {
            const msg = err?.response?.data?.message ?? 'Failed to create manual inbound';
            const fieldErrors = err?.response?.data?.errors ?? [];
            if (fieldErrors.length) {
                const mapped = {};
                fieldErrors.forEach(({ field, message }) => { mapped[field] = message; });
                setErrors(mapped);
            }
            toast.error(msg);
        },
    });

    const handleSave = useCallback(() => {
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            toast.error('Please fix the highlighted fields');
            return;
        }
        createMutation.mutate({
            warehouseId: Number(form.warehouseId),
            supplierName: form.supplierName || undefined,
            supplierReference: form.supplierReference || undefined,
            notes: form.notes || undefined,
            // ✅ API expects lines[].qtyReceived
            lines: lines.map((l) => ({
                merchantSkuId: l.merchantSkuId,
                qtyReceived: l.qtyReceived,
                unitCost: l.unitCost ? Number(l.unitCost) : undefined,
            })),
        });
    }, [form, lines, validate, createMutation]);

    return {
        form, errors,
        handleFormChange,
        handleWarehouseSelect,
        lines,
        removeLine,
        updateLineQty,
        skuSearch, setSkuSearch,
        pickerSkus,
        pickerLoading,
        pickerFetching,
        isPickerError,
        selectedIds,
        quantities,
        toggleSku,
        updatePickerQty,
        removeFromPicker,
        clearPickerAll,
        pickerPreviewItems,
        confirmSkuSelection,
        saving: createMutation.isPending,
        handleSave,
    };
}

// Default export alias — supports both import styles
export default useManualInbound;