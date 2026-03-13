import { useState, useMemo } from "react";

const MOCK_STORES = [
    { id: 1, marketplace: "Shopee", nickname: "Shopee", storeId: "Store124", country: "Indonesia", authStatus: "Authorized", createdAt: "01 Dec 2025  16:20" },
    { id: 2, marketplace: "Lazada", nickname: "Lazada", storeId: "Store125", country: "Malaysia", authStatus: "Pending", createdAt: "02 Dec 2025  17:30" },
    { id: 3, marketplace: "Tokopedia", nickname: "Tokopedia", storeId: "Store126", country: "Thailand", authStatus: "Rejected", createdAt: "03 Dec 2025  18:45" },
    { id: 4, marketplace: "Bukalapak", nickname: "Bukalapak", storeId: "Store127", country: "Philippines", authStatus: "In Review", createdAt: "04 Dec 2025  19:00" },
    { id: 5, marketplace: "Zalora", nickname: "Zalora", storeId: "Store128", country: "Vietnam", authStatus: "Completed", createdAt: "05 Dec 2025  20:15" },
];

const PLATFORMS = ["All", "Shopee", "Lazada", "TikTok"];
const STATUSES = ["All", "Authorized", "Pending", "Rejected", "In Review", "Completed"];
const SUB_ACCOUNTS = [
    { id: 1, account: "admin@f2eids", fullName: "Md G R Plas", role: "Product Designer" },
    { id: 2, account: "user@23xyz", fullName: "Ayesha Khan", role: "UX Researcher" },
    { id: 3, account: "guest@45abc", fullName: "Ravi Mehta", role: "Interaction Designer" },
];

export function useStoreAuthorization() {
    const [platform, setPlatform] = useState("All");
    const [selectPlatform, setSelectPlatform] = useState("Platform Name Here");
    const [authFilter, setAuthFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);

    // ── Action dropdown ────────────────────────────────────────────────────────
    const [openActionId, setOpenActionId] = useState(null);

    // ── Nickname modal (Add Store / Edit) ──────────────────────────────────────
    const [nicknameModal, setNicknameModal] = useState({ open: false, mode: "add", store: null, nickname: "" });

    // ── Set Permission modal ───────────────────────────────────────────────────
    const [permModal, setPermModal] = useState({ open: false, store: null });
    const [permSearch, setPermSearch] = useState("");
    const [permRole, setPermRole] = useState("All Roles");
    const [permSelected, setPermSelected] = useState([]);

    const filtered = useMemo(() => {
        let list = [...MOCK_STORES];
        if (platform !== "All") list = list.filter((s) => s.marketplace === platform);
        if (authFilter !== "All") list = list.filter((s) => s.authStatus === authFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((s) =>
                s.marketplace.toLowerCase().includes(q) ||
                s.nickname.toLowerCase().includes(q) ||
                s.storeId.toLowerCase().includes(q) ||
                s.country.toLowerCase().includes(q)
            );
        }
        return list;
    }, [platform, authFilter, search]);

    // ── Selection ──────────────────────────────────────────────────────────────
    const toggleSelect = (id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    const toggleAll = () => {
        const ids = filtered.map((s) => s.id);
        setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids);
    };

    // ── Nickname modal helpers ─────────────────────────────────────────────────
    const openAddStore = () => setNicknameModal({ open: true, mode: "add", store: null, nickname: "" });
    const openEditStore = (store) => setNicknameModal({ open: true, mode: "edit", store, nickname: store.nickname });
    const closeNickname = () => setNicknameModal({ open: false, mode: "add", store: null, nickname: "" });
    const setNickname = (v) => setNicknameModal((p) => ({ ...p, nickname: v }));
    const handleNicknameSubmit = () => { closeNickname(); };

    // ── Permission modal helpers ───────────────────────────────────────────────
    const openPermModal = (store) => { setPermModal({ open: true, store }); setPermSelected([]); setPermSearch(""); };
    const closePermModal = () => setPermModal({ open: false, store: null });
    const togglePermSub = (id) => setPermSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    const confirmPerm = () => closePermModal();

    const filteredSubAccounts = useMemo(() => {
        if (!permSearch.trim()) return SUB_ACCOUNTS;
        const q = permSearch.toLowerCase();
        return SUB_ACCOUNTS.filter((a) => a.account.toLowerCase().includes(q) || a.fullName.toLowerCase().includes(q));
    }, [permSearch]);

    return {
        // filter state
        platform, setPlatform,
        selectPlatform, setSelectPlatform,
        authFilter, setAuthFilter,
        search, setSearch,
        platforms: PLATFORMS,
        statuses: STATUSES,
        // data
        stores: filtered,
        selectedIds, toggleSelect, toggleAll,
        allSelected: filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id)),
        // action dropdown
        openActionId, setOpenActionId,
        // nickname modal
        nicknameModal, openAddStore, openEditStore,
        closeNickname, setNickname, handleNicknameSubmit,
        // permission modal
        permModal, permSearch, setPermSearch,
        permRole, setPermRole,
        permSelected, togglePermSub, confirmPerm,
        filteredSubAccounts, closePermModal, openPermModal,
    };
}