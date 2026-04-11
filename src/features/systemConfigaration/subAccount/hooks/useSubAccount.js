// import { useState, useMemo, useRef } from "react";
// import api from "../../../../lib/api";
// import useDebounce from "../../../../hooks/useDebounce";
// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";



// const MARKETPLACE_STORES = [
//     { id: 1, marketplace: "Shopee", storeName: "Shopee1" },
//     { id: 2, marketplace: "Shopee", storeName: "Shopee2" },
//     { id: 3, marketplace: "Lazada", storeName: "Lazada1" },
//     { id: 4, marketplace: "Lazada", storeName: "Lazada2" },
//     { id: 5, marketplace: "TikTok", storeName: "TikTok1" },
//     { id: 6, marketplace: "TikTok", storeName: "TikTok2" },
//     { id: 7, marketplace: "TikTok", storeName: "TikTok3" },
// ];

// const EMPTY_FORM = {
//     photo: null,
//     photoPreview: null,
//     roleId: "",
//     warehouseId: "",
//     accountId: "",
//     password: "",
//     name: "",
//     department: "",
//     designation: "",
//     phoneNumber: "",
//     email: "",
//     address: "",
// };

// const cleanAvatar = (url) => {
//     if (!url) return null;
//     return url.replace(/^(data:image\/\w+;base64,)+/, 'data:image/jpeg;base64,');
// };

// const fetchAllWarehouses = async (search = '') => {
//     const firstRes = await api.get(`/warehouses?page=1&limit=20&search=${search}`);
//     const totalPages = firstRes.pagination?.totalPages ?? 1;
//     if (totalPages === 1) return firstRes.data;
//     const rest = await Promise.all(
//         Array.from({ length: totalPages - 1 }, (_, i) =>
//             api.get(`/warehouses?page=${i + 2}&limit=20&search=${search}`)
//         )
//     );
//     return [...firstRes.data, ...rest.flatMap((r) => r.data)];
// };

// const fetchAllRoles = async () => {
//     const firstRes = await api.get(`/roles?page=1&limit=20`);
//     const totalPages = firstRes.pagination?.totalPages ?? 1;
//     if (totalPages === 1) return firstRes.data;
//     const rest = await Promise.all(
//         Array.from({ length: totalPages - 1 }, (_, i) =>
//             api.get(`/roles?page=${i + 2}&limit=20`)
//         )
//     );
//     return [...firstRes.data, ...rest.flatMap((r) => r.data)];
// };

// const fetchAllUsers = async () => {
//     const firstRes = await api.get(`/users?page=1&limit=20`);
//     const totalPages = firstRes.pagination?.totalPages ?? 1;
//     if (totalPages === 1) return firstRes.data;
//     const rest = await Promise.all(
//         Array.from({ length: totalPages - 1 }, (_, i) =>
//             api.get(`/users?page=${i + 2}&limit=20`)
//         )
//     );
//     return [...firstRes.data, ...rest.flatMap((r) => r.data)];
// };

// export function useSubAccount() {
//     const [search, setSearch] = useState("");
//     const [selectedIds, setSelectedIds] = useState([]);
//     const [openActionId, setOpenActionId] = useState(null);

//     const [showAddPage, setShowAddPage] = useState(false);
//     const [form, setForm] = useState(EMPTY_FORM);
//     const [errors, setErrors] = useState({});
//     const [saving, setSaving] = useState(false);
//     const [deleteTarget, setDeleteTarget] = useState(null);
//     const [deleting, setDeleting] = useState(false);
//     const [editAccount, setEditAccount] = useState(null);

//     const [storeSearch, setStoreSearch] = useState("");
//     const [warehouseSearch, setWarehouseSearch] = useState("");
//     const [selectedStores, setSelectedStores] = useState([]);
//     const [selectedWarehouses, setSelectedWarehouses] = useState([]);
//     const [storeMarketplace, setStoreMarketplace] = useState("All");

//     const debouncedSearch = useDebounce(warehouseSearch, 300);
//     const queryClient = useQueryClient();
//     const fileInputRef = useRef(null);

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
//     });
//     const filteredWarehouses = warehouses;

//     const filteredStores = useMemo(() => {
//         let list = MARKETPLACE_STORES;
//         if (storeSearch.trim()) {
//             const q = storeSearch.toLowerCase();
//             list = list.filter((s) =>
//                 s.marketplace.toLowerCase().includes(q) ||
//                 s.storeName.toLowerCase().includes(q)
//             );
//         }
//         return list;
//     }, [storeSearch]);

