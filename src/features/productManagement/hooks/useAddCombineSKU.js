import { useState, useMemo } from "react";

const ALL_SKUS = [
    { id: 1, sku: "WM-012", name: "Ergonomic wireless mouse with 3k...", availableInventory: 125, image: "https://placehold.co/36x36/1a1a2e/fff?text=M" },
    { id: 2, sku: "KB-045", name: "Compact mechanical keyboard with...", availableInventory: 200, image: "https://placehold.co/36x36/16213e/fff?text=K" },
    { id: 3, sku: "SSD-123", name: "Portable external SSD 1TB", availableInventory: 0, image: "https://placehold.co/36x36/0f3460/fff?text=S" },
    { id: 4, sku: "HP-678", name: "Noise-cancelling over-ear headphones", availableInventory: 75, image: "https://placehold.co/36x36/533483/fff?text=H" },
    { id: 5, sku: "WC-234", name: "High-definition webcam 1080p", availableInventory: 100, image: "https://placehold.co/36x36/2b2d42/fff?text=W" },
    { id: 6, sku: "SH-456", name: "Smartphone holder with adjustable ..", availableInventory: 300, image: "https://placehold.co/36x36/8d99ae/004368?text=S" },
    { id: 7, sku: "BP-789", name: "Ultra-slim laptop backpack", availableInventory: 10, image: "https://placehold.co/36x36/3a3a3c/fff?text=B" },
    { id: 8, sku: "CP-321", name: "Wireless charging pad for smartphones", availableInventory: 180, image: "https://placehold.co/36x36/004368/fff?text=C" },
    { id: 9, sku: "CC-987", name: "High-speed HDMI cable 6ft", availableInventory: 500, image: "https://placehold.co/36x36/1b4332/fff?text=H" },
    { id: 10, sku: "GR-222", name: "Smart home hub for automation", availableInventory: 90, image: "https://placehold.co/36x36/212529/fff?text=G" },
];

// Pre-selected for preview panel (matching Figma right panel)
const INITIAL_SELECTED = [1, 2, 3, 4, 5, 6];

export function useAddCombineSKU() {
    const [skuSearch, setSkuSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState(INITIAL_SELECTED);
    const [quantities, setQuantities] = useState(
        Object.fromEntries(INITIAL_SELECTED.map((id) => [id, 1]))
    );
    const [form, setForm] = useState({
        combineSKUName: "",
        gtin: "",
        weight: "",
        length: "",
        width: "",
        height: "",
        warehouse: "",
    });
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const filteredSkus = useMemo(() => {
        if (!skuSearch.trim()) return ALL_SKUS;
        const q = skuSearch.toLowerCase();
        return ALL_SKUS.filter(
            (s) => s.name.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q)
        );
    }, [skuSearch]);

    const selectedSkus = ALL_SKUS.filter((s) => selectedIds.includes(s.id));

    const toggleSku = (id) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            setQuantities((q) => ({ ...q, [id]: 1 }));
            return [...prev, id];
        });
    };

    const updateQty = (id, val) => {
        setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Number(val) || 1) }));
    };

    const removeFromPreview = (id) => {
        setSelectedIds((prev) => prev.filter((x) => x !== id));
    };

    const clearAll = () => {
        setSelectedIds([]);
        setQuantities({});
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = () => setShowSaveModal(true);

    const confirmSave = async () => {
        setSaving(true);
        await new Promise((r) => setTimeout(r, 800));
        setSaving(false);
        setShowSaveModal(false);
    };

    return {
        skuSearch, setSkuSearch,
        filteredSkus, selectedIds, selectedSkus,
        quantities, toggleSku, updateQty, removeFromPreview, clearAll,
        form, handleFormChange,
        showSaveModal, setShowSaveModal,
        saving, handleSaveClick, confirmSave,
        allTableSelected: filteredSkus.length > 0 && filteredSkus.every((s) => selectedIds.includes(s.id)),
        toggleAll: () => {
            const ids = filteredSkus.map((s) => s.id);
            const allSel = ids.every((id) => selectedIds.includes(id));
            if (allSel) {
                setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
            } else {
                const newIds = ids.filter((id) => !selectedIds.includes(id));
                newIds.forEach((id) => setQuantities((q) => ({ ...q, [id]: 1 })));
                setSelectedIds((prev) => [...prev, ...newIds]);
            }
        },
    };
}