import { useState, useMemo } from "react";

const MOCK_PRODUCTS = [
    { id: 1, sku: "WM-012", warehouse: "Warehouse A", status: "Active", country: "Malaysia", name: "Ergonomic wireless mouse with 3k...", availableInventory: 125, inTransitInventory: 125, image: "https://placehold.co/40x40/1a1a2e/fff?text=M" },
    { id: 2, sku: "KB-045", warehouse: "Warehouse B", status: "Out of Stock", country: "Thailand", name: "Compact mechanical keyboard with...", availableInventory: 200, inTransitInventory: 200, image: "https://placehold.co/40x40/16213e/fff?text=K" },
    { id: 3, sku: "SSD-123", warehouse: "Warehouse A", status: "Inactive", country: "Malaysia", name: "Portable external SSD 1TB", availableInventory: 0, inTransitInventory: 0, image: "https://placehold.co/40x40/0f3460/fff?text=S" },
    { id: 4, sku: "HP-678", warehouse: "Warehouse C", status: "Low Stock", country: "Singapore", name: "Noise-cancelling over-ear headphones", availableInventory: 75, inTransitInventory: 75, image: "https://placehold.co/40x40/533483/fff?text=H" },
    { id: 5, sku: "WC-234", warehouse: "Warehouse A", status: "Active", country: "Malaysia", name: "High-definition webcam 1080p", availableInventory: 100, inTransitInventory: 100, image: "https://placehold.co/40x40/2b2d42/fff?text=W" },
    { id: 6, sku: "SH-456", warehouse: "Warehouse A", status: "Active", country: "Indonesia", name: "Smartphone holder with adjustable ...", availableInventory: 300, inTransitInventory: 300, image: "https://placehold.co/40x40/8d99ae/004368?text=S" },
    { id: 7, sku: "BP-789", warehouse: "Warehouse C", status: "Active", country: "Malaysia", name: "Ultra-slim laptop backpack", availableInventory: 10, inTransitInventory: 10, image: "https://placehold.co/40x40/3a3a3c/fff?text=B" },
    { id: 8, sku: "CP-321", warehouse: "Warehouse B", status: "Low Stock", country: "Malaysia", name: "Wireless charging pad for smartphones", availableInventory: 180, inTransitInventory: 180, image: "https://placehold.co/40x40/004368/fff?text=C" },
    { id: 9, sku: "CC-987", warehouse: "Warehouse A", status: "Active", country: "Thailand", name: "High-speed HDMI cable 6ft", availableInventory: 500, inTransitInventory: 500, image: "https://placehold.co/40x40/1b4332/fff?text=H" },
    { id: 10, sku: "GR-222", warehouse: "Warehouse B", status: "Active", country: "Singapore", name: "Smart home hub for automation", availableInventory: 90, inTransitInventory: 90, image: "https://placehold.co/40x40/212529/fff?text=G" },
];

const WAREHOUSES = ["All Warehouses", "Warehouse A", "Warehouse B", "Warehouse C"];
const STATUSES = ["All Status", "Active", "Inactive", "Low Stock", "Out of Stock"];
const COUNTRIES = ["All Countries", "Malaysia", "Singapore", "Thailand", "Indonesia"];

// Helper — "All *" options mean no filter applied
const isDefaultOption = (value) =>
    !value ||
    value === "All Warehouses" ||
    value === "All Status" ||
    value === "All Countries";

export function useProductList() {
    const [search, setSearch] = useState("");
    const [warehouse, setWarehouse] = useState("All Warehouses");
    const [productStatus, setProductStatus] = useState("All Status");
    const [country, setCountry] = useState("All Countries");
    const [sku, setSku] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkAction, setBulkAction] = useState("");

    const filtered = useMemo(() => {
        let list = [...MOCK_PRODUCTS];

        // ── 1. Text search — name, sku, warehouse, status, country ─────────────
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q) ||
                    p.warehouse.toLowerCase().includes(q) ||
                    p.status.toLowerCase().includes(q) ||
                    p.country.toLowerCase().includes(q)
            );
        }

        // ── 2. SKU field filter ────────────────────────────────────────────────
        if (sku.trim()) {
            list = list.filter((p) =>
                p.sku.toLowerCase().includes(sku.toLowerCase())
            );
        }

        // ── 3. Warehouse dropdown filter ──────────────────────────────────────
        if (!isDefaultOption(warehouse)) {
            list = list.filter((p) => p.warehouse === warehouse);
        }

        // ── 4. Status dropdown filter ─────────────────────────────────────────
        if (!isDefaultOption(productStatus)) {
            list = list.filter((p) => p.status === productStatus);
        }

        // ── 5. Country dropdown filter ────────────────────────────────────────
        if (!isDefaultOption(country)) {
            list = list.filter((p) => p.country === country);
        }

        return list;
    }, [search, sku, warehouse, productStatus, country]);

    // ── Selection helpers ────────────────────────────────────────────────────
    const toggleSelect = (id) =>
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    const toggleAll = () => {
        const ids = filtered.map((p) => p.id);
        const allSelected = ids.every((id) => selectedIds.includes(id));
        setSelectedIds(allSelected ? [] : ids);
    };

    // ── Reset all filters ────────────────────────────────────────────────────
    const resetFilters = () => {
        setSearch("");
        setSku("");
        setWarehouse("All Warehouses");
        setProductStatus("All Status");
        setCountry("All Countries");
    };

    const hasActiveFilters =
        search.trim() ||
        sku.trim() ||
        !isDefaultOption(warehouse) ||
        !isDefaultOption(productStatus) ||
        !isDefaultOption(country);

    return {
        // filter state
        search, setSearch,
        warehouse, setWarehouse,
        productStatus, setProductStatus,
        country, setCountry,
        sku, setSku,
        bulkAction, setBulkAction,

        // data
        products: filtered,
        allProducts: MOCK_PRODUCTS,
        totalCount: filtered.length,

        // selection
        selectedIds,
        toggleSelect,
        toggleAll,
        allSelected: filtered.length > 0 && filtered.every((p) => selectedIds.includes(p.id)),
        someSelected: filtered.some((p) => selectedIds.includes(p.id)),

        // filter meta
        resetFilters,
        hasActiveFilters,

        // dropdown options
        warehouses: WAREHOUSES,
        statuses: STATUSES,
        countries: COUNTRIES,
    };
}