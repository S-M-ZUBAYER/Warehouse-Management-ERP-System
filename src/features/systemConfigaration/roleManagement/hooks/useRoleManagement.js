import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/api";
import { toast } from "react-hot-toast";

const PAGE_LIMIT_ROLES = 10;


// ── Helpers (defined OUTSIDE the hook — stable references) ───────────────────
const formatPages = (nodes) =>
    nodes.map((node) => ({
        id: node.id,
        key: node.key,
        level: node.level,
        display: node.key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()),
        sub: node.sub && node.sub.length > 0 ? formatPages(node.sub) : [],
    }));

const fetchRolesPage = async (page) => {
    const response = await api.get(`/roles?page=${page}&limit=${PAGE_LIMIT_ROLES}`);
    return response; // { data: [...], pagination: { totalPages, ... } }
};

// ── Normalize a single raw API role → UI shape ───────────────────────────────
const normalizeRole = (r) => ({
    id: r.id,
    name: r.name,
    linkStatus:
        r.sub_account_linking_status === "not_linked" ? "Not Linked" : "Linked",
    createdAt: new Date(r.createdAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }),
    updatedAt: new Date(r.updatedAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }),
    userCount: r.user_count,
    description: r.description,
});

const EMPTY_FORM = { role: "", description: "", permissions: {} };

// ── Build the nested permissions payload from flat form.permissions ───────────
const buildPermissionsPayload = (permissions) => ({
    dashboard: {
        access: !!permissions["dashboard"]
    },
    product_management: {
        access: !!permissions["product_management"],
        sub: {
            product_list: !!permissions["product_list"],
            combine_sku: !!permissions["combine_sku"],
        },
    },
    inventory_management: {
        access: !!permissions["inventory_management"],
        sub: {
            inventory_list: !!permissions["inventory_list"],
            inbound: {
                access: !!permissions["inbound"],
                sub: {
                    inbound_draft: !!permissions["inbound_draft"],
                    inbound_on_the_way: !!permissions["inbound_on_the_way"],
                    inbound_complete: !!permissions["inbound_complete"],
                },
            },
        },
    },
    order_management: {
        access: !!permissions["order_management"],
        sub: {
            order_processing: {
                access: !!permissions["order_processing"],
                sub: {
                    new_order: !!permissions["new_order"],
                    processed_order: !!permissions["processed_order"],
                    shipped_order: !!permissions["shipped_order"],
                    completed_order: !!permissions["completed_order"],
                    all_order: !!permissions["all_order"],
                    canceled_order: !!permissions["canceled_order"],
                },
            },
            manual_order: !!permissions["manual_order"],
        },
    },
    warehouse_management: {
        access: !!permissions["warehouse_management"]
    },
    system_configuration: {
        access: !!permissions["system_configuration"],
        sub: {
            store_authorization: !!permissions["store_authorization"],
            account_management: {
                access: !!permissions["account_management"],
                sub: {
                    sub_account: !!permissions["sub_account"],
                    role_management: !!permissions["role_management"],
                },
            },
        },
    },
});


