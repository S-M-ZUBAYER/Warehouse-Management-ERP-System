// import { useState, useMemo } from "react";
// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import api from "../../../../lib/api";
// import { toast } from "sonner";

// const PAGE_LIMIT_ROLES = 10;


// // ── Helpers (defined OUTSIDE the hook — stable references) ───────────────────
// const formatPages = (nodes) =>
//     nodes.map((node) => ({
//         id: node.id,
//         key: node.key,
//         level: node.level,
//         display: node.key
//             .replace(/_/g, " ")
//             .replace(/\b\w/g, (char) => char.toUpperCase()),
//         sub: node.sub && node.sub.length > 0 ? formatPages(node.sub) : [],
//     }));

// const fetchRolesPage = async (page) => {
//     const response = await api.get(`/roles?page=${page}&limit=${PAGE_LIMIT_ROLES}`);
//     return response; // { data: [...], pagination: { totalPages, ... } }
// };

// // ── Normalize a single raw API role → UI shape ───────────────────────────────
// const normalizeRole = (r) => ({
//     id: r.id,
//     name: r.name,
//     linkStatus:
//         r.sub_account_linking_status === "not_linked" ? "Not Linked" : "Linked",
//     createdAt: new Date(r.createdAt).toLocaleString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//     }),
//     updatedAt: new Date(r.updatedAt).toLocaleString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//     }),
//     userCount: r.user_count,
//     description: r.description,
// });

// const EMPTY_FORM = { role: "", description: "", permissions: {} };

// // ── Build the nested permissions payload from flat form.permissions ───────────
// const buildPermissionsPayload = (permissions) => ({
//     dashboard: {
//         access: !!permissions["dashboard"]
//     },
//     product_management: {
//         access: !!permissions["product_management"],
//         sub: {
//             product_list: !!permissions["product_list"],
//             combine_sku: !!permissions["combine_sku"],
//         },
//     },
//     inventory_management: {
//         access: !!permissions["inventory_management"],
//         sub: {
//             inventory_list: !!permissions["inventory_list"],
//             inbound: {
//                 access: !!permissions["inbound"],
//                 sub: {
//                     inbound_draft: !!permissions["inbound_draft"],
//                     inbound_on_the_way: !!permissions["inbound_on_the_way"],
//                     inbound_complete: !!permissions["inbound_complete"],
//                 },
//             },
//         },
//     },
//     order_management: {
//         access: !!permissions["order_management"],
//         sub: {
//             order_processing: {
//                 access: !!permissions["order_processing"],
//                 sub: {
//                     new_order: !!permissions["new_order"],
//                     processed_order: !!permissions["processed_order"],
//                     shipped_order: !!permissions["shipped_order"],
//                     completed_order: !!permissions["completed_order"],
//                     all_order: !!permissions["all_order"],
//                     canceled_order: !!permissions["canceled_order"],
//                 },
//             },
//             manual_order: !!permissions["manual_order"],
//         },
//     },
//     warehouse_management: {
//         access: !!permissions["warehouse_management"]
//     },
//     system_configuration: {
//         access: !!permissions["system_configuration"],
//         sub: {
//             store_authorization: !!permissions["store_authorization"],
//             account_management: {
//                 access: !!permissions["account_management"],
//                 sub: {
//                     sub_account: !!permissions["sub_account"],
//                     role_management: !!permissions["role_management"],
//                 },
//             },
//         },
//     },
// });


// // ─────────────────────────────────────────────────────────────────────────────
// export function useRoleManagement() {
//     const queryClient = useQueryClient();

//     const [search, setSearch] = useState("");
//     const [openActionId, setOpenActionId] = useState(null);
//     const [showModal, setShowModal] = useState(false);
//     const [form, setForm] = useState(EMPTY_FORM);
//     const [errors, setErrors] = useState({});
//     const [saving, setSaving] = useState(false);
//     const [deleteModal, setDeleteModal] = useState({ open: false, role: null });
//     const [editModal, setEditModal] = useState({ open: false, role: null });
//     const [editForm, setEditForm] = useState(EMPTY_FORM);
//     const [editErrors, setEditErrors] = useState({});
//     const [editSaving, setEditSaving] = useState(false);
//     const [deleting, setDeleting] = useState(false);

