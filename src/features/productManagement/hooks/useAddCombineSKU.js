import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { COMBINE_SKU_KEYS } from "./useCombineSKUList";
import api from "../../../lib/api";
import useDebounce from "../../../hooks/useDebounce";

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

/** GET /combine-skus/picker — searchable merchant SKU list with stock */
const fetchAllSkuPicker = async ({ search, limit = 10 }) => {
    // Helper to build query string
    const buildQuery = (page) => {
        const qs = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });
        if (search?.trim()) qs.set("search", search.trim());
        return qs.toString();
    };

    // Fetch first page
    const firstPage = await api.get(`/combine-skus/picker?${buildQuery(1)}`);
    const totalPages = firstPage.pagination?.totalPages ?? 1;

    // If only one page, return the data
    if (totalPages === 1) return firstPage.data;

    // Fetch remaining pages in parallel
    const remainingPages = Array.from(
        { length: totalPages - 1 },
        (_, i) => api.get(`/combine-skus/picker?${buildQuery(i + 2)}`)
    );

    const restPages = await Promise.all(remainingPages);

    // Combine all data from all pages
    return [...firstPage.data, ...restPages.flatMap(page => page.data)];
};

/** Fetch all warehouses (same pattern as merchant SKU hook) */
const fetchAllWarehouses = async (search = "") => {
    const qs = search
        ? `?page=1&limit=20&search=${encodeURIComponent(search)}`
        : "?page=1&limit=20";
    const first = await api.get(`/warehouses${qs}`);
    const totalPages = first.pagination?.totalPages ?? 1;
    if (totalPages === 1) return first.data;
    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
            api.get(`/warehouses?page=${i + 2}&limit=20&search=${encodeURIComponent(search)}`)
        )
    );
    return [...first.data, ...rest.flatMap((r) => r.data)];
};

/** POST /combine-skus */
const createCombineSku = (body) =>
    api.post("/combine-skus", body).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
