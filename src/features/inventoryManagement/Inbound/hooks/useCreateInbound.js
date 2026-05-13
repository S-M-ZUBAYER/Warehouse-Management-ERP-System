import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { INBOUND_KEYS } from './useInboundList';
import api from '../../../../lib/api';
import useDebounce from '../../../../hooks/useDebounce';

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

/** GET /inbound/picker — merchant SKU list with current stock */
const fetchSkuPicker = ({ search, warehouseId, page = 1, limit = 50 }) => {
    const qs = new URLSearchParams({ page, limit });
    if (search?.trim()) qs.set('search', search.trim());
    if (warehouseId) qs.set('warehouseId', warehouseId);
    return api.get(`/inbound/picker?${qs.toString()}`).then((r) => r);
};

/** POST /inbound — create draft */
const createDraftInbound = (body) =>
    api.post('/inbound', body).then((r) => r.data);

/** PUT /inbound/:id/ship — draft → on_the_way */
const shipInbound = ({ id, body }) =>
    api.put(`/inbound/${id}/ship`, body).then((r) => r.data);

/** PUT /inbound/:id/receive — on_the_way → completed */
const receiveInbound = ({ id, body }) =>
    api.put(`/inbound/${id}/receive`, body).then((r) => r.data);

/** PUT /inbound/:id — update draft */
const updateDraftInbound = ({ id, body }) =>
    api.put(`/inbound/${id}`, body).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
// Empty form
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
    warehouseId: '',
    warehouseName: '',
    supplierName: '',
    supplierReference: '',
    notes: '',
    // Ship fields
    trackingNumber: '',
    purchaseCurrency: 'USD',
    estimatedArrival: '',
    exchangeRate: '',
    shippingCost: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook — used by CreateInboundPage and SelectMerchantSKUModal
// ─────────────────────────────────────────────────────────────────────────────
export function useCreateInbound({ onSuccess }) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);

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
        queryKey: ['inbound', 'picker', debouncedSkuSearch, form.warehouseId],
        queryFn: () => fetchSkuPicker({ search: debouncedSkuSearch, warehouseId: form.warehouseId }),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
        placeholderData: (prev) => prev,
    });

    const pickerSkus = pickerData?.data ?? [];

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
        queryKey: ['warehouses', 'inbound-create', debouncedWhSearch],
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
            qtyExpected: quantities[sku.id] ?? 1,
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
            prev.map((l) => l.id === id ? { ...l, qtyExpected: Math.max(1, Number(val) || 1) } : l)
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
        if (errors.warehouseId) setErrors((p) => ({ ...p, warehouseId: '' }));
    }, [errors]);

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = useCallback(() => {
        const e = {};
        if (!form.warehouseId) e.warehouseId = 'Receiving warehouse is required';
        if (!lines.length) e.lines = 'Add at least one merchant SKU';
        return e;
    }, [form, lines]);

    // ── Create draft mutation ─────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: createDraftInbound,
        onSuccess: (data) => {
            toast.success(`Inbound draft ${data.inbound_id} created successfully`);
            queryClient.invalidateQueries({ queryKey: INBOUND_KEYS.all() });
            setForm(EMPTY_FORM);
            setLines([]);
            onSuccess?.();
        },
        onError: (err) => {
            const msg = err?.response?.data?.message ?? 'Failed to create inbound draft';
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
            lines: lines.map((l) => ({
                merchantSkuId: l.merchantSkuId,
                qtyExpected: l.qtyExpected,
                unitCost: l.unitCost ? Number(l.unitCost) : undefined,
            })),
        });
    }, [form, lines, validate, createMutation]);

    // ── Ship mutation (used from OnTheWay page action) ────────────────────────
    const shipMutation = useMutation({
        mutationFn: shipInbound,
        onSuccess: (data) => {
            toast.success(`Inbound ${data.inbound_id} marked as On The Way`);
            queryClient.invalidateQueries({ queryKey: INBOUND_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Failed to ship inbound');
        },
    });

    // ── Receive mutation (used from OnTheWay page action) ─────────────────────
    const receiveMutation = useMutation({
        mutationFn: receiveInbound,
        onSuccess: (data) => {
            toast.success(`Inbound ${data.inbound_id} received — stock updated`);
            queryClient.invalidateQueries({ queryKey: INBOUND_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Failed to receive inbound');
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
        saving: createMutation.isPending,
        handleSave,

        // ship / receive (for action menus on other tabs)
        shipMutation,
        receiveMutation,
    };
}
