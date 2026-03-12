import { useState, useMemo } from "react";

const MOCK_BUNDLES = [
    { id: 1, sku: "WM-012", name: "Ergonomic wireless mouse with 3k...", image: "https://placehold.co/40x40/1a1a2e/fff?text=M" },
    { id: 2, sku: "KB-045", name: "Compact mechanical keyboard with...", image: "https://placehold.co/40x40/16213e/fff?text=K" },
    { id: 3, sku: "SSD-123", name: "Portable external SSD 1TB", image: "https://placehold.co/40x40/0f3460/fff?text=S" },
    { id: 4, sku: "HP-678", name: "Noise-cancelling over-ear headphones", image: "https://placehold.co/40x40/533483/fff?text=H" },
    { id: 5, sku: "WC-234", name: "High-definition webcam 1080p", image: "https://placehold.co/40x40/2b2d42/fff?text=W" },
    { id: 6, sku: "SH-456", name: "Smartphone holder with adjustable ..", image: "https://placehold.co/40x40/8d99ae/004368?text=S" },
    { id: 7, sku: "BP-789", name: "Ultra-slim laptop backpack", image: "https://placehold.co/40x40/3a3a3c/fff?text=B" },
    { id: 8, sku: "CP-321", name: "Wireless charging pad for smartphones", image: "https://placehold.co/40x40/004368/fff?text=C" },
    { id: 9, sku: "CC-987", name: "High-speed HDMI cable 6ft", image: "https://placehold.co/40x40/1b4332/fff?text=H" },
    { id: 10, sku: "GR-222", name: "Smart home hub for automation", image: "https://placehold.co/40x40/212529/fff?text=G" },
];

export function useCombineSKUList() {
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);

    const filtered = useMemo(() => {
        if (!search.trim()) return MOCK_BUNDLES;
        const q = search.toLowerCase();
        return MOCK_BUNDLES.filter(
            (b) => b.name.toLowerCase().includes(q) || b.sku.toLowerCase().includes(q)
        );
    }, [search]);

    const toggleSelect = (id) =>
        setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    const toggleAll = () => {
        const ids = filtered.map((b) => b.id);
        setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids);
    };

    return {
        search, setSearch,
        bundles: filtered,
        selectedIds, toggleSelect, toggleAll,
        allSelected: filtered.length > 0 && filtered.every((b) => selectedIds.includes(b.id)),
        someSelected: filtered.some((b) => selectedIds.includes(b.id)),
    };
}