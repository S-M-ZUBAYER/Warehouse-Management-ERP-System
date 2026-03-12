import { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Mock data matching Figma exactly
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_WAREHOUSES = [
    { id: 1, name: "Storage-A", attribute: "Third Party Warehouse", location: "123 Commerce Way, Suite 100", totalSku: 1565, isDefault: false },
    { id: 2, name: "Depot-B", attribute: "Local Distribution Center", location: "456 Local Lane, Building B", totalSku: 0, isDefault: false },
    { id: 3, name: "Hanga-C", attribute: "International Shipping Hub", location: "789 Global Ave, Dock 5", totalSku: 1567, isDefault: false },
    { id: 4, name: "Shed-D", attribute: "Centralized Fulfillment Center", location: "101 Central Blvd, Unit 2", totalSku: 0, isDefault: false },
    { id: 5, name: "Stockpile-E", attribute: "Retail Storehouse", location: "202 Retail Rd, Warehouse 3", totalSku: 1569, isDefault: false },
    { id: 6, name: "Repository-F", attribute: "Drop Shipping Partner", location: "303 Shipping St, Partner Office", totalSku: 0, isDefault: false },
    { id: 7, name: "Unit-G", attribute: "E-commerce Warehouse", location: "404 E-commerce Dr, Storage Facility", totalSku: 1571, isDefault: false },
    { id: 8, name: "Unit-H", attribute: "E-commerce Warehouse", location: "404 E-commerce Dr, Storage Facility", totalSku: 1571, isDefault: false },
    { id: 9, name: "Unit-L", attribute: "E-commerce Warehouse", location: "404 E-commerce Dr, Storage Facility", totalSku: 1571, isDefault: false },
    { id: 10, name: "Unit-K", attribute: "E-commerce Warehouse", location: "404 E-commerce Dr, Storage Facility", totalSku: 1571, isDefault: false },
];

const PLATFORMS = [
    "Platform Name Here",
    "Lazada",
    "Shopee",
    "TikTok Shop",
    "WooCommerce",
    "Shopify",
    "Amazon",
];

const EMPTY_FORM = {
    attribute: "Own Warehouse",   // "Own Warehouse" | "Third party Warehouse"
    name: "",
    manager: "",
    phoneNumber: "",
    location: "",
};

export function useWarehouse() {
    const [warehouses, setWarehouses] = useState(MOCK_WAREHOUSES);
    const [platform, setPlatform] = useState("Platform Name Here");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // ── Form handlers ──────────────────────────────────────────────────────────
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleAttributeChange = (value) => {
        setForm((prev) => ({ ...prev, attribute: value }));
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Warehouse name is required";
        return e;
    };

    // ── Open / close modal ─────────────────────────────────────────────────────
    const openModal = () => { setForm(EMPTY_FORM); setErrors({}); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setErrors({}); };

    // ── Add warehouse ─────────────────────────────────────────────────────────
    const handleAdd = async () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }

        setSaving(true);
        // TODO: replace with real API call
        await new Promise((r) => setTimeout(r, 600));

        setWarehouses((prev) => [
            ...prev,
            {
                id: Date.now(),
                name: form.name,
                attribute: form.attribute,
                location: form.location || "—",
                totalSku: 0,
                isDefault: false,
                manager: form.manager,
                phoneNumber: form.phoneNumber,
            },
        ]);
        setSaving(false);
        closeModal();
    };

    // ── Toggle default ────────────────────────────────────────────────────────
    const toggleDefault = (id) => {
        setWarehouses((prev) =>
            prev.map((w) => ({ ...w, isDefault: w.id === id ? !w.isDefault : false }))
        );
    };

    return {
        warehouses,
        platform, setPlatform,
        platforms: PLATFORMS,
        showModal, openModal, closeModal,
        form, handleFormChange, handleAttributeChange,
        errors,
        saving,
        handleAdd,
        toggleDefault,
    };
}