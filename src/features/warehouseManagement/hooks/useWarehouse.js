// import { useState } from "react";
// import api from "../../../lib/api";
// import { toast } from "sonner";
// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import useDebounce from "../../../hooks/useDebounce";



// const fetchAllWarehouses = async (search = '') => {
//     const params = new URLSearchParams();
//     if (search) params.append('search', search);
//     params.append('limit', 100); // fetch all, adjust as needed

//     const response = await api.get(`/warehouses?${params.toString()}`);
//     return response.data; // returns the array directly
// };


// const PLATFORMS = [
//     "Platform Name Here",
//     "Lazada",
//     "Shopee",
//     "TikTok Shop",
//     "WooCommerce",
//     "Shopify",
//     "Amazon",
// ];

// const EMPTY_FORM = {
//     attribute: "own_warehouse",   // "own_warehouse" | "third_party_warehouse"
//     name: "",
//     manager: "",
//     phoneNumber: "",
//     location: "",
// };


// export function useWarehouse() {
//     const [platform, setPlatform] = useState("Platform Name Here");
//     const [showModal, setShowModal] = useState(false);
//     const [form, setForm] = useState(EMPTY_FORM);
//     const [errors, setErrors] = useState({});
//     const [saving, setSaving] = useState(false);
//     const [search, setSearch] = useState("");              // ✅ separate search state
//     const debouncedSearch = useDebounce(search, 300);     // ✅ debounce search, not warehouses

//     const queryClient = useQueryClient();

//     const {
//         data: warehouses = [],
//         isLoading: warehouseLoading,
//         isError: isWarehouseError,
//         error: warehouseError,
//     } = useQuery({
//         queryKey: ['warehouses-all', debouncedSearch],
//         queryFn: () => fetchAllWarehouses(debouncedSearch),
//         staleTime: 1000 * 60 * 2,
//         placeholderData: (prev) => prev,
//         select: (data) => data.map((w) => ({
//             id: w.id,
//             name: w.name,
//             attribute: w.attribute,
//             location: w.location || "—",
//             totalSku: w.total_sku ?? 0,
//             isDefault: w.is_default,
//             manager: w.manager_name,
//             phoneNumber: w.phone,
//             country: w.country,
//             status: w.status,
//             code: w.code,
//         })),
//     });

//     // ── Form handlers ─────────────────────────────────────────────────────────
//     const handleFormChange = (e) => {
//         const { name, value } = e.target;
//         setForm((prev) => ({ ...prev, [name]: value }));
//         if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
//     };

//     const handleAttributeChange = (value) => {
//         setForm((prev) => ({ ...prev, attribute: value }));
//     };

//     // ── Validation ────────────────────────────────────────────────────────────
//     const validate = () => {
//         const e = {};
//         if (!form.name.trim()) e.name = "Warehouse name is required";
//         return e;
//     };

//     // ── Open / close modal ────────────────────────────────────────────────────
//     const openModal = () => { setForm(EMPTY_FORM); setErrors({}); setShowModal(true); };
//     const closeModal = () => { setShowModal(false); setErrors({}); };

//     // ── Add warehouse ─────────────────────────────────────────────────────────
//     const handleAdd = async () => {
//         const e = validate();
//         if (Object.keys(e).length) { setErrors(e); return; }

//         setSaving(true);

//         try {
//             const payload = {
//                 name: form.name,
//                 attribute: form.attribute,
//                 managerName: form.manager,
//                 phone: form.phoneNumber,
//                 location: form.location || null,
//                 city: form.city || "",
//                 country: form.country,
//                 status: "active",
//             };



//             const response = await api.post('/warehouses', payload);

//             if (response.success) {
//                 toast.success('Warehouse created successfully');
//                 queryClient.invalidateQueries({ queryKey: ['warehouses-all'] });
//                 closeModal();
//             }

//         } catch (err) {
//             const serverErrors = err.response?.data?.errors;
//             const fallbackMessage = err.response?.data?.message || err.message || 'Something went wrong.';
//             const finalMessage = Array.isArray(serverErrors) && serverErrors.length > 0
//                 ? serverErrors[0].message
//                 : fallbackMessage;
//             setErrors({ api: finalMessage });
//             toast.error(finalMessage);
//             console.error(err)
//         } finally {
//             setSaving(false);
//         }
//     };

//     // ── Toggle default ────────────────────────────────────────────────────────
//     const toggleDefault = async (id) => {                  // ✅ API call instead of setWarehouses
//         try {
//             await api.patch(`/warehouses/${id}/default`);
//             queryClient.invalidateQueries({ queryKey: ['warehouses-all'] });
//         } catch (err) {
//             toast.error('Failed to update default warehouse');
//         }
//     };

//     return {
//         warehouses,
//         warehouseLoading,
//         isWarehouseError,
//         warehouseError,
//         platform, setPlatform,
//         platforms: PLATFORMS,
//         showModal, openModal, closeModal,
//         form, handleFormChange, handleAttributeChange,
//         errors,
//         saving,
//         handleAdd,
//         toggleDefault,
//         search, setSearch,                                 // ✅ expose for search input
//     };
// }


import { useState, useCallback } from "react";
import api from "../../../lib/api";
import { toast } from "sonner";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import useDebounce from "../../../hooks/useDebounce";

// ─────────────────────────────────────────────────────────────────────────────
// Constants — defined outside the hook for stable references (no re-creation
// on every render, safe to use in dependency arrays).
// ─────────────────────────────────────────────────────────────────────────────

