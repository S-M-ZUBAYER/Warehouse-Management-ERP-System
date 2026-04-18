import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


import { toast } from "sonner";
import api from "../../../../lib/api";
import useDebounce from "../../../../hooks/useDebounce";
import { MERCHANT_SKU_KEYS } from "../../../productManagement/hooks/useProductList";

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert file → base64 (strips data URI prefix) */
const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

/** Fetch warehouses with optional search + full pagination */
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

/** Update a merchant SKU — sends JSON (base64 image) identical to create */
const updateMerchantSku = async ({ id, payload }) => {

    let image = undefined;
    if (payload.image instanceof File) {
        const base64 = await fileToBase64(payload.image);
        image = base64.replace(/^data:image\/[a-z]+;base64,/, "");
    }

    const body = {
        skuTitle: payload.skuTitle,
        skuName: payload.skuName,
        productDetails: payload.productDetails || undefined,
        gtin: payload.gtin || undefined,
        price: payload.price || undefined,
        costPrice: payload.costPrice || undefined,
        weight: payload.weight || undefined,
        length: payload.length || undefined,
        width: payload.width || undefined,
        height: payload.height || undefined,
        warehouseId: payload.warehouseId || undefined,
        country: payload.country || undefined,
        status: payload.status || "active",
        ...(image !== undefined && { image }),
    };
    console.log(body);


    return api.put(`/merchant-skus/${id}`, body).then((r) => r.data);
};

// ─────────────────────────────────────────────────────────────────────────────
// Empty edit form — mirrors EditMerchantSKUModal's form shape
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_EDIT_FORM = {
    skuTitle: "",
    skuName: "",
    productDetails: "",
    gtin: "",
    price: "",
    costPrice: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    warehouseId: "",
    warehouseName: "",
    country: "",
    status: "active",
    image: null,
    photoPreview: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useEditSKU() {
    // ── Modal / target state ──────────────────────────────────────────────────
    const [editingSku, setEditingSku] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // ── Warehouse picker inside modal ─────────────────────────────────────────
    const [warehouseSearch, setWarehouseSearch] = useState("");
    const debouncedWhSearch = useDebounce(warehouseSearch, 300);

    const queryClient = useQueryClient();

    // ─────────────────────────────────────────────────────────────────────────
    // Query: warehouses for the edit modal picker
    // Only fetches while the modal is open (enabled flag)
    // ─────────────────────────────────────────────────────────────────────────
    const {
        data: editModalWarehouses = [],
        isLoading: warehouseLoading,
        isError: isWarehouseError,
    } = useQuery({
        queryKey: ["warehouses", "edit-modal", debouncedWhSearch],
        queryFn: () => fetchAllWarehouses(debouncedWhSearch),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
        placeholderData: (prev) => prev,
        enabled: showEditModal, // pause queries when modal is closed
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Mutation: update SKU
    // ─────────────────────────────────────────────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: updateMerchantSku,
        onSuccess: (data) => {
            toast.success(`SKU "${data.sku_name ?? data.skuName}" updated successfully`);
            // Invalidate list + dropdowns so the table refreshes automatically
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.all() });
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.dropdowns() });
            closeEditModal();
        },
        onError: (err) => {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message ?? err.message ?? "Failed to update SKU";

            if (status === 409) {
                toast.error(msg); // duplicate SKU name — surface to user
                return;
            }
            toast.error(msg);
        },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────────────────────────────────

    /** Open the edit modal and seed it with the selected SKU */
    const handleEdit = useCallback((sku) => {
        setEditingSku(sku);
        setShowEditModal(true);
    }, []);

    /** Close + reset everything */
    const closeEditModal = useCallback(() => {
        setShowEditModal(false);
        setEditingSku(null);
        setWarehouseSearch("");
    }, []);

    /**
     * Called by EditMerchantSKUModal's onSave prop.
     * Accepts (id, formPayload) — formPayload is the plain form object
     * from the modal's local state (NOT a FormData instance).
     */
    const handleUpdateSKU = useCallback(
        (id, payload) => {
            updateMutation.mutate({ id, payload });
        },
        [updateMutation]
    );


    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────
    return {
        // ── modal visibility ─────────────────────────────────────────────────
        showEditModal,
        setShowEditModal,
        editingSku,
        setEditingSku,

        // ── actions ──────────────────────────────────────────────────────────
        handleEdit,          // call with a SKU row object to open the modal
        closeEditModal,      // pass to onClose prop
        handleUpdateSKU,     // pass to onSave prop

        // ── save state ───────────────────────────────────────────────────────
        editSaving: updateMutation.isPending,

        // ── warehouse picker ─────────────────────────────────────────────────
        editModalWarehouses,
        warehouseLoading,
        isWarehouseError,
        warehouseSearch,
        setWarehouseSearch,
    };
}