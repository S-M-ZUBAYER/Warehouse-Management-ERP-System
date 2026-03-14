import { useState, useMemo } from "react";
import { PLATFORMS, STORES, SEARCH_TYPES, SKU_TYPES } from "../mockData";

// ─────────────────────────────────────────────────────────────────────────────
// useOrderList — shared hook used by ALL order list pages
// Each page passes its own orders array
// ─────────────────────────────────────────────────────────────────────────────

export function useOrderList(orders = []) {
    const [platform, setPlatform] = useState("Platform Name Here");
    const [store, setStore] = useState("Store Name Here");
    const [searchType, setSearchType] = useState("Single Search");
    const [skuType, setSkuType] = useState("SKU");
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false);

    const filtered = useMemo(() => {
        if (!search.trim()) return orders;
        const q = search.toLowerCase();
        return orders.filter(
            (o) =>
                o.sku.toLowerCase().includes(q) ||
                o.orderNo.toLowerCase().includes(q) ||
                o.trackingNo.toLowerCase().includes(q) ||
                o.pkgNo.toLowerCase().includes(q)
        );
    }, [orders, search]);

    const toggleSelect = (id) =>
        setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

    const toggleAll = () => {
        const ids = filtered.map((o) => o.id);
        setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids);
    };

    return {
        // filter state
        platform, setPlatform,
        store, setStore,
        searchType, setSearchType,
        skuType, setSkuType,
        search, setSearch,
        showSearchTypeDropdown, setShowSearchTypeDropdown,
        // data
        orders: filtered,
        // selection
        selectedIds, toggleSelect, toggleAll,
        allSelected: filtered.length > 0 && filtered.every((o) => selectedIds.includes(o.id)),
        someSelected: filtered.some((o) => selectedIds.includes(o.id)),
        // options
        platforms: PLATFORMS,
        stores: STORES,
        searchTypes: SEARCH_TYPES,
        skuTypes: SKU_TYPES,
    };
}