export const PLATFORMS = [
    "Platform Name Here",
    "Lazada",
    "Shopee",
    "TikTok Shop",
    "WooCommerce",
    "Shopify",
    "Amazon",
];

const EMPTY_FORM = Object.freeze({
    attribute: "own_warehouse",   // "own_warehouse" | "third_party_warehouse"
    name: "",
    manager: "",
    phoneNumber: "",
    location: "",
    city: "",
    country: "",
});

// ── Query Keys — centralised so every invalidation/select is consistent ──────
export const WAREHOUSE_QUERY_KEY = (search = "") => ["warehouses-all", search];

// ─────────────────────────────────────────────────────────────────────────────
// Fetcher — outside hook: stable function reference, never re-created.
// ─────────────────────────────────────────────────────────────────────────────
const fetchAllWarehouses = async (search = "") => {
    const params = new URLSearchParams({ limit: "100" });
    if (search) params.append("search", search);
    const response = await api.get(`/warehouses?${params.toString()}`);
    return response.data;
};

// ── Selector — pure transform, stable reference, applied by React Query ──────
const selectWarehouses = (data) =>
    data.map((w) => ({
        id: w.id,
        name: w.name,
        attribute: w.attribute,
        location: w.location || "—",
        totalSku: w.total_sku ?? 0,
        isDefault: w.is_default,
        manager: w.manager_name,
        phoneNumber: w.phone,
        country: w.country,
        status: w.status,
        code: w.code,
    }));

// ─────────────────────────────────────────────────────────────────────────────
// Validation — pure function, outside hook.
// ─────────────────────────────────────────────────────────────────────────────
const validateWarehouseForm = (form) => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Warehouse name is required";
    return errors;
};

// ─────────────────────────────────────────────────────────────────────────────
export function useWarehouse() {
    const [platform, setPlatform] = useState(PLATFORMS[0]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [search, setSearch] = useState("");

    const debouncedSearch = useDebounce(search, 300);
    const queryClient = useQueryClient();

    // ── Warehouse list query ──────────────────────────────────────────────────
    const {
        data: warehouses = [],
        isLoading: warehouseLoading,
        isError: isWarehouseError,
        error: warehouseError,
    } = useQuery({
        queryKey: WAREHOUSE_QUERY_KEY(debouncedSearch),
        queryFn: () => fetchAllWarehouses(debouncedSearch),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,          // keep cache 5 min after unmount
        placeholderData: (prev) => prev, // show stale while refetching
        select: selectWarehouses,        // stable reference — React Query memoises
    });

    // ── Add warehouse mutation ────────────────────────────────────────────────
    // useMutation keeps loading/error state out of manual try/catch blocks and
    // lets React Query handle retry, cancellation, and devtools visibility.
    const addMutation = useMutation({
        mutationFn: (payload) => api.post("/warehouses", payload),
        onSuccess: () => {
            toast.success("Warehouse created successfully");
            queryClient.invalidateQueries({ queryKey: ["warehouses-all"] });
            closeModal();
        },
        onError: (err) => {
            const serverErrors = err.response?.data?.errors;
            const fallback = err.response?.data?.message || err.message || "Something went wrong.";
            const msg =
                Array.isArray(serverErrors) && serverErrors.length > 0
                    ? serverErrors[0].message
                    : fallback;
            setErrors({ api: msg });
            toast.error(msg);
        },
    });

    // ── Toggle-default mutation ───────────────────────────────────────────────
    const toggleDefaultMutation = useMutation({
        mutationFn: (id) => api.patch(`/warehouses/${id}/default`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["warehouses-all"] });
        },
        onError: () => {
            toast.error("Failed to update default warehouse");
        },
    });

    // ── Form handlers — useCallback prevents unnecessary child re-renders ─────
    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
    }, []);

    const handleAttributeChange = useCallback((value) => {
        setForm((prev) => ({ ...prev, attribute: value }));
    }, []);

    // ── Modal helpers ─────────────────────────────────────────────────────────
    const openModal = useCallback(() => {
        setForm(EMPTY_FORM);
        setErrors({});
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setErrors({});
    }, []);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleAdd = useCallback(() => {
        const e = validateWarehouseForm(form);
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }

        const payload = {
            name: form.name,
            attribute: form.attribute,
            managerName: form.manager || undefined,   // ✅ omit key entirely if empty
            phone: form.phoneNumber || undefined,
            location: form.location || undefined,
            city: form.city || undefined,   // ✅ was `|| null` — change to undefined
            country: form.country || undefined,
            status: "active",
        };


        addMutation.mutate(payload);
    }, [form, addMutation]);

    // ── Toggle default ────────────────────────────────────────────────────────
    const toggleDefault = useCallback(
        (id) => toggleDefaultMutation.mutate(id),
        [toggleDefaultMutation]
    );

    return {
        // data
        warehouses,
        warehouseLoading,
        isWarehouseError,
        warehouseError,
        // platform selector
        platform,
        setPlatform,
        platforms: PLATFORMS,
        // modal
        showModal,
        openModal,
        closeModal,
        // form
        form,
        handleFormChange,
        handleAttributeChange,
        errors,
        saving: addMutation.isPending,
        handleAdd,
        // default toggle
        toggleDefault,
        togglingDefault: toggleDefaultMutation.isPending,
        // search
        search,
        setSearch,
    };
}