//     const {
//         data: roles = [],
//         isLoading: rolesLoading,
//         isError: rolesError,
//     } = useQuery({
//         queryKey: ['roles-all'],
//         queryFn: fetchAllRoles,
//         staleTime: 1000 * 60 * 5,
//     });

//     const roleOptions = roles.map((r) => ({
//         name: r.name,
//         id: r.id,
//     }));

//     const {
//         data: rawAccounts = [],
//         isLoading: accountLoading,
//         isError: accountError,
//     } = useQuery({
//         queryKey: ['sub-accounts'],
//         queryFn: fetchAllUsers,
//         staleTime: 1000 * 60 * 2,
//     });

//     const filtered = useMemo(() => {
//         if (!search.trim()) return rawAccounts;
//         const q = search.toLowerCase();
//         return rawAccounts.filter((a) =>
//             a.name?.toLowerCase().includes(q) ||
//             a.account_id?.toLowerCase().includes(q) ||
//             a.roleInfo?.name?.toLowerCase().includes(q)
//         );
//     }, [search, rawAccounts]);

//     const toggleSelect = (id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
//     const toggleStore = (id) => setSelectedStores((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
//     const toggleWarehouse = (id) => setSelectedWarehouses((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

//     const handleFormChange = (e) => {
//         const { name, value } = e.target;
//         setForm((p) => ({ ...p, [name]: value }));
//         if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
//     };

//     const validate = () => {
//         const e = {};
//         if (!form.name.trim()) e.name = "Name is required";
//         if (!form.accountId.trim()) e.accountId = "Account ID is required";
//         // Password only required when CREATING — optional on edit
//         if (!editAccount && !form.password.trim()) e.password = "Password is required";
//         if (!form.roleId) e.roleId = "Role is required";
//         return e;
//     };

//     const handlePhotoChange = (e) => {
//         const file = e.target.files[0];
//         if (!file) return;
//         const reader = new FileReader();
//         reader.onloadend = () => {
//             setForm((prev) => ({ ...prev, photoPreview: reader.result }));
//         };
//         reader.readAsDataURL(file);
//     };

//     const handleDropChange = (e) => {
//         e.preventDefault();
//         const file = e.dataTransfer.files[0];
//         if (file) {
//             const syntheticEvent = { target: { files: [file] } };
//             handlePhotoChange(syntheticEvent);
//         }
//     };

//     // ─────────────────────────────────────────────────────────────────────────
//     // handleOpenAdd — called by the "Add Account" button
//     // Always starts with a completely clean slate so a previous edit session
//     // can never bleed into a new create session.
//     // ─────────────────────────────────────────────────────────────────────────
//     const handleOpenAdd = () => {
//         setEditAccount(null);        // ✅ clear edit target FIRST
//         setForm(EMPTY_FORM);         // ✅ blank every field
//         setErrors({});
//         setSelectedStores([]);       // ✅ clear permission checkboxes
//         setSelectedWarehouses([]);
//         setStoreSearch("");
//         setWarehouseSearch("");
//         setShowAddPage(true);
//     };

//     // ─────────────────────────────────────────────────────────────────────────
//     // handleEditClick — pre-fills the form from the account's API shape.
//     //
//     // Key fixes vs the broken version:
//     //  1. roleId / warehouseId cast to String() — HTML <select> values are
//     //     always strings, so a numeric id from the API never matched.
//     //  2. phoneNumber: tries both acc.phone and acc.phoneNumber field names.
//     //  3. storePermissions / warehousePermissions: reads the nested permission
//     //     arrays the API actually returns instead of flat storeIds/warehouseIds.
//     // ─────────────────────────────────────────────────────────────────────────
//     const handleEditClick = (acc) => {
//         setEditAccount(acc);
//         console.log(acc);

//         setForm({
//             photo: null,
//             roleId: String(acc.roleInfo?.id ?? ""),   // ✅ cast to string
//             warehouseId: String(acc.warehouseId ?? ""),   // ✅ cast to string
//             accountId: acc.account_id ?? "",
//             password: "",                                 // never pre-fill
//             name: acc.name ?? "",
//             department: acc.department ?? "",
//             designation: acc.designation ?? "",
//             phoneNumber: acc.phone ?? acc.phoneNumber ?? "", // ✅ both field names
//             email: acc.email ?? "",
//             address: acc.address ?? "",
//             photoPreview: cleanAvatar(acc.avatar_url) ?? null,
//         });