// Empty form
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
    combineSKUName: "",
    combineSkuCode: "",
    gtin: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    warehouseId: "",
    warehouseName: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useAddCombineSKU() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // ── SKU picker state ──────────────────────────────────────────────────────
    const [skuSearch, setSkuSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [quantities, setQuantities] = useState({});

    // ── Warehouse search (inside bottom section) ───────────────────────────────
    const [warehouseSearch, setWarehouseSearch] = useState("");

    // ── Form state ────────────────────────────────────────────────────────────
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});

    // ── Modal state ───────────────────────────────────────────────────────────
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Debounced values
    const debouncedSkuSearch = useDebounce(skuSearch, 300);
    const debouncedWhSearch = useDebounce(warehouseSearch, 300);

    // ── Query: SKU picker ─────────────────────────────────────────────────────
    const {
        data: pickerData,
        isLoading: pickerLoading,
        isFetching: pickerFetching,
        isError: isPickerError,
    } = useQuery({
        queryKey: COMBINE_SKU_KEYS.picker(debouncedSkuSearch, 'all'),
        queryFn: () => fetchAllSkuPicker({
            search: debouncedSkuSearch,
            limit: 10  // Fetch 10 items per request, but will get all pages
        }),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
        placeholderData: (prev) => prev,
    });

    // filteredSkus will now contain ALL data from all pages
    const filteredSkus = pickerData?.filter(sku => sku?.warehouse?.id == form?.warehouseId) ?? [];




    // ── Query: warehouses ─────────────────────────────────────────────────────
    const {
        data: warehouses = [],
        isLoading: warehouseLoading,
        isError: isWarehouseError,
    } = useQuery({
        queryKey: ["warehouses", "add-combine", debouncedWhSearch],
        queryFn: () => fetchAllWarehouses(debouncedWhSearch),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
        placeholderData: (prev) => prev,
    });

    // ── Derived: selected SKU objects (from picker list) ──────────────────────
    // Keep a local map so we don't lose SKU data when the search changes
    const [skuMap, setSkuMap] = useState({});
    const selectedSkus = selectedIds
        .map((id) => skuMap[id])
        .filter(Boolean);

    // ── SKU selection helpers ─────────────────────────────────────────────────
    const toggleSku = useCallback((id) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            // Cache the SKU data at selection time
            const sku = filteredSkus.find((s) => s.id === id);
            if (sku) setSkuMap((m) => ({ ...m, [id]: sku }));
            setQuantities((q) => ({ ...q, [id]: 1 }));
            return [...prev, id];
        });
    }, [filteredSkus]);

    const updateQty = useCallback((id, val) => {
        setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Number(val) || 1) }));
    }, []);

    const removeFromPreview = useCallback((id) => {
        setSelectedIds((prev) => prev.filter((x) => x !== id));
    }, []);

    const clearAll = useCallback(() => {
        setSelectedIds([]);
        setQuantities({});
    }, []);

    const allTableSelected = filteredSkus.length > 0 &&
        filteredSkus.every((s) => selectedIds.includes(s.id));

    const toggleAll = useCallback(() => {
        const ids = filteredSkus.map((s) => s.id);
        const allSel = ids.every((id) => selectedIds.includes(id));
        if (allSel) {
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        } else {
            const newIds = ids.filter((id) => !selectedIds.includes(id));
            newIds.forEach((id) => {
                const sku = filteredSkus.find((s) => s.id === id);
                if (sku) setSkuMap((m) => ({ ...m, [id]: sku }));
                setQuantities((q) => ({ ...q, [id]: 1 }));
            });
            setSelectedIds((prev) => [...prev, ...newIds]);
        }
    }, [filteredSkus, selectedIds]);

    // ── Warehouse select ──────────────────────────────────────────────────────
    const handleWarehouseSelect = useCallback((wh) => {
        setForm((prev) => ({
            ...prev,
            warehouseId: String(wh.id),
            warehouseName: wh.name,
        }));
        if (errors.warehouseId) setErrors((p) => ({ ...p, warehouseId: "" }));
    }, [errors]);

    // ── Form change ───────────────────────────────────────────────────────────
    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    }, [errors]);

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = useCallback(() => {
        const e = {};
        if (!form.combineSKUName.trim()) e.combineSKUName = "Combine SKU Name is required";
        if (!form.combineSkuCode.trim()) e.combineSkuCode = "Combine SKU Code is required";
        if (selectedIds.length === 0) e.items = "Select at least one merchant SKU";
        return e;
    }, [form, selectedIds]);

    // ── Create mutation ───────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: createCombineSku,
        onSuccess: (data) => {
            toast.success(`Combine SKU "${data.combine_sku_code}" created successfully`);
            queryClient.invalidateQueries({ queryKey: COMBINE_SKU_KEYS.all() });
            setShowSaveModal(false);
            navigate("/warehouse_management/products/combine_sku");
        },
        onError: (err) => {
            const msg = err?.response?.data?.message ?? "Failed to create Combine SKU";
            const fieldErrors = err?.response?.data?.errors ?? [];
            if (fieldErrors.length) {
                const mapped = {};
                fieldErrors.forEach(({ field, message }) => {
                    const local = field === "combineName" ? "combineSKUName"
                        : field === "combineSkuCode" ? "combineSkuCode"
                            : field;
                    mapped[local] = message;
                });
                setErrors(mapped);
            }
            toast.error(msg);
            setShowSaveModal(false);
        },
    });

    const handleSaveClick = useCallback(() => {
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            toast.error("Please fix the highlighted fields");
            return;
        }
        setShowSaveModal(true);
    }, [validate]);

    const confirmSave = useCallback(() => {
        const body = {
            combineName: form.combineSKUName.trim(),
            combineSkuCode: form.combineSkuCode.trim(),
            gtin: form.gtin || undefined,
            weight: form.weight || undefined,
            length: form.length || undefined,
            width: form.width || undefined,
            height: form.height || undefined,
            warehouseId: form.warehouseId ? Number(form.warehouseId) : undefined,
            status: "active",
            items: selectedIds.map((id) => ({
                merchantSkuId: id,
                quantity: quantities[id] ?? 1,
            })),
        };
        createMutation.mutate(body);
    }, [form, selectedIds, quantities, createMutation]);

    return {
        // SKU picker
        skuSearch, setSkuSearch,
        filteredSkus,
        pickerLoading,
        pickerFetching,
        isPickerError,

        // selection
        selectedIds,
        selectedSkus,
        quantities,
        toggleSku,
        updateQty,
        removeFromPreview,
        clearAll,
        allTableSelected,
        toggleAll,

        // warehouse
        warehouseSearch, setWarehouseSearch,
        warehouses,
        warehouseLoading,
        isWarehouseError,
        handleWarehouseSelect,

        // form
        form, errors,
        handleFormChange,

        // save
        showSaveModal, setShowSaveModal,
        saving: createMutation.isPending,
        handleSaveClick,
        confirmSave,
    };
}
