import { useState, useMemo } from "react";

const MOCK_ROLES = [
    { id: 1, name: "Digital Marketer", linkStatus: "Linked", createdAt: "01 Dec 2025  16:20", updatedAt: "15 Mar 2026  14:05" },
    { id: 2, name: "Customer Service", linkStatus: "Not Linked", createdAt: "02 Dec 2025  17:30", updatedAt: "22 Jul 2026  09:15" },
    { id: 3, name: "Product Manager", linkStatus: "Linked", createdAt: "03 Dec 2025  18:45", updatedAt: "10 Aug 2026  11:30" },
    { id: 4, name: "UX Designer", linkStatus: "Linked", createdAt: "04 Dec 2025  19:00", updatedAt: "28 Nov 2026  16:45" },
    { id: 5, name: "Data Analyst", linkStatus: "Not Linked", createdAt: "05 Dec 2025  20:15", updatedAt: "05 Jan 2026  13:20" },
    { id: 6, name: "Software Engineer", linkStatus: "Not Linked", createdAt: "06 Dec 2025  21:30", updatedAt: "30 Sep 2026  19:55" },
];

const PAGES = ["Dashboard", "Product Management", "Inventory Management", "Order Management", "Warehouse Management", "System Configuration"];

const EMPTY_FORM = { role: "", description: "", permissions: {} };

export function useRoleManagement() {
    const [search, setSearch] = useState("");
    const [roles, setRoles] = useState(MOCK_ROLES);
    const [openActionId, setOpenActionId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const filtered = useMemo(() => {
        if (!search.trim()) return roles;
        const q = search.toLowerCase();
        return roles.filter((r) => r.name.toLowerCase().includes(q));
    }, [search, roles]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    };

    const togglePermission = (page) => {
        setForm((p) => ({
            ...p,
            permissions: { ...p.permissions, [page]: !p.permissions[page] },
        }));
    };

    const validate = () => {
        const e = {};
        if (!form.role.trim()) e.role = "Role name is required";
        return e;
    };

    const openModal = () => { setForm(EMPTY_FORM); setErrors({}); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setErrors({}); };

    const handleAdd = async () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setSaving(true);
        await new Promise((r) => setTimeout(r, 600));
        setRoles((p) => [...p, {
            id: Date.now(), name: form.role,
            linkStatus: "Not Linked",
            createdAt: new Date().toLocaleDateString(),
            updatedAt: new Date().toLocaleDateString(),
        }]);
        setSaving(false);
        closeModal();
    };

    return {
        search, setSearch,
        roles: filtered,
        openActionId, setOpenActionId,
        showModal, openModal, closeModal,
        form, handleFormChange, togglePermission,
        errors, saving, handleAdd,
        pages: PAGES,
    };
}