//         // ✅ Extract ids from nested permission objects the API returns
//         const preStores = (acc.storePermissions ?? []).map(
//             (p) => p.connectionId ?? p.id
//         );
//         setSelectedStores(preStores.length ? preStores : (acc.storeIds ?? []));

//         const preWarehouses = (acc.warehousePermissions ?? []).map(
//             (p) => p.warehouseId ?? p.id
//         );
//         setSelectedWarehouses(preWarehouses.length ? preWarehouses : (acc.warehouseIds ?? []));

//         setErrors({});
//         setStoreSearch("");
//         setWarehouseSearch("");
//         setShowAddPage(true);
//     };

//     // ─────────────────────────────────────────────────────────────────────────
//     // handleBack — resets everything when leaving the add/edit page
//     // ─────────────────────────────────────────────────────────────────────────
//     const handleBack = () => {
//         setShowAddPage(false);
//         setEditAccount(null);
//         setForm(EMPTY_FORM);
//         setErrors({});
//         setSelectedStores([]);
//         setSelectedWarehouses([]);
//     };

//     const handleSave = async () => {
//         const e = validate();
//         if (Object.keys(e).length) {
//             setErrors(e);
//             return;
//         }

//         setSaving(true);

//         try {
//             const payload = {
//                 name: form.name,
//                 email: form.email,
//                 accountId: form.accountId,
//                 department: form.department,
//                 designation: form.designation,
//                 phone: form.phoneNumber,
//                 avatar: form.photoPreview ?? null,
//                 address: form.address ?? null,
//                 roleId: Number(form.roleId) || null,
//                 warehouseId: Number(form.warehouseId) || null,
//                 storePermissions: selectedStores.map((id) => ({
//                     connectionId: id,
//                     canView: true,
//                     canEdit: true,
//                 })),
//                 warehousePermissions: selectedWarehouses.map((id) => ({
//                     warehouseId: id,
//                     canView: true,
//                     canEdit: true,
//                 })),
//                 // Only send password when user typed something
//                 ...(form.password.trim() && { password: form.password }),
//             };

//             let response;
//             if (editAccount) {
//                 response = await api.put(`/users/${editAccount.id}`, payload);
//             } else {
//                 response = await api.post('/users/upsert', payload);
//             }

//             if (response.success) {
//                 toast.success(editAccount ? 'Account updated successfully' : 'Account created successfully');
//                 queryClient.invalidateQueries({ queryKey: ['sub-accounts'] });
//                 handleBack(); // ✅ resets cleanly after save
//             }

//         } catch (err) {
//             const serverErrors = err.response?.data?.errors;
//             const fallbackMessage = err.response?.data?.message || err.message || 'Something went wrong.';
//             const finalMessage = Array.isArray(serverErrors) && serverErrors.length > 0
//                 ? serverErrors[0].message
//                 : fallbackMessage;
//             setErrors({ api: finalMessage });
//             toast.error(finalMessage);
//         } finally {
//             setSaving(false);
//         }
//     };

//     const handleAccountDelete = async () => {
//         setDeleting(true);
//         try {
//             const response = await api.delete(`/users/${deleteTarget.id}`);
//             if (response.success) {
//                 toast.success('Account deleted successfully');
//                 queryClient.invalidateQueries({ queryKey: ['sub-accounts'] });
//                 setDeleteTarget(null);
//             }
//         } catch (err) {
//             toast.error(err.response?.data?.message || 'Failed to delete account');
//         } finally {
//             setDeleting(false);
//         }
//     };

//     return {
//         search, setSearch,
//         accounts: filtered,
//         accountLoading,
//         accountError,
//         selectedIds, toggleSelect, setOpenActionId, openActionId,
//         showAddPage, setShowAddPage,
//         form, handleFormChange, handlePhotoChange, handleDropChange, fileInputRef,
//         handleAccountDelete,
//         errors, saving, handleSave,
//         editAccount,
//         handleEditClick,
//         handleOpenAdd,   // ✅ NEW — use this for the Add Account button
//         handleBack,      // ✅ use this for Back/Cancel buttons
//         storeSearch, setStoreSearch,
//         warehouseSearch, setWarehouseSearch,
//         storeMarketplace, setStoreMarketplace,
//         filteredStores,
//         filteredWarehouses,
//         selectedStores, selectedWarehouses,
//         toggleStore, toggleWarehouse,
//         roles: roleOptions,
//         rolesLoading,
//         rolesError,
//         warehouses,
//         warehouseError,
//         isWarehouseError,
//         warehouseLoading,
//         deleteTarget, setDeleteTarget, deleting, setDeleting,
//         cleanAvatar,
//     };
// }