// ─────────────────────────────────────────────────────────────────────────────
export function useRoleManagement() {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [openActionId, setOpenActionId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, role: null });
    const [editModal, setEditModal] = useState({ open: false, role: null });
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [editErrors, setEditErrors] = useState({});
    const [editSaving, setEditSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // ── Fetch Dynamic Pages ───────────────────────────────────────────────────
    const { data: nestedPages, isLoading: nestedPageLoading } = useQuery({
        queryKey: ["pages-hierarchy"],
        queryFn: async () => {
            const response = await api.get("/pages");
            return formatPages(response.data);
        },
    });

    // ── Fetch ALL roles across all pages dynamically ──────────────────────────
    const { data: roles = [], isLoading: rolesLoading } = useQuery({
        queryKey: ["roles-all"],
        queryFn: async () => {
            // Step 1: Fetch page 1 to learn totalPages
            const first = await fetchRolesPage(1);
            const { totalPages } = first.pagination;

            // Step 2: Fetch all remaining pages in parallel
            const rest =
                totalPages > 1
                    ? await Promise.all(
                        Array.from({ length: totalPages - 1 }, (_, i) =>
                            fetchRolesPage(i + 2)
                        )
                    )
                    : [];

            // Step 3: Flatten and normalize all pages → UI shape
            // ✅ FIX: return the value instead of calling setRoles
            return [
                ...first.data,
                ...rest.flatMap((r) => r.data),
            ].map(normalizeRole);
        },
    });

    // ── Filtered list ─────────────────────────────────────────────────────────
    // ✅ FIX: roles is now already normalized, so filtered is stable
    const filtered = useMemo(() => {
        if (!search.trim()) return roles;
        const q = search.toLowerCase();
        return roles.filter((r) => r.name.toLowerCase().includes(q));
    }, [search, roles]);

    // ── Form handlers ─────────────────────────────────────────────────────────
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    };

    const togglePermission = (pageKey, parentKey = null) => {
        setForm((p) => {
            const isCurrentlyChecked = !!p.permissions[pageKey];

            if (!isCurrentlyChecked && parentKey && !p.permissions[parentKey]) {
                toast.error("Please select the parent category first.");
                return p;
            }

            const newPermissions = {
                ...p.permissions,
                [pageKey]: !isCurrentlyChecked,
            };

            // If unchecking a parent, also uncheck its children
            if (isCurrentlyChecked && nestedPages) {
                const parent = nestedPages.find((pg) => pg.key === pageKey);
                if (parent?.sub?.length) {
                    parent.sub.forEach((child) => {
                        newPermissions[child.key] = false;
                    });
                }
            }

            return { ...p, permissions: newPermissions };
        });
    };

    const validate = () => {
        const e = {};
        if (!form.role.trim()) e.role = "Role name is required";
        return e;
    };

    const openModal = () => {
        setForm(EMPTY_FORM);
        setErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setErrors({});
    };

    // ── Add Role ──────────────────────────────────────────────────────────────
    const handleAdd = async () => {
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: form.role,
                description: form.description || "No description provided",
                subAccountLinkingStatus: "not_linked",
                permissions: buildPermissionsPayload(form.permissions),
            };

            const response = await api.post("/roles", payload);

            if (response.success) {
                // ✅ FIX: Invalidate query so the list refetches with correct
                //         server data instead of manually pushing a raw object
                await queryClient.invalidateQueries({ queryKey: ["roles-all"] });
                toast.success("Role added successfully!");
                closeModal();
            }
        } catch (error) {
            console.error("Add Role Error:", error);
            toast.error(error.response?.data?.message || "Failed to add role");
        } finally {
            setSaving(false);
        }
    };

    // ── Open / close helpers ──────────────────────────────────────────────────────
    const openDeleteModal = (role) => {
        setOpenActionId(null);
        setDeleteModal({ open: true, role });
    };
    const closeDeleteModal = () => setDeleteModal({ open: false, role: null });

    const openEditModal = (role) => {
        setOpenActionId(null);
        // Pre-populate form with existing role data
        setEditForm({
            role: role.name,
            description: role.description || "",
            permissions: {},          // permissions are fetched separately if needed
        });
        setEditErrors({});
        setEditModal({ open: true, role });
    };
    const closeEditModal = () => {
        setEditModal({ open: false, role: null });
        setEditErrors({});
    };

    // ── Delete handler ────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteModal.role) return;
        setDeleting(true);
        try {
            const response = await api.delete(`/roles/${deleteModal.role.id}`);
            if (response.success) {
                await queryClient.invalidateQueries({ queryKey: ["roles-all"] });
                toast.success("Role deleted successfully!");
                closeDeleteModal();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete role");
        } finally {
            setDeleting(false);
        }
    };

    // ── Edit form change handler ──────────────────────────────────────────────────
    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm((p) => ({ ...p, [name]: value }));
        if (editErrors[name]) setEditErrors((p) => ({ ...p, [name]: "" }));
    };

    const toggleEditPermission = (pageKey, parentKey = null) => {
        setEditForm((p) => {
            const isCurrentlyChecked = !!p.permissions[pageKey];
            if (!isCurrentlyChecked && parentKey && !p.permissions[parentKey]) {
                toast.error("Please select the parent category first.");
                return p;
            }
            const newPermissions = { ...p.permissions, [pageKey]: !isCurrentlyChecked };
            if (isCurrentlyChecked && nestedPages) {
                const parent = nestedPages.find((pg) => pg.key === pageKey);
                if (parent?.sub?.length) {
                    parent.sub.forEach((child) => { newPermissions[child.key] = false; });
                }
            }
            return { ...p, permissions: newPermissions };
        });
    };

    const validateEdit = () => {
        const e = {};
        if (!editForm.role.trim()) e.role = "Role name is required";
        return e;
    };

    // ── Edit submit handler ───────────────────────────────────────────────────────
    const handleEdit = async () => {
        const e = validateEdit();
        if (Object.keys(e).length) { setEditErrors(e); return; }

        setEditSaving(true);
        try {
            const payload = {
                name: editForm.role,
                description: editForm.description || "No description provided",
                subAccountLinkingStatus: editModal.role.linkStatus === "Linked"
                    ? "linked"
                    : "not_linked",
                permissions: buildPermissionsPayload(editForm.permissions),
            };

            const response = await api.put(`/roles/${editModal.role.id}`, payload);
            if (response.success) {
                await queryClient.invalidateQueries({ queryKey: ["roles-all"] });
                toast.success("Role updated successfully!");
                closeEditModal();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update role");
        } finally {
            setEditSaving(false);
        }
    };

    // ── Return ────────────────────────────────────────────────────────────────
    return {
        search,
        setSearch,
        roles: filtered,
        rolesLoading,
        openActionId,
        setOpenActionId,
        showModal,
        openModal,
        closeModal,
        form,
        handleFormChange,
        togglePermission,
        errors,
        saving,
        handleAdd,
        pages: nestedPages || [],
        nestedPageLoading,
        deleteModal, openDeleteModal, closeDeleteModal, handleDelete, deleting,
        editModal, openEditModal, closeEditModal, handleEdit, editSaving,
        editForm, handleEditFormChange, toggleEditPermission, editErrors,
    };
}