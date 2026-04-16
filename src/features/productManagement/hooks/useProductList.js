// import { useState, useMemo } from "react";

// const MOCK_PRODUCTS = [
//     { id: 1, sku: "WM-012", warehouse: "Warehouse A", status: "Active", country: "Malaysia", name: "Ergonomic wireless mouse with 3k...", availableInventory: 125, inTransitInventory: 125, image: "https://placehold.co/40x40/1a1a2e/fff?text=M" },
//     { id: 2, sku: "KB-045", warehouse: "Warehouse B", status: "Out of Stock", country: "Thailand", name: "Compact mechanical keyboard with...", availableInventory: 200, inTransitInventory: 200, image: "https://placehold.co/40x40/16213e/fff?text=K" },
//     { id: 3, sku: "SSD-123", warehouse: "Warehouse A", status: "Inactive", country: "Malaysia", name: "Portable external SSD 1TB", availableInventory: 0, inTransitInventory: 0, image: "https://placehold.co/40x40/0f3460/fff?text=S" },
//     { id: 4, sku: "HP-678", warehouse: "Warehouse C", status: "Low Stock", country: "Singapore", name: "Noise-cancelling over-ear headphones", availableInventory: 75, inTransitInventory: 75, image: "https://placehold.co/40x40/533483/fff?text=H" },
//     { id: 5, sku: "WC-234", warehouse: "Warehouse A", status: "Active", country: "Malaysia", name: "High-definition webcam 1080p", availableInventory: 100, inTransitInventory: 100, image: "https://placehold.co/40x40/2b2d42/fff?text=W" },
//     { id: 6, sku: "SH-456", warehouse: "Warehouse A", status: "Active", country: "Indonesia", name: "Smartphone holder with adjustable ...", availableInventory: 300, inTransitInventory: 300, image: "https://placehold.co/40x40/8d99ae/004368?text=S" },
//     { id: 7, sku: "BP-789", warehouse: "Warehouse C", status: "Active", country: "Malaysia", name: "Ultra-slim laptop backpack", availableInventory: 10, inTransitInventory: 10, image: "https://placehold.co/40x40/3a3a3c/fff?text=B" },
//     { id: 8, sku: "CP-321", warehouse: "Warehouse B", status: "Low Stock", country: "Malaysia", name: "Wireless charging pad for smartphones", availableInventory: 180, inTransitInventory: 180, image: "https://placehold.co/40x40/004368/fff?text=C" },
//     { id: 9, sku: "CC-987", warehouse: "Warehouse A", status: "Active", country: "Thailand", name: "High-speed HDMI cable 6ft", availableInventory: 500, inTransitInventory: 500, image: "https://placehold.co/40x40/1b4332/fff?text=H" },
//     { id: 10, sku: "GR-222", warehouse: "Warehouse B", status: "Active", country: "Singapore", name: "Smart home hub for automation", availableInventory: 90, inTransitInventory: 90, image: "https://placehold.co/40x40/212529/fff?text=G" },
// ];

// const WAREHOUSES = ["All Warehouses", "Warehouse A", "Warehouse B", "Warehouse C"];
// const STATUSES = ["All Status", "Active", "Inactive", "Low Stock", "Out of Stock"];
// const COUNTRIES = ["All Countries", "Malaysia", "Singapore", "Thailand", "Indonesia"];

// const EMPTY_FORM = {
//     productName: "",
//     skuName: "",
//     productDetails: "",
//     gtin: "",
//     productPrice: "",
//     weight: "",
//     length: "",
//     width: "",
//     height: "",
//     warehouse: "Warehouse name",
//     photo: null,
//     photoPreview: null,
// };

// // Helper — "All *" options mean no filter applied
// const isDefaultOption = (value) =>
//     !value ||
//     value === "All Warehouses" ||
//     value === "All Status" ||
//     value === "All Countries";

