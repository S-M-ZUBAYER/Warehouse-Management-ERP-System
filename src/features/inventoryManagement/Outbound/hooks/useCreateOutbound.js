import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { OUTBOUND_KEYS } from './useOutboundList';
import api from '../../../../lib/api';
import useDebounce from '../../../../hooks/useDebounce';

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

/** GET /outbound/picker — merchant SKU list with current stock */
const fetchSkuPicker = ({ search, warehouseId, page = 1, limit = 50 }) => {
    const qs = new URLSearchParams({ page, limit });
    if (search?.trim()) qs.set('search', search.trim());
    if (warehouseId) qs.set('warehouseId', warehouseId);
    return api.get(`/outbound/picker?${qs.toString()}`).then((r) => r);
};

/** POST /outbound — create draft */
const createDraftOutbound = (body) =>
    api.post('/outbound', body).then((r) => r.data);

/** PUT /outbound/:id/ship — draft → on_the_way */
const shipOutbound = ({ id, body }) =>
    api.put(`/outbound/${id}/ship`, body).then((r) => r.data);

/** PUT /outbound/:id/receive — on_the_way → completed */
const receiveOutbound = ({ id, body }) =>
    api.put(`/outbound/${id}/receive`, body).then((r) => r.data);

/** PUT /outbound/:id — update draft */
const updateDraftOutbound = ({ id, body }) =>
    api.put(`/outbound/${id}`, body).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
// Empty form
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
    warehouseId: '',
    warehouseName: '',
    supplierName: '',
    supplierReference: '',
    receivingWarehouseName: '',
    receivingWarehouseAddress: '',
    notes: '',
    // Ship fields
    trackingNumber: '',
    purchaseCurrency: 'USD',
    estimatedArrival: '',
    exchangeRate: '',
    shippingCost: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook — used by CreateOutboundPage and SelectMerchantSKUModal
// ─────────────────────────────────────────────────────────────────────────────
const getAvailableQty = (sku) => Math.max(0, Number(sku?.qty_available ?? sku?.qty_on_hand ?? 0));