//     // ── Fetch Dynamic Pages ───────────────────────────────────────────────────
//     const { data: nestedPages, isLoading: nestedPageLoading } = useQuery({
//         queryKey: ["pages-hierarchy"],
//         queryFn: async () => {
//             const response = await api.get("/pages");
//             return formatPages(response.data);
//         },
//     });

//     // ── Fetch ALL roles across all pages dynamically ──────────────────────────────
//     const {
//         data: roles = [],
//         isLoading: rolesLoading,
//         isError: isRolesError,        // ✅ added
//         error: rolesError,            // ✅ added
//     } = useQuery({
//         queryKey: ["roles-all"],
//         queryFn: async () => {
//             // Step 1: Fetch page 1 to learn totalPages
//             const first = await fetchRolesPage(1);
//             const { totalPages } = first.pagination;

//             // Step 2: Fetch remaining pages in parallel (if any)
//             const rest =
//                 totalPages > 1
//                     ? await Promise.all(
//                         Array.from({ length: totalPages - 1 }, (_, i) =>
//                             fetchRolesPage(i + 2)
//                         )
//                     )
//                     : [];

//             // Step 3: Flatten + normalize into UI shape
//             return [
//                 ...first.data,
//                 ...rest.flatMap((r) => r.data),
//             ].map(normalizeRole);
//         },
//         staleTime: 1000 * 60 * 5,
//         placeholderData: (prev) => prev,
//     });

//     // ── Filtered list (derived from cached roles) ─────────────────────────────────
//     const filtered = useMemo(() => {
//         if (!search.trim()) return roles;
//         const q = search.toLowerCase();
//         return roles.filter((r) => r.name.toLowerCase().includes(q));
//     }, [search, roles]);

//     // ── Form handlers ─────────────────────────────────────────────────────────
//     const handleFormChange = (e) => {
//         const { name, value } = e.target;
//         setForm((p) => ({ ...p, [name]: value }));
//         if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
//     };

//     const togglePermission = (pageKey, parentKey = null) => {
//         setForm((p) => {
//             const isCurrentlyChecked = !!p.permissions[pageKey];

//             if (!isCurrentlyChecked && parentKey && !p.permissions[parentKey]) {
//                 toast.error("Please select the parent category first.");
//                 return p;
//             }

//             const newPermissions = {
//                 ...p.permissions,
//                 [pageKey]: !isCurrentlyChecked,
//             };

//             // If unchecking a parent, also uncheck its children
//             if (isCurrentlyChecked && nestedPages) {
//                 const parent = nestedPages.find((pg) => pg.key === pageKey);
//                 if (parent?.sub?.length) {
//                     parent.sub.forEach((child) => {
//                         newPermissions[child.key] = false;
//                     });
//                 }
//             }

//             return { ...p, permissions: newPermissions };
//         });
//     };

//     const validate = () => {
//         const e = {};
//         if (!form.role.trim()) e.role = "Role name is required";
//         return e;
//     };

//     const openModal = () => {
//         setForm(EMPTY_FORM);
//         setErrors({});
//         setShowModal(true);
//     };

//     const closeModal = () => {
//         setShowModal(false);
//         setErrors({});
//     };

//     // ── Add Role ──────────────────────────────────────────────────────────────
//     const handleAdd = async () => {
//         const e = validate();
//         if (Object.keys(e).length) {
//             setErrors(e);
//             return;
//         }

//         setSaving(true);
//         try {
//             const payload = {
//                 name: form.role,
//                 description: form.description || "No description provided",
//                 subAccountLinkingStatus: "not_linked",
//                 permissions: buildPermissionsPayload(form.permissions),
//             };

//             const response = await api.post("/roles", payload);

//             if (response.success) {
//                 // ✅ FIX: Invalidate query so the list refetches with correct
//                 //         server data instead of manually pushing a raw object
//                 await queryClient.invalidateQueries({ queryKey: ["roles-all"] });
//                 toast.success("Role added successfully!");
//                 closeModal();
//             }
//         } catch (error) {
//             console.error("Add Role Error:", error);
//             toast.error(error.response?.data?.message || "Failed to add role");
//         } finally {
//             setSaving(false);
//         }
//     };