import { useState, useMemo, useRef, useCallback } from "react";
import api from "../../../../lib/api";
import useDebounce from "../../../../hooks/useDebounce";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// NOTE: Replace this with a real API call (/connections or /stores) once
// the back-end endpoint is available. Hardcoded data should never ship to
// production — it drifts from reality and can't be invalidated/re-fetched.
const MARKETPLACE_STORES = [
    { id: 1, marketplace: "Shopee", storeName: "Shopee1" },
    { id: 2, marketplace: "Shopee", storeName: "Shopee2" },
    { id: 3, marketplace: "Lazada", storeName: "Lazada1" },
    { id: 4, marketplace: "Lazada", storeName: "Lazada2" },
    { id: 5, marketplace: "TikTok", storeName: "TikTok1" },
    { id: 6, marketplace: "TikTok", storeName: "TikTok2" },
    { id: 7, marketplace: "TikTok", storeName: "TikTok3" },
];

const EMPTY_FORM = Object.freeze({
    photo: null,
    photoPreview: null,
    roleId: "",
    warehouseId: "",
    accountId: "",
    password: "",
    name: "",
    department: "",
    designation: "",
    phoneNumber: "",
    email: "",
    address: "",
});

// ── Query Keys ────────────────────────────────────────────────────────────────
export const SUB_ACCOUNT_QUERY_KEY = ["sub-accounts"];
export const ROLES_ALL_QUERY_KEY = ["roles-all"];
const warehouseQueryKey = (search) => ["warehouses-all", search];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — defined outside the hook for stable references
// ─────────────────────────────────────────────────────────────────────────────

// Strip duplicate base64 prefixes that some image pickers produce.
export const cleanAvatar = (url) => {
    if (!url) return null;
    return url.replace(/^(data:image\/\w+;base64,)+/, "data:image/jpeg;base64,");
};

// Paginated fetcher — fetches page 1 first, then fires remaining pages in
// parallel. A single round-trip if totalPages === 1 (the common case).
const fetchPaginated = async (baseUrl) => {
    const first = await api.get(`${baseUrl}?page=1&limit=20`);
    const totalPages = first.pagination?.totalPages ?? 1;
    if (totalPages === 1) return first.data;

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
            api.get(`${baseUrl}?page=${i + 2}&limit=20`)
        )
    );
    return [...first.data, ...rest.flatMap((r) => r.data)];
};

const fetchAllWarehouses = (search = "") => {
    const qs = search ? `?page=1&limit=20&search=${encodeURIComponent(search)}` : "?page=1&limit=20";
    return api
        .get(`/warehouses${qs}`)
        .then(async (first) => {
            const totalPages = first.pagination?.totalPages ?? 1;
            if (totalPages === 1) return first.data;
            const rest = await Promise.all(
                Array.from({ length: totalPages - 1 }, (_, i) =>
                    api.get(`/warehouses?page=${i + 2}&limit=20&search=${encodeURIComponent(search)}`)
                )
            );
            return [...first.data, ...rest.flatMap((r) => r.data)];
        });
};

const fetchAllRoles = () => fetchPaginated("/roles");
const fetchAllUsers = () => fetchPaginated("/users");

// ─────────────────────────────────────────────────────────────────────────────
// Validation — pure, outside the hook
// ─────────────────────────────────────────────────────────────────────────────
const validateSubAccountForm = (form, isEdit) => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.accountId.trim()) e.accountId = "Account ID is required";
    if (!isEdit && !form.password.trim()) e.password = "Password is required";
    if (!form.roleId) e.roleId = "Role is required";
    return e;
};