// export function useProductList() {
//     const [search, setSearch] = useState("");
//     const [warehouse, setWarehouse] = useState("All Warehouses");
//     const [productStatus, setProductStatus] = useState("All Status");
//     const [country, setCountry] = useState("All Countries");
//     const [sku, setSku] = useState("");
//     const [selectedIds, setSelectedIds] = useState([]);
//     const [bulkAction, setBulkAction] = useState("");

//     // Add New Product As Merchent Sku
//     const [form, setForm] = useState(EMPTY_FORM);
//     const [errors, setErrors] = useState({});
//     const [showAddModal, setShowAddModal] = useState(false);
//     const [saving, setSaving] = useState(false);

//     const filtered = useMemo(() => {
//         let list = [...MOCK_PRODUCTS];

//         // ── 1. Text search — name, sku, warehouse, status, country ─────────────
//         if (search.trim()) {
//             const q = search.toLowerCase();
//             list = list.filter(
//                 (p) =>
//                     p.name.toLowerCase().includes(q) ||
//                     p.sku.toLowerCase().includes(q) ||
//                     p.warehouse.toLowerCase().includes(q) ||
//                     p.status.toLowerCase().includes(q) ||
//                     p.country.toLowerCase().includes(q)
//             );
//         }

//         // ── 2. SKU field filter ────────────────────────────────────────────────
//         if (sku.trim()) {
//             list = list.filter((p) =>
//                 p.sku.toLowerCase().includes(sku.toLowerCase())
//             );
//         }

//         // ── 3. Warehouse dropdown filter ──────────────────────────────────────
//         if (!isDefaultOption(warehouse)) {
//             list = list.filter((p) => p.warehouse === warehouse);
//         }

//         // ── 4. Status dropdown filter ─────────────────────────────────────────
//         if (!isDefaultOption(productStatus)) {
//             list = list.filter((p) => p.status === productStatus);
//         }

//         // ── 5. Country dropdown filter ────────────────────────────────────────
//         if (!isDefaultOption(country)) {
//             list = list.filter((p) => p.country === country);
//         }

//         return list;
//     }, [search, sku, warehouse, productStatus, country]);

//     // ── Selection helpers ────────────────────────────────────────────────────
//     const toggleSelect = (id) =>
//         setSelectedIds((prev) =>
//             prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
//         );

//     const toggleAll = () => {
//         const ids = filtered.map((p) => p.id);
//         const allSelected = ids.every((id) => selectedIds.includes(id));
//         setSelectedIds(allSelected ? [] : ids);
//     };

//     // ── Reset all filters ────────────────────────────────────────────────────
//     const resetFilters = () => {
//         setSearch("");
//         setSku("");
//         setWarehouse("All Warehouses");
//         setProductStatus("All Status");
//         setCountry("All Countries");
//     };



//     const handlePhotoChange = (e) => {
//         const file = e.target.files[0];
//         if (!file) return;
//         setForm((p) => ({
//             ...p,
//             photo: file,
//             photoPreview: URL.createObjectURL(file),
//         }));
//     };
//     const handleFormChange = (e) => {
//         const { name, value } = e.target;
//         setForm((p) => ({ ...p, [name]: value }));
//         if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
//     };
//     const validate = () => {
//         const e = {};
//         if (!form.productName.trim()) e.productName = "Product Name is required";
//         if (!form.skuName.trim()) e.skuName = "SKU Name is required";
//         if (!form.productDetails.trim())
//             e.productDetails = "Product Details is required";
//         return e;
//     };


//     const handleSave = async () => {
//         const e = validate();
//         if (Object.keys(e).length) {
//             setErrors(e);
//             return;
//         }
//         setSaving(true);
//         await new Promise((r) => setTimeout(r, 600));
//         setSaving(false);
//         setShowAddModal(false);
//         setForm(EMPTY_FORM);
//     };

//     const hasActiveFilters =
//         search.trim() ||
//         sku.trim() ||
//         !isDefaultOption(warehouse) ||
//         !isDefaultOption(productStatus) ||
//         !isDefaultOption(country);