//     // ── Open / close helpers ──────────────────────────────────────────────────────
//     const openDeleteModal = (role) => {
//         setOpenActionId(null);
//         setDeleteModal({ open: true, role });
//     };
//     const closeDeleteModal = () => setDeleteModal({ open: false, role: null });

//     const openEditModal = (role) => {
//         setOpenActionId(null);
//         // Pre-populate form with existing role data
//         setEditForm({
//             role: role.name,
//             description: role.description || "",
//             permissions: {},          // permissions are fetched separately if needed
//         });
//         setEditErrors({});
//         setEditModal({ open: true, role });
//     };
//     const closeEditModal = () => {
//         setEditModal({ open: false, role: null });
//         setEditErrors({});
//     };

//     // ── Delete handler ────────────────────────────────────────────────────────────
//     const handleDelete = async () => {
//         if (!deleteModal.role) return;
//         setDeleting(true);
//         try {
//             const response = await api.delete(`/roles/${deleteModal.role.id}`);
//             if (response.success) {
//                 await queryClient.invalidateQueries({ queryKey: ["roles-all"] });
//                 toast.success("Role deleted successfully!");
//                 closeDeleteModal();
//             }
//         } catch (error) {
//             toast.error(error.response?.data?.message || "Failed to delete role");
//         } finally {
//             setDeleting(false);
//         }
//     };

//     // ── Edit form change handler ──────────────────────────────────────────────────
//     const handleEditFormChange = (e) => {
//         const { name, value } = e.target;
//         setEditForm((p) => ({ ...p, [name]: value }));
//         if (editErrors[name]) setEditErrors((p) => ({ ...p, [name]: "" }));
//     };

//     const toggleEditPermission = (pageKey, parentKey = null) => {
//         setEditForm((p) => {
//             const isCurrentlyChecked = !!p.permissions[pageKey];
//             if (!isCurrentlyChecked && parentKey && !p.permissions[parentKey]) {
//                 toast.error("Please select the parent category first.");
//                 return p;
//             }
//             const newPermissions = { ...p.permissions, [pageKey]: !isCurrentlyChecked };
//             if (isCurrentlyChecked && nestedPages) {
//                 const parent = nestedPages.find((pg) => pg.key === pageKey);
//                 if (parent?.sub?.length) {
//                     parent.sub.forEach((child) => { newPermissions[child.key] = false; });
//                 }
//             }
//             return { ...p, permissions: newPermissions };
//         });
//     };

//     const validateEdit = () => {
//         const e = {};
//         if (!editForm.role.trim()) e.role = "Role name is required";
//         return e;
//     };

//     // ── Edit submit handler ───────────────────────────────────────────────────────
//     const handleEdit = async () => {
//         const e = validateEdit();
//         if (Object.keys(e).length) { setEditErrors(e); return; }

//         setEditSaving(true);
//         try {
//             const payload = {
//                 name: editForm.role,
//                 description: editForm.description || "No description provided",
//                 subAccountLinkingStatus: editModal.role.linkStatus === "Linked"
//                     ? "linked"
//                     : "not_linked",
//                 permissions: buildPermissionsPayload(editForm.permissions),
//             };

//             const response = await api.put(`/roles/${editModal.role.id}`, payload);
//             if (response.success) {
//                 await queryClient.invalidateQueries({ queryKey: ["roles-all"] });
//                 toast.success("Role updated successfully!");
//                 closeEditModal();
//             }
//         } catch (error) {
//             toast.error(error.response?.data?.message || "Failed to update role");
//         } finally {
//             setEditSaving(false);
//         }
//     };

//     // ── Return ────────────────────────────────────────────────────────────────
//     return {
//         search,
//         setSearch,
//         roles: filtered,
//         rolesLoading,
//         isRolesError,
//         rolesError,
//         openActionId,
//         setOpenActionId,
//         showModal,
//         openModal,
//         closeModal,
//         form,
//         handleFormChange,
//         togglePermission,
//         errors,
//         saving,
//         handleAdd,
//         pages: nestedPages || [],
//         nestedPageLoading,
//         deleteModal, openDeleteModal, closeDeleteModal, handleDelete, deleting,
//         editModal, openEditModal, closeEditModal, handleEdit, editSaving,
//         editForm, handleEditFormChange, toggleEditPermission, editErrors,
//     };
// }