export function useCreateOutbound({ onSuccess, initialOrder = null }) {
    const queryClient = useQueryClient();

    // ── Form state ────────────────────────────────────────────────────────────
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});

    // ── SKU lines state ───────────────────────────────────────────────────────
    const [lines, setLines] = useState([]);  // [{ id, sku_name, sku_title, image_url, qtyExpected, unitCost }]

    // ── SKU picker (modal) state ──────────────────────────────────────────────
    const [skuSearch, setSkuSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [quantities, setQuantities] = useState({});
    const [warehouseSearch, setWarehouseSearch] = useState('');

    const debouncedSkuSearch = useDebounce(skuSearch, 300);
    const debouncedWhSearch = useDebounce(warehouseSearch, 300);

    // ── Query: SKU picker ─────────────────────────────────────────────────────
    const {
        data: pickerData,
        isLoading: pickerLoading,
        isFetching: pickerFetching,
        isError: isPickerError,
    } = useQuery({
        queryKey: ['outbound', 'picker', debouncedSkuSearch, form.warehouseId],
        queryFn: () => fetchSkuPicker({ search: debouncedSkuSearch, warehouseId: form.warehouseId }),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
        placeholderData: (prev) => prev,
    });

    const pickerSkus = pickerData?.data ?? [];

    useEffect(() => {
        if (!initialOrder) return;
        setForm({
            ...EMPTY_FORM,
            warehouseId: String(initialOrder.warehouse_id ?? ''),
            warehouseName: initialOrder.warehouse?.name ?? '',
            supplierName: initialOrder.supplier_name ?? '',
            supplierReference: initialOrder.supplier_reference ?? '',
            receivingWarehouseName: initialOrder.receiving_warehouse_name ?? initialOrder.warehouse?.name ?? '',
            receivingWarehouseAddress: initialOrder.receiving_warehouse_address ?? initialOrder.warehouse?.location ?? '',
            notes: initialOrder.notes ?? '',
        });
        setLines((initialOrder.lines ?? []).map((line) => {
            const sku = line.merchantSku ?? {};
            return {
                id: line.merchant_sku_id,
                merchantSkuId: line.merchant_sku_id,
                sku_name: sku.sku_name,
                sku_title: sku.sku_title,
                image_url: sku.image_url,
                qtyExpected: line.qty_expected,
                qtyAvailable: Math.max(Number(line.qty_expected || 0), getAvailableQty(sku)),
                unitCost: line.unit_cost ?? '',
            };
        }));
    }, [initialOrder]);

    // ── Query: warehouses for picker inside modal ─────────────────────────────
    const fetchAllWarehouses = useCallback(async (search = '') => {
        const qs = search ? `?page=1&limit=20&search=${encodeURIComponent(search)}` : '?page=1&limit=20';
        const first = await api.get(`/warehouses${qs}`);
        const totalPages = first.pagination?.totalPages ?? 1;
        if (totalPages === 1) return first.data;
        const rest = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
                api.get(`/warehouses?page=${i + 2}&limit=20&search=${encodeURIComponent(search)}`)
            )
        );
        return [...first.data, ...rest.flatMap((r) => r.data)];
    }, []);

    const {
        data: warehouses = [],
        isLoading: warehouseLoading,
        isError: isWarehouseError,
    } = useQuery({
        queryKey: ['warehouses', 'outbound-create', debouncedWhSearch],
        queryFn: () => fetchAllWarehouses(debouncedWhSearch),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
        placeholderData: (prev) => prev,
    });

    // ── SKU picker helpers ────────────────────────────────────────────────────
    // Cache map so selected SKU data survives search changes
    const [skuMap, setSkuMap] = useState({});

    const toggleSku = useCallback((id) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            const sku = pickerSkus.find((s) => s.id === id);
            if (!sku || getAvailableQty(sku) <= 0) return prev;
            if (sku) setSkuMap((m) => ({ ...m, [id]: sku }));
            setQuantities((q) => ({ ...q, [id]: 1 }));
            return [...prev, id];
        });
    }, [pickerSkus]);

    const updatePickerQty = useCallback((id, val) => {
        if (val === "") {
            setQuantities((prev) => ({ ...prev, [id]: "" }));
            return;
        }
        const sku = skuMap[id] ?? pickerSkus.find((item) => item.id === id);
        const maxQty = getAvailableQty(sku);
        setQuantities((prev) => ({ ...prev, [id]: Math.min(maxQty, Math.max(1, Number(val) || 1)) }));
    }, [pickerSkus, skuMap]);

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
            qtyExpected: Math.min(getAvailableQty(sku), Number(quantities[sku.id] ?? 1)),
            qtyAvailable: getAvailableQty(sku),
            unitCost: '',
        }));

        setLines((prev) => {
            const existingIds = prev.map((p) => p.id);
            const fresh = newLines.filter((n) => !existingIds.includes(n.id));
            return [...prev, ...fresh];
        });

        // reset picker state
        setSelectedIds([]);
        setQuantities({});
        setSkuSearch('');
    }, [pickerPreviewItems, quantities]);

    // Remove a line from the draft table
    const removeLine = useCallback((id) => {
        setLines((prev) => prev.filter((l) => l.id !== id));
    }, []);

    // Update qty directly in the draft table
    const updateLineQty = useCallback((id, val) => {
        setLines((prev) =>
            prev.map((l) => {
                if (l.id !== id) return l;
                if (val === '') return { ...l, qtyExpected: '' };
                const maxQty = Math.max(0, Number(l.qtyAvailable ?? 0));
                return { ...l, qtyExpected: Math.min(maxQty, Math.max(1, Number(val) || 1)) };
            })
        );
    }, []);

    // ── Form helpers ──────────────────────────────────────────────────────────
    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
    }, [errors]);

    const handleWarehouseSelect = useCallback((wh) => {
        setForm((prev) => ({
            ...prev,
            warehouseId: String(wh.id),
            warehouseName: wh.name,
        }));
        setLines([]);
        if (errors.warehouseId) setErrors((p) => ({ ...p, warehouseId: '' }));
    }, [errors]);

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = useCallback(() => {
        const e = {};
        if (!form.warehouseId) e.warehouseId = 'Warehouse is required';
        if (!form.receivingWarehouseName?.trim()) e.receivingWarehouseName = 'Receiving warehouse is required';
        if (!form.receivingWarehouseAddress?.trim()) e.receivingWarehouseAddress = 'Receiving warehouse full address is required';
        if (!lines.length) e.lines = 'Add at least one merchant SKU';
        const invalidQtyLine = lines.find((line) => !Number.isInteger(Number(line.qtyExpected)) || Number(line.qtyExpected) < 1);
        if (invalidQtyLine) e.lines = 'Quantity must be at least 1 for every SKU';
        const overLimitLine = lines.find((line) => Number(line.qtyExpected) > Number(line.qtyAvailable ?? 0));
        if (overLimitLine) e.lines = 'Quantity cannot be more than available inventory';
        return e;
    }, [form, lines]);

    // ── Create draft mutation ─────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: createDraftOutbound,
        onSuccess: (data) => {
            toast.success(`Outbound draft ${data.outbound_id} created successfully`);
            queryClient.invalidateQueries({ queryKey: OUTBOUND_KEYS.all() });
            setForm(EMPTY_FORM);
            setLines([]);
            onSuccess?.();
        },
        onError: (err) => {
            const msg = err?.response?.data?.message ?? 'Failed to create outbound draft';
            const fieldErrors = err?.response?.data?.errors ?? [];
            if (fieldErrors.length) {
                const mapped = {};
                fieldErrors.forEach(({ field, message }) => { mapped[field] = message; });
                setErrors(mapped);
            }
            toast.error(msg);
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateDraftOutbound,
        onSuccess: (data) => {
            toast.success(`Outbound draft ${data.outbound_id} updated successfully`);
            queryClient.invalidateQueries({ queryKey: OUTBOUND_KEYS.all() });
            onSuccess?.();
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Failed to update outbound draft');
        },
    });

    const handleSave = useCallback(() => {
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            toast.error('Please fix the highlighted fields');
            return;
        }
        const payload = {
            warehouseId: Number(form.warehouseId),
            supplierName: form.supplierName || undefined,
            supplierReference: form.supplierReference || undefined,
            receivingWarehouseName: form.receivingWarehouseName || undefined,
            receivingWarehouseAddress: form.receivingWarehouseAddress || undefined,
            notes: form.notes || undefined,
            lines: lines.map((l) => ({
                merchantSkuId: l.merchantSkuId,
                qtyExpected: Number(l.qtyExpected),
                unitCost: l.unitCost ? Number(l.unitCost) : undefined,
            })),
        };
        if (initialOrder?.id) {
            updateMutation.mutate({ id: initialOrder.id, body: payload });
        } else {
            createMutation.mutate(payload);
        }
    }, [form, lines, validate, createMutation, updateMutation, initialOrder]);

    // ── Ship mutation (used from OnTheWay page action) ────────────────────────
    const shipMutation = useMutation({
        mutationFn: shipOutbound,
        onSuccess: (data) => {
            toast.success(`Outbound ${data.outbound_id} marked as On The Way`);
            queryClient.invalidateQueries({ queryKey: OUTBOUND_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Failed to ship outbound');
        },
    });

    // ── Receive mutation (used from OnTheWay page action) ─────────────────────
    const receiveMutation = useMutation({
        mutationFn: receiveOutbound,
        onSuccess: (data) => {
            toast.success(`Outbound ${data.outbound_id} received — stock updated`);
            queryClient.invalidateQueries({ queryKey: OUTBOUND_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Failed to receive outbound');
        },
    });

    return {
        // form
        form, errors,
        handleFormChange,
        handleWarehouseSelect,

        // draft lines table
        lines,
        removeLine,
        updateLineQty,

        // warehouse picker
        warehouseSearch, setWarehouseSearch,
        warehouses,
        warehouseLoading,
        isWarehouseError,

        // SKU picker (for modal)
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

        // save
        saving: createMutation.isPending || updateMutation.isPending,
        handleSave,

        // ship / receive (for action menus on other tabs)
        shipMutation,
        receiveMutation,
    };
}