//     return {
//         // filter state
//         search, setSearch,
//         warehouse, setWarehouse,
//         productStatus, setProductStatus,
//         country, setCountry,
//         sku, setSku,
//         bulkAction, setBulkAction,

//         // data
//         products: filtered,
//         allProducts: MOCK_PRODUCTS,
//         totalCount: filtered.length,

//         // selection
//         selectedIds,
//         toggleSelect,
//         toggleAll,
//         allSelected: filtered.length > 0 && filtered.every((p) => selectedIds.includes(p.id)),
//         someSelected: filtered.some((p) => selectedIds.includes(p.id)),

//         // filter meta
//         resetFilters,
//         hasActiveFilters,

//         // dropdown options
//         warehouses: WAREHOUSES,
//         statuses: STATUSES,
//         countries: COUNTRIES,

//         // Add New Product 
//         form, setForm, handleSave, handleFormChange, handlePhotoChange, showAddModal, setShowAddModal, saving, setSaving, errors
//     };
// }


import { useState, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api";
import useDebounce from "../../../hooks/useDebounce";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────
export const MERCHANT_SKU_KEYS = {
    all: () => ["merchant-skus"],
    list: (filters) => ["merchant-skus", "list", filters],
    detail: (id) => ["merchant-skus", "detail", id],
    dropdowns: () => ["merchant-skus", "dropdowns"],
};

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch the warehouse + country dropdowns for filter bar */
const fetchDropdowns = () =>
    api.get("/merchant-skus/dropdowns").then((r) => r.data);

/** Fetch paginated merchant SKU list */
const fetchMerchantSkus = (params) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", params.page);
    if (params.limit) qs.set("limit", params.limit);
    if (params.search?.trim()) qs.set("search", params.search.trim());
    if (params.warehouseId) qs.set("warehouseId", params.warehouseId);
    if (params.status && params.status !== "all") qs.set("status", params.status);
    if (params.country && params.country !== "all") qs.set("country", params.country);
    if (params.sku?.trim()) qs.set("search", params.sku.trim()); // server searches by sku_name
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    if (params.sortOrder) qs.set("sortOrder", params.sortOrder);
    return api.get(`/merchant-skus?${qs.toString()}`).then((r) => r);
};

/** Convert file → base64 string (strips the data:...;base64, prefix for API) */
const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

/** Create a new merchant SKU */
const createMerchantSku = async (payload) => {
    let image = undefined;
    if (payload.photoFile) {
        const base64 = await fileToBase64(payload.photoFile);
        // Strip the data URI prefix — send raw base64 only
        image = base64.replace(/^data:image\/[a-z]+;base64,/, "");
    }

    const body = {
        skuName: payload.skuName,
        skuTitle: payload.productName,  // ✅ make sure form.productName is set
        productDetails: payload.productDetails || undefined,
        gtin: payload.gtin || undefined,
        price: payload.productPrice || undefined,
        weight: payload.weight || undefined,
        length: payload.length || undefined,
        width: payload.width || undefined,
        height: payload.height || undefined,
        warehouseId: payload.warehouseId || undefined,
        status: "active",
        image,
    };

    console.log("BODY KEYS:", Object.keys(body));
    console.log("skuTitle value:", body.skuTitle); // ← check this is not undefined

    return api.post("/merchant-skus", body).then((r) => r.data);
};

/** Delete single SKU */
const deleteMerchantSku = (id) =>
    api.delete(`/merchant-skus/${id}`).then((r) => r.data);