import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import api from "../../../../lib/api";
import { toast } from "sonner"; // ✅ unified: was sonner in original

// ─────────────────────────────────────────────────────────────────────────────
// Constants & query keys
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_LIMIT_ROLES = 10;

export const ROLES_QUERY_KEY = ["roles-all"];
export const PAGES_QUERY_KEY = ["pages-hierarchy"];

const EMPTY_FORM = Object.freeze({ role: "", description: "", permissions: {} });

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers — outside the hook so references are stable across renders.
// ─────────────────────────────────────────────────────────────────────────────

/** Recursively converts the flat key/sub tree from the API into a display shape. */
const formatPages = (nodes) =>
    nodes.map((node) => ({
        id: node.id,
        key: node.key,
        level: node.level,
        display: node.key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        sub: node.sub?.length ? formatPages(node.sub) : [],
    }));

/** Converts a raw API role into the UI shape used by the table. */
const normalizeRole = (r) => ({
    id: r.id,
    name: r.name,
    linkStatus:
        r.sub_account_linking_status === "not_linked" ? "Not Linked" : "Linked",
    createdAt: new Date(r.createdAt).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    }),
    updatedAt: new Date(r.updatedAt).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    }),
    userCount: r.user_count,
    description: r.description,
    // Keep the raw permissions so openEditModal can pre-populate correctly.
    rawPermissions: r.permissions ?? null,
});

/**
 * Builds the nested permissions payload the API expects from the flat
 * { [pageKey]: boolean } object that the form stores.
 *
 * If you add new pages in the future, extend this map accordingly.
 */
const buildPermissionsPayload = (p) => ({
    dashboard: { access: !!p.dashboard },
    product_management: {
        access: !!p.product_management,
        sub: {
            product_list: !!p.product_list,
            combine_sku: !!p.combine_sku,
        },
    },
    inventory_management: {
        access: !!p.inventory_management,
        sub: {
            inventory_list: !!p.inventory_list,
            inbound: {
                access: !!p.inbound,
                sub: {
                    inbound_draft: !!p.inbound_draft,
                    inbound_on_the_way: !!p.inbound_on_the_way,
                    inbound_complete: !!p.inbound_complete,
                },
            },
        },
    },
    order_management: {
        access: !!p.order_management,
        sub: {
            order_processing: {
                access: !!p.order_processing,
                sub: {
                    new_order: !!p.new_order,
                    processed_order: !!p.processed_order,
                    shipped_order: !!p.shipped_order,
                    completed_order: !!p.completed_order,
                    all_order: !!p.all_order,
                    canceled_order: !!p.canceled_order,
                },
            },
            manual_order: !!p.manual_order,
        },
    },
    warehouse_management: { access: !!p.warehouse_management },
    system_configuration: {
        access: !!p.system_configuration,
        sub: {
            store_authorization: !!p.store_authorization,
            account_management: {
                access: !!p.account_management,
                sub: {
                    sub_account: !!p.sub_account,
                    role_management: !!p.role_management,
                },
            },
        },
    },
});

/**
 * Flattens a nested permissions object (as returned by the API) back into
 * the { [pageKey]: boolean } shape the form uses.
 *
 * This lets the edit modal pre-populate checkboxes from real API data.
 */
const flattenPermissions = (nested, acc = {}) => {
    if (!nested || typeof nested !== "object") return acc;
    for (const [key, val] of Object.entries(nested)) {
        if (key === "access" || key === "sub") continue;
        if (typeof val === "boolean") {
            acc[key] = val;
        } else if (typeof val === "object" && val !== null) {
            if ("access" in val) acc[key] = !!val.access;
            if (val.sub) flattenPermissions(val.sub, acc);
        }
    }
    return acc;
};

// ─────────────────────────────────────────────────────────────────────────────
// Fetchers — outside hook for stable references
// ─────────────────────────────────────────────────────────────────────────────

const fetchRolesPage = (page) =>
    api.get(`/roles?page=${page}&limit=${PAGE_LIMIT_ROLES}`);