// ─────────────────────────────────────────────────────────────────────────────
export function useSubAccount() {
    // ── UI state ──────────────────────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [openActionId, setOpenActionId] = useState(null);

    // ── Add / Edit page ───────────────────────────────────────────────────────
    const [showAddPage, setShowAddPage] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [editAccount, setEditAccount] = useState(null);

    // ── Delete dialog ─────────────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState(null);

    // ── Permission pickers ────────────────────────────────────────────────────
    const [storeSearch, setStoreSearch] = useState("");
    const [warehouseSearch, setWarehouseSearch] = useState("");
    const [selectedStores, setSelectedStores] = useState([]);
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);
    const [storeMarketplace, setStoreMarketplace] = useState("All");

    const debouncedWarehouseSearch = useDebounce(warehouseSearch, 300);
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);

    // ── Warehouse query ───────────────────────────────────────────────────────
    const {
        data: warehouses = [],
        isLoading: warehouseLoading,
        isError: isWarehouseError,
        error: warehouseError,
    } = useQuery({
        queryKey: warehouseQueryKey(debouncedWarehouseSearch),
        queryFn: () => fetchAllWarehouses(debouncedWarehouseSearch),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
        placeholderData: (prev) => prev,
    });

    // ── Roles query ───────────────────────────────────────────────────────────
    const {
        data: rolesRaw = [],
        isLoading: rolesLoading,
        isError: rolesError,
    } = useQuery({
        queryKey: ROLES_ALL_QUERY_KEY,
        queryFn: fetchAllRoles,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });

    // Derived: mapped to { id, name } options — useMemo ensures reference
    // stability so child selects don't re-render unnecessarily.
    const roleOptions = useMemo(
        () => rolesRaw.map((r) => ({ id: r.id, name: r.name })),
        [rolesRaw]
    );

    // ── Sub-accounts query ────────────────────────────────────────────────────
    const {
        data: rawAccounts = [],
        isLoading: accountLoading,
        isError: accountError,
    } = useQuery({
        queryKey: SUB_ACCOUNT_QUERY_KEY,
        queryFn: fetchAllUsers,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
    });

    // Client-side search filter — only re-runs when search or rawAccounts change
    const filteredAccounts = useMemo(() => {
        if (!search.trim()) return rawAccounts;
        const q = search.toLowerCase();
        return rawAccounts.filter(
            (a) =>
                a.name?.toLowerCase().includes(q) ||
                a.account_id?.toLowerCase().includes(q) ||
                a.roleInfo?.name?.toLowerCase().includes(q)
        );
    }, [search, rawAccounts]);

    // Store filter — stable useMemo
    const filteredStores = useMemo(() => {
        if (!storeSearch.trim()) return MARKETPLACE_STORES;
        const q = storeSearch.toLowerCase();
        return MARKETPLACE_STORES.filter(
            (s) =>
                s.marketplace.toLowerCase().includes(q) ||
                s.storeName.toLowerCase().includes(q)
        );
    }, [storeSearch]);

    // ── Save mutation ─────────────────────────────────────────────────────────
    const saveMutation = useMutation({
        mutationFn: ({ payload, editAccount }) =>
            editAccount
                ? api.put(`/users/${editAccount.id}`, payload)
                : api.post("/users/upsert", payload),
        onSuccess: (_, { editAccount }) => {
            toast.success(editAccount ? "Account updated successfully" : "Account created successfully");
            queryClient.invalidateQueries({ queryKey: SUB_ACCOUNT_QUERY_KEY });
            resetAndClose();
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

    // ── Delete mutation ───────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/users/${id}`),
        onSuccess: () => {
            toast.success("Account deleted successfully");
            queryClient.invalidateQueries({ queryKey: SUB_ACCOUNT_QUERY_KEY });
            setDeleteTarget(null);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to delete account");
        },
    });

    // ── Internal reset helper ─────────────────────────────────────────────────
    const resetAndClose = useCallback(() => {
        setShowAddPage(false);
        setEditAccount(null);
        setForm(EMPTY_FORM);
        setErrors({});
        setSelectedStores([]);
        setSelectedWarehouses([]);
        setStoreSearch("");
        setWarehouseSearch("");
    }, []);

    // ── Form handlers — stable useCallback ───────────────────────────────────
    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        setErrors((p) => (p[name] ? { ...p, [name]: "" } : p));
    }, []);

    const handlePhotoChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () =>
            setForm((prev) => ({ ...prev, photoPreview: reader.result }));
        reader.readAsDataURL(file);
    }, []);

    const handleDropChange = useCallback(
        (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handlePhotoChange({ target: { files: [file] } });
        },
        [handlePhotoChange]
    );

    // ── Open "Add Account" — always starts clean ──────────────────────────────
    const handleOpenAdd = useCallback(() => {
        setEditAccount(null);
        setForm(EMPTY_FORM);
        setErrors({});
        setSelectedStores([]);
        setSelectedWarehouses([]);
        setStoreSearch("");
        setWarehouseSearch("");
        setShowAddPage(true);
    }, []);

    // ── Open edit — pre-fills form from API data ──────────────────────────────
    const handleEditClick = useCallback((acc) => {
        setEditAccount(acc);

        setForm({
            photo: null,
            // Cast to String — HTML <select> values are always strings;
            // a numeric id from the API would never match otherwise.
            roleId: String(acc.roleInfo?.id ?? ""),
            warehouseId: String(acc.warehouseId ?? ""),
            accountId: acc.account_id ?? "",
            password: "",                              // never pre-fill
            name: acc.name ?? "",
            department: acc.department ?? "",
            designation: acc.designation ?? "",
            // API may return `phone` or `phoneNumber` — handle both
            phoneNumber: acc.phone ?? acc.phoneNumber ?? "",
            email: acc.email ?? "",
            address: acc.address ?? "",
            photoPreview: cleanAvatar(acc.avatar_url) ?? null,
        });

        // Extract ids from the nested permission objects the API returns
        const preStores = (acc.storePermissions ?? []).map(
            (p) => p.connectionId ?? p.id
        );
        setSelectedStores(preStores.length ? preStores : (acc.storeIds ?? []));

        const preWarehouses = (acc.warehousePermissions ?? []).map(
            (p) => p.warehouseId ?? p.id
        );
        setSelectedWarehouses(preWarehouses.length ? preWarehouses : (acc.warehouseIds ?? []));

        setErrors({});
        setStoreSearch("");
        setWarehouseSearch("");
        setShowAddPage(true);
    }, []);

    // ── Back / Cancel ─────────────────────────────────────────────────────────
    const handleBack = useCallback(() => resetAndClose(), [resetAndClose]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSave = useCallback(() => {
        const e = validateSubAccountForm(form, !!editAccount);
        if (Object.keys(e).length) { setErrors(e); return; }

        const payload = {
            name: form.name,
            email: form.email,
            accountId: form.accountId,
            department: form.department,
            designation: form.designation,
            phone: form.phoneNumber,
            avatar: form.photoPreview ?? null,
            address: form.address ?? null,
            roleId: Number(form.roleId) || null,
            warehouseId: Number(form.warehouseId) || null,
            storePermissions: selectedStores.map((id) => ({
                connectionId: id,
                canView: true,
                canEdit: true,
            })),
            warehousePermissions: selectedWarehouses.map((id) => ({
                warehouseId: id,
                canView: true,
                canEdit: true,
            })),
            // Only include password when the user actually typed one
            ...(form.password.trim() && { password: form.password }),
        };

        saveMutation.mutate({ payload, editAccount });
    }, [form, editAccount, selectedStores, selectedWarehouses, saveMutation]);

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleAccountDelete = useCallback(() => {
        if (!deleteTarget?.id) return;
        deleteMutation.mutate(deleteTarget.id);
    }, [deleteTarget, deleteMutation]);

    // ── Selection toggles ─────────────────────────────────────────────────────
    const toggleSelect = useCallback((id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]), []);
    const toggleStore = useCallback((id) => setSelectedStores((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]), []);
    const toggleWarehouse = useCallback((id) => setSelectedWarehouses((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]), []);

    // ─────────────────────────────────────────────────────────────────────────
    return {
        // search / list
        search, setSearch,
        accounts: filteredAccounts,
        accountLoading,
        accountError,

        // row selection
        selectedIds, toggleSelect,

        // action dropdown
        openActionId, setOpenActionId,

        // add / edit page
        showAddPage, setShowAddPage,
        form, handleFormChange,
        handlePhotoChange, handleDropChange,
        fileInputRef,
        errors,
        saving: saveMutation.isPending,
        handleSave,
        editAccount,
        handleEditClick,
        handleOpenAdd,
        handleBack,

        // store / warehouse pickers
        storeSearch, setStoreSearch,
        warehouseSearch, setWarehouseSearch,
        storeMarketplace, setStoreMarketplace,
        filteredStores,
        filteredWarehouses: warehouses,

        // permission selection
        selectedStores, selectedWarehouses,
        toggleStore, toggleWarehouse,

        // roles dropdown
        roles: roleOptions,
        rolesLoading,
        rolesError,

        // warehouses dropdown
        warehouses,
        warehouseLoading,
        isWarehouseError,
        warehouseError,

        // delete dialog
        deleteTarget, setDeleteTarget,
        deleting: deleteMutation.isPending,
        handleAccountDelete,

        // utility
        cleanAvatar,
    };
}