/** Bulk delete SKUs */
const bulkDeleteMerchantSkus = (skuIds) =>
    api.delete("/merchant-skus/bulk", { data: { skuIds } }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
// Empty form
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
    productName: "",
    skuName: "",
    productDetails: "",
    gtin: "",
    productPrice: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    warehouseId: "",
    warehouseName: "Warehouse name",
    photoFile: null,
    photoPreview: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Main hook
// ─────────────────────────────────────────────────────────────────────────────
export function useProductList() {
    // ── Filter state ──────────────────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [warehouseFilter, setWarehouseFilter] = useState("all");
    const [warehouseFilterName, setWarehouseFilterName] = useState("All Warehouses");
    const [productStatus, setProductStatus] = useState("all");
    const [country, setCountry] = useState("all");
    const [sku, setSku] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("DESC");
    const [bulkAction, setBulkAction] = useState("");

    // ── Selection state ───────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState([]);

    // ── Add modal state ───────────────────────────────────────────────────────
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [warehouseSearch, setWarehouseSearch] = useState("");
    const fileInputRef = useRef(null);

    // ── Delete confirm state ──────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    // ── Debounced values ──────────────────────────────────────────────────────
    const debouncedSearch = useDebounce(search, 350);
    const debouncedSku = useDebounce(sku, 350);
    const debouncedWhSearch = useDebounce(warehouseSearch, 300);

    const queryClient = useQueryClient();

    // ─────────────────────────────────────────────────────────────────────────
    // Query: dropdowns (warehouses + countries)
    // ─────────────────────────────────────────────────────────────────────────
    const {
        data: dropdowns,
        isLoading: dropdownsLoading,
        isError: isDropdownError,
    } = useQuery({
        queryKey: MERCHANT_SKU_KEYS.dropdowns(),
        queryFn: fetchDropdowns,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });

    // Build dropdown option arrays from API response
    const warehouseOptions = useMemo(() => {
        const base = [{ label: "All Warehouses", value: "all" }];
        if (!dropdowns?.warehouses) return base;
        return [
            ...base,
            ...dropdowns.warehouses.map((w) => ({
                label: w.name,
                value: String(w.id),
            })),
        ];
    }, [dropdowns]);

    const countryOptions = useMemo(() => {
        const base = [{ label: "All Countries", value: "all" }];
        if (!dropdowns?.countries) return base;
        return [
            ...base,
            ...dropdowns.countries.map((c) => ({ label: c, value: c })),
        ];
    }, [dropdowns]);

    const statusOptions = [
        { label: "All Status", value: "all" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "In Stock", value: "in_stock" },
        { label: "Out of Stock", value: "out_of_stock" },
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Query: warehouse list for the modal picker (with search)
    // Uses same pattern as your demo fetchAllWarehouses
    // ─────────────────────────────────────────────────────────────────────────
    const fetchAllWarehouses = useCallback((search = "") => {
        const qs = search
            ? `?page=1&limit=20&search=${encodeURIComponent(search)}`
            : "?page=1&limit=20";
        return api.get(`/warehouses${qs}`).then(async (first) => {
            const totalPages = first.pagination?.totalPages ?? 1;
            if (totalPages === 1) return first.data;
            const rest = await Promise.all(
                Array.from({ length: totalPages - 1 }, (_, i) =>
                    api.get(`/warehouses?page=${i + 2}&limit=20&search=${encodeURIComponent(search)}`)
                )
            );
            return [...first.data, ...rest.flatMap((r) => r.data)];
        });
    }, []);

    const {
        data: modalWarehouses = [],
        isLoading: warehouseLoading,
        isError: isWarehouseError,
        error: warehouseError,
    } = useQuery({
        queryKey: ["warehouses", "modal", debouncedWhSearch],
        queryFn: () => fetchAllWarehouses(debouncedWhSearch),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
        placeholderData: (prev) => prev,
        enabled: showAddModal,  // only fetch when modal is open
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Query: merchant SKU list
    // ─────────────────────────────────────────────────────────────────────────
    const listFilters = useMemo(() => ({
        page,
        limit: 10,
        search: debouncedSearch,
        sku: debouncedSku,
        warehouseId: warehouseFilter !== "all" ? warehouseFilter : undefined,
        status: productStatus,
        country: country,
        sortBy,
        sortOrder,
    }), [page, debouncedSearch, debouncedSku, warehouseFilter, productStatus, country, sortBy, sortOrder]);

    const {
        data: listData,
        isLoading: listLoading,
        isFetching: listFetching,
        isError: isListError,
        error: listError,
    } = useQuery({
        queryKey: MERCHANT_SKU_KEYS.list(listFilters),
        queryFn: () => fetchMerchantSkus(listFilters),
        staleTime: 1000 * 60 * 1,
        gcTime: 1000 * 60 * 3,
        placeholderData: (prev) => prev,
    });

    const products = listData?.data ?? [];
    const pagination = listData?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 20 };

    // ─────────────────────────────────────────────────────────────────────────
    // Mutation: create merchant SKU
    // ─────────────────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: createMerchantSku,
        onSuccess: (data) => {
            toast.success(`SKU "${data.sku_name}" created successfully`);
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.all() });
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.dropdowns() });
            setShowAddModal(false);
            setForm(EMPTY_FORM);
            setErrors({});
        },
        onError: (err) => {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message ?? err.message ?? "Failed to create SKU";

            if (status === 409) {
                // Duplicate SKU name
                setErrors({ skuName: msg });
                toast.error(msg);
                return;
            }

            if (status === 422) {
                // Validation errors
                const fieldErrors = err?.response?.data?.errors;
                if (fieldErrors?.length) {
                    const mapped = {};
                    fieldErrors.forEach(({ field, message }) => {
                        const localField = field === "skuTitle" ? "productName" : field;
                        mapped[localField] = message;
                    });
                    setErrors(mapped);
                }
            }

            toast.error(msg);
        },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Mutation: delete single
    // ─────────────────────────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: deleteMerchantSku,
        onSuccess: () => {
            toast.success("Product deleted successfully");
            setShowDeleteModal(false);
            setDeleteTarget(null);
            setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget?.id));
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.all() });
        },
        onError: (err) => {
            const msg = err?.response?.data?.message ?? "Failed to delete product";
            toast.error(msg);
        },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Mutation: bulk delete
    // ─────────────────────────────────────────────────────────────────────────
    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeleteMerchantSkus,
        onSuccess: (data) => {
            toast.success(`${data.deleted} product(s) deleted successfully`);
            setSelectedIds([]);
            setBulkDeleteConfirm(false);
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.all() });
        },
        onError: (err) => {
            const msg = err?.response?.data?.message ?? "Bulk delete failed";
            toast.error(msg);
        },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Form helpers
    // ─────────────────────────────────────────────────────────────────────────
    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    }, [errors]);

    const handlePhotoChange = useCallback((e) => {
        console.log("hanle to photo change");

        const file = e.target.files?.[0];
        if (!file) return;
        // Client-side size check (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB");
            return;
        }
        setForm((prev) => ({
            ...prev,
            photoFile: file,
            photoPreview: URL.createObjectURL(file),
        }));
    }, []);

    const handleWarehouseSelect = useCallback((warehouse) => {
        setForm((prev) => ({
            ...prev,
            warehouseId: String(warehouse.id),
            warehouseName: warehouse.name,
        }));
        if (errors.warehouseId) setErrors((prev) => ({ ...prev, warehouseId: "" }));
    }, [errors]);

    const validate = useCallback(() => {
        const e = {};
        if (!form.productName.trim()) e.productName = "Product Name is required";
        if (!form.skuName.trim()) e.skuName = "SKU Name is required";
        if (!form.productDetails.trim()) e.productDetails = "Product Details is required";
        if (form.productPrice && isNaN(Number(form.productPrice))) e.productPrice = "Must be a valid number";
        if (form.weight && isNaN(Number(form.weight))) e.weight = "Must be a valid number";
        return e;
    }, [form]);

    const handleSave = useCallback(async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length) {
            setErrors(validationErrors);
            toast.error("Please fix the highlighted fields");
            return;
        }
        createMutation.mutate(form);
    }, [form, validate, createMutation]);

    const handleCloseModal = useCallback(() => {
        console.log("call this function");

        setShowAddModal(false);
        setForm(EMPTY_FORM);
        setErrors({});
        setWarehouseSearch("");
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Delete helpers
    // ─────────────────────────────────────────────────────────────────────────
    const openDeleteModal = useCallback((product) => {
        setDeleteTarget(product);
        setShowDeleteModal(true);
    }, []);

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id);
    }, [deleteTarget, deleteMutation]);

    const confirmBulkDelete = useCallback(() => {
        if (!selectedIds.length) return;
        bulkDeleteMutation.mutate(selectedIds);
    }, [selectedIds, bulkDeleteMutation]);

    // ─────────────────────────────────────────────────────────────────────────
    // Selection helpers
    // ─────────────────────────────────────────────────────────────────────────
    const toggleSelect = useCallback((id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }, []);

    const toggleAll = useCallback(() => {
        const ids = products.map((p) => p.id);
        const allSel = ids.every((id) => selectedIds.includes(id));
        setSelectedIds(allSel ? [] : ids);
    }, [products, selectedIds]);

    // ─────────────────────────────────────────────────────────────────────────
    // Filter helpers
    // ─────────────────────────────────────────────────────────────────────────
    const resetFilters = useCallback(() => {
        setSearch("");
        setSku("");
        setWarehouseFilter("all");
        setWarehouseFilterName("All Warehouses");
        setProductStatus("all");
        setCountry("all");
        setPage(1);
    }, []);

    const hasActiveFilters =
        search.trim() || sku.trim() ||
        warehouseFilter !== "all" ||
        productStatus !== "all" ||
        country !== "all";

    const handleWarehouseFilterChange = useCallback((value, label) => {
        setWarehouseFilter(value);
        setWarehouseFilterName(label);
        setPage(1);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Bulk action handler
    // ─────────────────────────────────────────────────────────────────────────
    const handleBulkAction = useCallback((action) => {
        if (action === "delete" && selectedIds.length > 0) {
            setBulkDeleteConfirm(true);
        }
        setBulkAction(action);
    }, [selectedIds]);

    return {
        // ── filter state ────────────────────────────────────────────────────
        search, setSearch,
        warehouseFilter, warehouseFilterName, handleWarehouseFilterChange,
        productStatus, setProductStatus,
        country, setCountry,
        sku, setSku,
        bulkAction, setBulkAction, handleBulkAction,

        // ── dropdown options ─────────────────────────────────────────────────
        warehouseOptions,
        statusOptions,
        countryOptions,

        // ── product list data ────────────────────────────────────────────────
        products,
        pagination,
        page, setPage,
        listLoading,
        listFetching,
        isListError,
        listError,

        // ── selection ────────────────────────────────────────────────────────
        selectedIds,
        toggleSelect,
        toggleAll,
        allSelected: products.length > 0 && products.every((p) => selectedIds.includes(p.id)),
        someSelected: products.some((p) => selectedIds.includes(p.id)),

        // ── filter meta ──────────────────────────────────────────────────────
        resetFilters,
        hasActiveFilters,
        dropdownsLoading,
        isDropdownError,

        // ── add modal ────────────────────────────────────────────────────────
        showAddModal, setShowAddModal,
        form, setForm,
        errors, setErrors,
        fileInputRef,
        handleFormChange,
        handlePhotoChange,
        handleWarehouseSelect,
        handleSave,
        handleCloseModal,
        saving: createMutation.isPending,

        // ── warehouse search (inside modal) ──────────────────────────────────
        warehouseSearch, setWarehouseSearch,
        modalWarehouses,
        warehouseLoading,
        isWarehouseError,
        warehouseError,

        // ── delete ───────────────────────────────────────────────────────────
        deleteTarget,
        showDeleteModal, setShowDeleteModal,
        openDeleteModal,
        confirmDelete,
        deleting: deleteMutation.isPending,

        // ── bulk delete ──────────────────────────────────────────────────────
        bulkDeleteConfirm, setBulkDeleteConfirm,
        confirmBulkDelete,
        bulkDeleting: bulkDeleteMutation.isPending,
    };
}