const fetchAllRoles = async () => {
    const first = await fetchRolesPage(1);
    const { totalPages } = first.pagination;
    const rest =
        totalPages > 1
            ? await Promise.all(
                Array.from({ length: totalPages - 1 }, (_, i) =>
                    fetchRolesPage(i + 2)
                )
            )
            : [];
    return [...first.data, ...rest.flatMap((r) => r.data)].map(normalizeRole);
};

const fetchPages = async () => {
    const response = await api.get("/pages");
    return formatPages(response.data);
};

// ─────────────────────────────────────────────────────────────────────────────
// Permission toggle logic — extracted so it can be shared between
// the "add" and "edit" forms without duplication.
// ─────────────────────────────────────────────────────────────────────────────

const applyPermissionToggle = (prevForm, pageKey, parentKey, nestedPages) => {
    const isCurrentlyChecked = !!prevForm.permissions[pageKey];

    // Block child selection if parent is unchecked
    if (!isCurrentlyChecked && parentKey && !prevForm.permissions[parentKey]) {
        toast.error("Please select the parent category first.");
        return prevForm; // return same reference — no re-render
    }

    const newPermissions = {
        ...prevForm.permissions,
        [pageKey]: !isCurrentlyChecked,
    };

    // Unchecking a parent → also uncheck all direct children
    if (isCurrentlyChecked && nestedPages) {
        const parent = nestedPages.find((pg) => pg.key === pageKey);
        if (parent?.sub?.length) {
            for (const child of parent.sub) {
                newPermissions[child.key] = false;
                // Recursively clear grandchildren if needed
                if (child.sub?.length) {
                    for (const grandchild of child.sub) {
                        newPermissions[grandchild.key] = false;
                    }
                }
            }
        }
    }

    return { ...prevForm, permissions: newPermissions };
};

