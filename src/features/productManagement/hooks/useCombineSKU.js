import { useState, useMemo, useCallback } from "react";

const MOCK_SKUS = [
    { id: 1, sku: "SKU-001", name: "Wireless Bluetooth Headphones Pro", qty: 120, price: 89.90, image: "https://placehold.co/36x36/E6ECF0/004368?text=S1" },
    { id: 2, sku: "SKU-002", name: "Ergonomic Office Chair", qty: 34, price: 299.00, image: "https://placehold.co/36x36/E6ECF0/004368?text=S2" },
    { id: 3, sku: "SKU-003", name: "Stainless Steel Water Bottle 750ml", qty: 280, price: 24.90, image: "https://placehold.co/36x36/E6ECF0/004368?text=S3" },
    { id: 4, sku: "SKU-004", name: "Running Shoes Air Cushion Series", qty: 89, price: 119.00, image: "https://placehold.co/36x36/E6ECF0/004368?text=S4" },
    { id: 5, sku: "SKU-005", name: "Portable Solar Charger 20000mAh", qty: 56, price: 69.90, image: "https://placehold.co/36x36/E6ECF0/004368?text=S5" },
    { id: 6, sku: "SKU-006", name: "Bamboo Cutting Board Set", qty: 150, price: 39.90, image: "https://placehold.co/36x36/E6ECF0/004368?text=S6" },
    { id: 7, sku: "SKU-007", name: "Yoga Mat Premium Anti-Slip 6mm", qty: 67, price: 49.90, image: "https://placehold.co/36x36/E6ECF0/004368?text=S7" },
    { id: 8, sku: "SKU-008", name: "Smart LED Desk Lamp USB Charging", qty: 43, price: 79.90, image: "https://placehold.co/36x36/E6ECF0/004368?text=S8" },
    { id: 9, sku: "SKU-009", name: "Leather Wallet Slim RFID Blocking", qty: 92, price: 45.00, image: "https://placehold.co/36x36/E6ECF0/004368?text=S9" },
    { id: 10, sku: "SKU-010", name: "Ceramic Non-Stick Frying Pan 28cm", qty: 78, price: 89.00, image: "https://placehold.co/36x36/E6ECF0/004368?text=S10" },
];

export function useCombineSKU() {
    const [search, setSearch] = useState("");
    const [selectedSkus, setSelectedSkus] = useState([]);
    const [particulars, setParticulars] = useState({
        combineName: "",
        combineSkuCode: "",
        description: "",
        sellingPrice: "",
        costPrice: "",
        weight: "",
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const filteredSkus = useMemo(() => {
        if (!search.trim()) return MOCK_SKUS;
        const q = search.toLowerCase();
        return MOCK_SKUS.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                s.sku.toLowerCase().includes(q)
        );
    }, [search]);

    const toggleSku = useCallback((sku) => {
        setSelectedSkus((prev) =>
            prev.find((s) => s.id === sku.id)
                ? prev.filter((s) => s.id !== sku.id)
                : [...prev, { ...sku, combineQty: 1 }]
        );
    }, []);

    const updateQty = useCallback((id, qty) => {
        setSelectedSkus((prev) =>
            prev.map((s) => (s.id === id ? { ...s, combineQty: Math.max(1, Number(qty)) } : s))
        );
    }, []);

    const removeSelected = useCallback((id) => {
        setSelectedSkus((prev) => prev.filter((s) => s.id !== id));
    }, []);

    const handleParticularsChange = useCallback((e) => {
        const { name, value } = e.target;
        setParticulars((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    }, []);

    const validate = () => {
        const e = {};
        if (!particulars.combineName.trim()) e.combineName = "Combine name is required";
        if (!particulars.combineSkuCode.trim()) e.combineSkuCode = "SKU code is required";
        if (selectedSkus.length < 2) e.skus = "Select at least 2 SKUs to combine";
        return e;
    };

    const handleSave = async () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }

        setSaving(true);
        await new Promise((r) => setTimeout(r, 800)); // simulate API
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleCancel = () => {
        setSelectedSkus([]);
        setParticulars({ combineName: "", combineSkuCode: "", description: "", sellingPrice: "", costPrice: "", weight: "" });
        setErrors({});
    };

    return {
        search, setSearch,
        filteredSkus, selectedSkus,
        toggleSku, updateQty, removeSelected,
        particulars, handleParticularsChange, errors,
        saving, saved,
        handleSave, handleCancel,
    };
}