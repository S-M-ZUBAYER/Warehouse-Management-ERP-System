import { useState, useMemo, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Mock product data — replace with API calls (React Query) when backend ready
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_PRODUCTS = [
    { id: 1, sku: "SKU-001", name: "Wireless Bluetooth Headphones Pro", category: "Electronics", brand: "TechSound", additionalSku: "TSH-001", totalStock: 1240, availableStock: 1100, status: "active", image: "https://placehold.co/40x40/E6ECF0/004368?text=P1" },
    { id: 2, sku: "SKU-002", name: "Ergonomic Office Chair", category: "Furniture", brand: "ComfortPlus", additionalSku: "CP-CH01", totalStock: 340, availableStock: 290, status: "active", image: "https://placehold.co/40x40/E6ECF0/004368?text=P2" },
    { id: 3, sku: "SKU-003", name: "Stainless Steel Water Bottle 750ml", category: "Kitchenware", brand: "HydroLife", additionalSku: "HL-WB75", totalStock: 2800, availableStock: 2650, status: "active", image: "https://placehold.co/40x40/E6ECF0/004368?text=P3" },
    { id: 4, sku: "SKU-004", name: "Running Shoes - Air Cushion Series", category: "Footwear", brand: "SpeedStep", additionalSku: "SS-RS10", totalStock: 890, availableStock: 720, status: "active", image: "https://placehold.co/40x40/E6ECF0/004368?text=P4" },
    { id: 5, sku: "SKU-005", name: "Portable Solar Charger 20000mAh", category: "Electronics", brand: "SolarTech", additionalSku: "ST-SC20", totalStock: 560, availableStock: 480, status: "inactive", image: "https://placehold.co/40x40/E6ECF0/004368?text=P5" },
    { id: 6, sku: "SKU-006", name: "Bamboo Cutting Board Set (3 Piece)", category: "Kitchenware", brand: "GreenKitch", additionalSku: "GK-CB03", totalStock: 1500, availableStock: 1450, status: "active", image: "https://placehold.co/40x40/E6ECF0/004368?text=P6" },
    { id: 7, sku: "SKU-007", name: "Yoga Mat Premium Anti-Slip 6mm", category: "Sports", brand: "FlexFit", additionalSku: "FF-YM06", totalStock: 670, availableStock: 600, status: "active", image: "https://placehold.co/40x40/E6ECF0/004368?text=P7" },
    { id: 8, sku: "SKU-008", name: "Smart LED Desk Lamp with USB Charging", category: "Electronics", brand: "BrightHome", additionalSku: "BH-DL01", totalStock: 430, availableStock: 390, status: "active", image: "https://placehold.co/40x40/E6ECF0/004368?text=P8" },
    { id: 9, sku: "SKU-009", name: "Leather Wallet - Slim RFID Blocking", category: "Accessories", brand: "SafeCarry", additionalSku: "SC-WL01", totalStock: 920, availableStock: 870, status: "inactive", image: "https://placehold.co/40x40/E6ECF0/004368?text=P9" },
    { id: 10, sku: "SKU-010", name: "Ceramic Non-Stick Frying Pan 28cm", category: "Kitchenware", brand: "ChefMaster", additionalSku: "CM-FP28", totalStock: 780, availableStock: 720, status: "active", image: "https://placehold.co/40x40/E6ECF0/004368?text=P10" },
    { id: 11, sku: "SKU-011", name: "Memory Foam Pillow - Cervical Support", category: "Bedding", brand: "SleepWell", additionalSku: "SW-MP01", totalStock: 540, availableStock: 490, status: "active", image: "https://placehold.co/40x40/E6ECF0/004368?text=P11" },
    { id: 12, sku: "SKU-012", name: "Insulated Lunch Box with Compartments", category: "Kitchenware", brand: "FreshKeep", additionalSku: "FK-LB02", totalStock: 1100, availableStock: 1050, status: "active", image: "https://placehold.co/40x40/E6ECF0/004368?text=P12" },
];

const CATEGORIES = ["All", "Electronics", "Furniture", "Kitchenware", "Footwear", "Sports", "Accessories", "Bedding"];
const STATUSES = ["All", "active", "inactive"];
const PAGE_SIZE = 10;

export function useProductManagement() {
    // ── List state ─────────────────────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("All");      // All / Active / Inactive
    const [filterCategory, setFilterCategory] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);     // product to delete
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [sortField, setSortField] = useState("name");
    const [sortDir, setSortDir] = useState("asc");

    // ── Filtered + sorted products ────────────────────────────────────────────
    const filtered = useMemo(() => {
        let list = [...MOCK_PRODUCTS];

        // Tab filter
        if (activeTab !== "All") {
            list = list.filter((p) => p.status === activeTab.toLowerCase());
        }

        // Category filter
        if (filterCategory !== "All") {
            list = list.filter((p) => p.category === filterCategory);
        }

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q) ||
                    p.brand.toLowerCase().includes(q)
            );
        }

        // Sort
        list.sort((a, b) => {
            let va = a[sortField], vb = b[sortField];
            if (typeof va === "string") va = va.toLowerCase();
            if (typeof vb === "string") vb = vb.toLowerCase();
            if (va < vb) return sortDir === "asc" ? -1 : 1;
            if (va > vb) return sortDir === "asc" ? 1 : -1;
            return 0;
        });

        return list;
    }, [search, activeTab, filterCategory, sortField, sortDir]);

    // ── Pagination ────────────────────────────────────────────────────────────
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
        setSelectedIds([]);
    }, []);

    // ── Tab change ────────────────────────────────────────────────────────────
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
        setSelectedIds([]);
    }, []);

    // ── Sort ──────────────────────────────────────────────────────────────────
    const handleSort = useCallback((field) => {
        setSortDir((prev) => (sortField === field && prev === "asc" ? "desc" : "asc"));
        setSortField(field);
    }, [sortField]);

    // ── Selection ─────────────────────────────────────────────────────────────
    const toggleSelect = useCallback((id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }, []);

    const toggleSelectAll = useCallback(() => {
        const pageIds = paginated.map((p) => p.id);
        const allSelected = pageIds.every((id) => selectedIds.includes(id));
        setSelectedIds(allSelected ? [] : pageIds);
    }, [paginated, selectedIds]);

    // ── Delete ────────────────────────────────────────────────────────────────
    const openDeleteModal = useCallback((product) => {
        setDeleteTarget(product);
        setShowDeleteModal(true);
    }, []);

    const confirmDelete = useCallback(() => {
        // TODO: call API delete
        console.log("Deleted:", deleteTarget?.id);
        setShowDeleteModal(false);
        setDeleteTarget(null);
    }, [deleteTarget]);

    const cancelDelete = useCallback(() => {
        setShowDeleteModal(false);
        setDeleteTarget(null);
    }, []);

    // ── Counts for tabs ───────────────────────────────────────────────────────
    const tabCounts = useMemo(() => ({
        All: MOCK_PRODUCTS.length,
        Active: MOCK_PRODUCTS.filter((p) => p.status === "active").length,
        Inactive: MOCK_PRODUCTS.filter((p) => p.status === "inactive").length,
    }), []);

    return {
        // data
        products: paginated,
        allProducts: MOCK_PRODUCTS,
        filtered,
        categories: CATEGORIES,
        statuses: STATUSES,
        tabCounts,
        // pagination
        currentPage, totalPages, handlePageChange,
        // filters
        search, setSearch,
        activeTab, handleTabChange,
        filterCategory, setFilterCategory,
        // sort
        sortField, sortDir, handleSort,
        // selection
        selectedIds, toggleSelect, toggleSelectAll,
        // delete
        deleteTarget, showDeleteModal,
        openDeleteModal, confirmDelete, cancelDelete,
    };
}