// ─────────────────────────────────────────────────────────────────────────────
export function useRoleManagement() {
    const queryClient = useQueryClient();

    // ── UI state ──────────────────────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [openActionId, setOpenActionId] = useState(null);

    // Add modal
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});

    // Delete modal
    const [deleteModal, setDeleteModal] = useState({ open: false, role: null });

    // Edit modal
    const [editModal, setEditModal] = useState({ open: false, role: null });
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [editErrors, setEditErrors] = useState({});

    // ── Queries ───────────────────────────────────────────────────────────────

    const { data: nestedPages = [], isLoading: nestedPageLoading } = useQuery({
        queryKey: PAGES_QUERY_KEY,
        queryFn: fetchPages,
        staleTime: 1000 * 60 * 10, // pages rarely change — cache 10 min
        gcTime: 1000 * 60 * 20,
    });

    const {
        data: roles = [],
        isLoading: rolesLoading,
        isError: isRolesError,
        error: rolesError,
    } = useQuery({
        queryKey: ROLES_QUERY_KEY,
        queryFn: fetchAllRoles,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        placeholderData: (prev) => prev,
    });

    // Client-side search filter
    const filtered = useMemo(() => {
        if (!search.trim()) return roles;
        const q = search.toLowerCase();
        return roles.filter((r) => r.name.toLowerCase().includes(q));
    }, [search, roles]);

    // ── Add mutation ──────────────────────────────────────────────────────────
    const addMutation = useMutation({
        mutationFn: (payload) => api.post("/roles", payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
            toast.success("Role added successfully!");
            closeModal();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to add role");
        },
    });

    // ── Edit mutation ─────────────────────────────────────────────────────────
    const editMutation = useMutation({
        mutationFn: ({ id, payload }) => api.put(`/roles/${id}`, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
            toast.success("Role updated successfully!");
            closeEditModal();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to update role");
        },
    });

    // ── Delete mutation ───────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/roles/${id}`),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
            toast.success("Role deleted successfully!");
            closeDeleteModal();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to delete role");
        },
    });

    // ── Validation — pure ─────────────────────────────────────────────────────
    const validate = (f) => (!f.role.trim() ? { role: "Role name is required" } : {});
    const validateEdit = () => validate(editForm);

    // ── Add modal helpers ─────────────────────────────────────────────────────
    const openModal = useCallback(() => {
        setForm(EMPTY_FORM);
        setErrors({});
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setErrors({});
    }, []);

    // ── Form change handlers — stable useCallback ─────────────────────────────
    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        setErrors((p) => (p[name] ? { ...p, [name]: "" } : p));
    }, []);

    const handleEditFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setEditForm((p) => ({ ...p, [name]: value }));
        setEditErrors((p) => (p[name] ? { ...p, [name]: "" } : p));
    }, []);

    // ── Permission toggles — shared logic via applyPermissionToggle ───────────
    const togglePermission = useCallback(
        (pageKey, parentKey = null) =>
            setForm((prev) => applyPermissionToggle(prev, pageKey, parentKey, nestedPages)),
        [nestedPages]
    );

    const toggleEditPermission = useCallback(
        (pageKey, parentKey = null) =>
            setEditForm((prev) => applyPermissionToggle(prev, pageKey, parentKey, nestedPages)),
        [nestedPages]
    );

    // ── Submit — Add ──────────────────────────────────────────────────────────
    const handleAdd = useCallback(() => {
        const e = validate(form);
        if (Object.keys(e).length) { setErrors(e); return; }

        addMutation.mutate({
            name: form.role,
            description: form.description || "No description provided",
            subAccountLinkingStatus: "not_linked",
            permissions: buildPermissionsPayload(form.permissions),
        });
    }, [form, addMutation]);

    // ── Delete helpers ────────────────────────────────────────────────────────
    const openDeleteModal = useCallback((role) => { setOpenActionId(null); setDeleteModal({ open: true, role }); }, []);
    const closeDeleteModal = useCallback(() => setDeleteModal({ open: false, role: null }), []);

    const handleDelete = useCallback(() => {
        if (!deleteModal.role) return;
        deleteMutation.mutate(deleteModal.role.id);
    }, [deleteModal.role, deleteMutation]);

    // ── Edit modal helpers ────────────────────────────────────────────────────
    const openEditModal = useCallback((role) => {
        setOpenActionId(null);

        // Pre-populate permissions from rawPermissions stored during normalizeRole.
        // This means the edit modal actually reflects the server state — the
        // original code always opened with empty permissions ({}).
        const prePopulatedPermissions = role.rawPermissions
            ? flattenPermissions(role.rawPermissions)
            : {};

        setEditForm({
            role: role.name,
            description: role.description || "",
            permissions: prePopulatedPermissions,
        });
        setEditErrors({});
        setEditModal({ open: true, role });
    }, []);

    const closeEditModal = useCallback(() => {
        setEditModal({ open: false, role: null });
        setEditErrors({});
    }, []);

    // ── Submit — Edit ─────────────────────────────────────────────────────────
    const handleEdit = useCallback(() => {
        // inline validate directly — no external dependency needed
        const e = !editForm.role.trim() ? { role: "Role name is required" } : {};
        if (Object.keys(e).length) { setEditErrors(e); return; }

        editMutation.mutate({
            id: editModal.role.id,
            payload: {
                name: editForm.role,
                description: editForm.description || "No description provided",
                subAccountLinkingStatus:
                    editModal.role.linkStatus === "Linked" ? "linked" : "not_linked",
                permissions: buildPermissionsPayload(editForm.permissions),
            },
        });
    }, [editForm, editModal, editMutation]);

    // ─────────────────────────────────────────────────────────────────────────
    return {
        // search / list
        search, setSearch,
        roles: filtered,
        rolesLoading,
        isRolesError,
        rolesError,

        // action dropdown
        openActionId, setOpenActionId,

        // add modal
        showModal, openModal, closeModal,
        form, handleFormChange,
        togglePermission,
        errors,
        saving: addMutation.isPending,
        handleAdd,

        // pages tree for permission checkboxes
        pages: nestedPages,
        nestedPageLoading,

        // delete modal
        deleteModal, openDeleteModal, closeDeleteModal,
        handleDelete,
        deleting: deleteMutation.isPending,

        // edit modal
        editModal, openEditModal, closeEditModal,
        handleEdit,
        editSaving: editMutation.isPending,
        editForm, handleEditFormChange,
        toggleEditPermission,
        editErrors,
    };
}