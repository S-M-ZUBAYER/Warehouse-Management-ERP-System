import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/api";
import { toast } from "sonner";
import i18n from "../../../../i18n";

const PLATFORMS = ["All", "Shopee", "Lazada", "TikTok"];
const STATUSES = ["All", "Authorized", "Disabled"];
const AUTO_ORDER_ACCEPT_DAY_OPTIONS = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
];
const DEFAULT_AUTO_ORDER_ACCEPT_DAYS = AUTO_ORDER_ACCEPT_DAY_OPTIONS.map((day) => day.value);
const ADD_STORE_COUNTRIES = {
    Shopee: ["SG", "MY", "TH", "VN", "PH", "ID"],
    TikTok: ["SG", "MY", "TH", "VN", "PH", "ID"],
};

const readJsonStorage = (key, fallback = {}) => {
    if (typeof localStorage === "undefined") return fallback;
    try {
        return JSON.parse(localStorage.getItem(key) || "null") || fallback;
    } catch {
        return fallback;
    }
};

const getCurrentCompanyContext = () => {
    const storedUser = readJsonStorage("warehouseUser", {});
    const authUser = readJsonStorage("auth-storage", {});
    const authStateUser = authUser?.state?.user || {};
    const authStateToken = authUser?.state?.token || {};

    return {
        companyId:
            storedUser?.companyId ||
            storedUser?.company_id ||
            storedUser?.company?.id ||
            authStateUser?.companyId ||
            authStateUser?.company_id ||
            authStateUser?.company?.id ||
            storedUser?.id ||
            storedUser?.userId ||
            authStateUser?.id ||
            "",
        email:
            storedUser?.email ||
            storedUser?.userEmail ||
            authStateUser?.email ||
            authStateToken?.email ||
            "",
    };
};

const platformLabel = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (normalized === "shopee") return "Shopee";
    if (normalized === "lazada") return "Lazada";
    if (normalized === "tiktok") return "TikTok";
    return value || "-";
};

const normalizeAutoOrderAcceptDays = (value, fallback = DEFAULT_AUTO_ORDER_ACCEPT_DAYS) => {
    const source = Array.isArray(value)
        ? value
        : String(value ?? "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    const days = [...new Set(source.map((item) => Number(item)))]
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        .sort((a, b) => a - b);

    return days.length ? days : fallback;
};

const formatAutoOrderAcceptDays = (days = DEFAULT_AUTO_ORDER_ACCEPT_DAYS) => {
    if (days.length === AUTO_ORDER_ACCEPT_DAY_OPTIONS.length) return "Every day";
    const labels = new Map(AUTO_ORDER_ACCEPT_DAY_OPTIONS.map((day) => [day.value, day.label.slice(0, 3)]));
    return days.map((day) => labels.get(day) || String(day)).join(", ");
};

const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
};

const formatRemainingDays = (days, status) => {
    const count = Math.max(0, Number(days || 0));
    if (String(status || "").toLowerCase() === "expired" || count === 0) return "Expired";
    return `${count} ${count === 1 ? "day" : "days"} left`;
};

const normalizeStore = (store) => {
    const marketplace = platformLabel(store.platform);
    const nickname = store.store_name || store.external_store_name || "-";
    const autoOrderAcceptDays = normalizeAutoOrderAcceptDays(store.auto_order_accept_days ?? store.autoOrderAcceptDays);
    const subscription = store.subscription || {};
    const hasSubscriptionInfo =
        subscription.status !== undefined ||
        subscription.remainingDays !== undefined ||
        subscription.expiresAt !== undefined ||
        subscription.expires_at !== undefined;
    const subscriptionStatus = String(subscription.status || "").toLowerCase();
    const remainingDays = Math.max(0, Number(subscription.remainingDays || 0));
    const isSubscriptionExpired = hasSubscriptionInfo && (subscriptionStatus === "expired" || remainingDays === 0);
    const isSubscriptionExpiringSoon = !isSubscriptionExpired && hasSubscriptionInfo && remainingDays < 7;
    const autoOrderAccept = isSubscriptionExpired ? false : Boolean(store.auto_order_accept ?? store.autoOrderAccept);
    return {
        id: store.id,
        raw: store,
        marketplace,
        nickname,
        storeId: store.external_store_id || store.store_shop_id || store.id,
        shopId: store.store_shop_id || "-",
        openId: store.store_open_id || "-",
        cipher: store.store_cipher || "-",
        country: store.region || "-",
        authStatus: store.is_active ? "Authorized" : "Disabled",
        autoOrderAccept,
        autoOrderAcceptLabel: autoOrderAccept ? "On" : "Off",
        autoOrderAcceptDays,
        autoOrderAcceptDaysLabel: formatAutoOrderAcceptDays(autoOrderAcceptDays),
        currentPlan: subscription.planName || "-",
        subscriptionStatus,
        subscriptionStatusLabel: subscriptionStatus
            ? subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)
            : "-",
        remainingDays,
        remainingDaysLabel: formatRemainingDays(remainingDays, subscriptionStatus),
        isSubscriptionExpiringSoon,
        expiresAt: formatDateTime(subscription.expiresAt || subscription.expires_at),
        isSubscriptionExpired,
        createdAt: formatDateTime(store.createdAt || store.created_at),
        defaultWarehouse: store.defaultWarehouse?.name || store.defaultWarehouse?.code || "-",
    };
};

const normalizePermissionUser = (user) => ({
    id: user.id,
    account: user.account || user.account_id || user.email || `User #${user.id}`,
    email: user.email || "-",
    fullName: user.fullName || user.name || "-",
    roleId: user.roleId || user.role_id || user.roleInfo?.id || "",
    role: user.roleName || user.roleInfo?.name || user.role || "-",
    isActive: user.isActive !== false,
    canEdit: Boolean(user.canEdit || user.can_edit),
    selected: Boolean(user.selected || user.canView || user.can_view),
});

export function useStoreAuthorization() {
    const queryClient = useQueryClient();
    const [platform, setPlatform] = useState("All");
    const [selectPlatform, setSelectPlatform] = useState("All");
    const [authFilter, setAuthFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedStores, setSelectedStores] = useState([]);
    const [selectionLoading, setSelectionLoading] = useState(false);
    const [storesRaw, setStoresRaw] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [openActionId, setOpenActionId] = useState(null);
    const [nicknameModal, setNicknameModal] = useState({ open: false, mode: "edit", store: null, nickname: "", saving: false });
    const [permModal, setPermModal] = useState({ open: false, store: null, loading: false, saving: false });
    const [permAccounts, setPermAccounts] = useState([]);
    const [permSearch, setPermSearch] = useState("");
    const [permRole, setPermRole] = useState("all");
    const [permSelected, setPermSelected] = useState([]);
    const [permEditIds, setPermEditIds] = useState([]);
    const [unlinkModal, setUnlinkModal] = useState({ open: false, store: null, loading: false });
    const [autoOrderAcceptModal, setAutoOrderAcceptModal] = useState({
        open: false,
        mode: "toggle",
        store: null,
        nextValue: false,
        selectedDays: DEFAULT_AUTO_ORDER_ACCEPT_DAYS,
        loading: false,
    });
    const [addStoreModal, setAddStoreModal] = useState({
        open: false,
        platform: "",
        country: "",
        loading: false,
        errors: {},
    });

    const loadStores = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/platform-stores", { params: { page: 1, limit: 1000 } });
            const list = Array.isArray(res?.data) ? res.data : [];
            setStoresRaw(list);
            queryClient.invalidateQueries({ queryKey: ["global", "shop-platform-dropdowns"] });
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Failed to load platform stores");
            setStoresRaw([]);
        } finally {
            setLoading(false);
        }
    }, [queryClient]);

    useEffect(() => {
        loadStores();
    }, [loadStores]);

    const setPlatformFilter = useCallback((value) => {
        setPlatform(value);
        setSelectPlatform(value);
        setSelectedIds([]);
        setSelectedStores([]);
    }, []);

    const setSelectPlatformFilter = useCallback((value) => {
        setSelectPlatform(value);
        setPlatform(value);
        setSelectedIds([]);
        setSelectedStores([]);
    }, []);

    const filterStores = useCallback((rows) => {
        let list = rows.map(normalizeStore);
        if (platform !== "All") list = list.filter((s) => s.marketplace === platform);
        if (authFilter !== "All") list = list.filter((s) => s.authStatus === authFilter);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((s) =>
                [s.marketplace, s.nickname, s.storeId, s.shopId, s.openId, s.country, s.authStatus, s.autoOrderAcceptLabel, s.autoOrderAcceptDaysLabel, s.defaultWarehouse]
                    .some((value) => String(value || "").toLowerCase().includes(q))
            );
        }
        return list;
    }, [platform, authFilter, search]);

    const stores = useMemo(() => filterStores(storesRaw), [filterStores, storesRaw]);

    useEffect(() => {
        setSelectedIds((prev) => prev.filter((id) => stores.some((store) => store.id === id)));
        setSelectedStores((prev) => prev.filter((store) => stores.some((item) => item.id === store.id)));
    }, [stores]);

    const fetchAllStores = async () => {
        const res = await api.get("/platform-stores", { params: { page: 1, limit: 1000 } });
        const list = Array.isArray(res?.data) ? res.data : [];
        return filterStores(list);
    };

    const toggleSelect = (id) => setSelectedIds((p) => {
        if (p.includes(id)) {
            setSelectedStores((rows) => rows.filter((store) => store.id !== id));
            return p.filter((x) => x !== id);
        }

        const selectedStore = stores.find((store) => store.id === id);
        if (selectedStore) {
            setSelectedStores((rows) => rows.some((store) => store.id === id) ? rows : [...rows, selectedStore]);
        }
        return [...p, id];
    });

    const toggleAll = async () => {
        setSelectionLoading(true);
        try {
            const rows = await fetchAllStores();
            const ids = rows.map((s) => s.id);
            const shouldClear = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
            setSelectedIds(shouldClear ? [] : ids);
            setSelectedStores(shouldClear ? [] : rows);
        } finally {
            setSelectionLoading(false);
        }
    };

    const openAddStore = () => {
        setAddStoreModal({ open: true, platform: "", country: "", loading: false, errors: {} });
    };

    const closeAddStore = () => {
        setAddStoreModal((prev) => {
            if (prev.loading) return prev;
            return { open: false, platform: "", country: "", loading: false, errors: {} };
        });
    };

    const setAddStorePlatform = (value) => {
        setAddStoreModal((prev) => ({ ...prev, platform: value, country: "", errors: { ...prev.errors, platform: "", country: "" } }));
    };

    const setAddStoreCountry = (value) => {
        setAddStoreModal((prev) => ({ ...prev, country: value, errors: { ...prev.errors, country: "" } }));
    };

    const submitAddStore = () => {
        const errors = {};
        if (!addStoreModal.platform) errors.platform = "Please select a platform";
        if (!addStoreModal.country) errors.country = "Please select a country";

        if (Object.keys(errors).length > 0) {
            setAddStoreModal((prev) => ({ ...prev, errors }));
            return;
        }

        const { companyId, email } = getCurrentCompanyContext();
        if (!companyId || !email) {
            toast.error("Company ID or company email is missing. Please sign in again.");
            return;
        }

        const state = encodeURIComponent(`WMS${companyId}/${email}`);

        const authUrl = addStoreModal.platform === "Shopee"
            ? `https://grozziie.zjweiting.com:3091/new-shopee-open-shop/auth/url-generate/by-state?state=${state}`
            : `https://services.tiktokshop.com/open/authorize?service_id=7525737223036126981&state=${state}`;

        setAddStoreModal((prev) => ({ ...prev, loading: true, errors: {} }));
        window.location.href = authUrl;
    };

    const openEditStore = (store) => setNicknameModal({ open: true, mode: "edit", store, nickname: store.nickname === "-" ? "" : store.nickname, saving: false });
    const closeNickname = () => setNicknameModal({ open: false, mode: "edit", store: null, nickname: "", saving: false });
    const setNickname = (v) => setNicknameModal((p) => ({ ...p, nickname: v }));

    const handleNicknameSubmit = async () => {
        if (!nicknameModal.store?.id) return closeNickname();
        const nickname = nicknameModal.nickname.trim();
        if (!nickname) {
            toast.error("Please enter store nickname");
            return;
        }
        setNicknameModal((p) => ({ ...p, saving: true }));
        try {
            await api.put(`/platform-stores/${nicknameModal.store.id}`, { storeName: nickname });
            toast.success("Store nickname updated");
            closeNickname();
            await loadStores();
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to update store nickname");
            setNicknameModal((p) => ({ ...p, saving: false }));
        }
    };

    const requestUnlinkStore = (store) => {
        if (!store?.id) return;
        setUnlinkModal({ open: true, store, loading: false });
    };

    const closeUnlinkModal = () => setUnlinkModal({ open: false, store: null, loading: false });

    const confirmUnlinkStore = async () => {
        const store = unlinkModal.store;
        if (!store?.id) return;
        setUnlinkModal((p) => ({ ...p, loading: true }));
        try {
            await api.delete(`/platform-stores/${store.id}`);
            toast.success("Store unlinked and deleted successfully");
            setOpenActionId(null);
            closeUnlinkModal();
            await loadStores();
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to unlink store");
            setUnlinkModal((p) => ({ ...p, loading: false }));
        }
    };

    const requestAutoOrderAcceptToggle = (store) => {
        if (!store?.id) return;
        if (store.isSubscriptionExpired) {
            toast.error(i18n.t("subscription.autoAcceptExpired"));
            return;
        }
        setAutoOrderAcceptModal({
            open: true,
            mode: "toggle",
            store,
            nextValue: !store.autoOrderAccept,
            selectedDays: normalizeAutoOrderAcceptDays(store.autoOrderAcceptDays),
            loading: false,
        });
    };

    const requestAutoOrderAcceptDays = (store) => {
        if (!store?.id) return;
        if (store.isSubscriptionExpired) {
            toast.error(i18n.t("subscription.autoProcessDaysExpired"));
            return;
        }
        setAutoOrderAcceptModal({
            open: true,
            mode: "days",
            store,
            nextValue: store.autoOrderAccept,
            selectedDays: normalizeAutoOrderAcceptDays(store.autoOrderAcceptDays),
            loading: false,
        });
    };

    const toggleAutoOrderAcceptDay = (day) => {
        setAutoOrderAcceptModal((prev) => {
            const selected = new Set(prev.selectedDays || []);
            if (selected.has(day)) {
                selected.delete(day);
            } else {
                selected.add(day);
            }
            return {
                ...prev,
                selectedDays: [...selected].sort((a, b) => a - b),
            };
        });
    };

    const closeAutoOrderAcceptModal = () => {
        setAutoOrderAcceptModal((prev) => {
            if (prev.loading) return prev;
            return { open: false, mode: "toggle", store: null, nextValue: false, selectedDays: DEFAULT_AUTO_ORDER_ACCEPT_DAYS, loading: false };
        });
    };

    const confirmAutoOrderAcceptToggle = async () => {
        const { store, nextValue, mode, selectedDays } = autoOrderAcceptModal;
        if (!store?.id) return;
        const normalizedDays = normalizeAutoOrderAcceptDays(selectedDays, []);
        if ((mode === "days" || nextValue) && normalizedDays.length === 0) {
            toast.error("Select at least one auto process day");
            return;
        }

        setAutoOrderAcceptModal((prev) => ({ ...prev, loading: true }));
        try {
            await api.put(
                `/platform-stores/${store.id}`,
                mode === "days"
                    ? { autoOrderAcceptDays: normalizedDays }
                    : {
                        autoOrderAccept: nextValue,
                        ...(nextValue ? { autoOrderAcceptDays: normalizedDays } : {}),
                    }
            );
            toast.success(mode === "days" ? "Auto process days updated" : "Auto Order Accept updated");
            setAutoOrderAcceptModal({ open: false, mode: "toggle", store: null, nextValue: false, selectedDays: DEFAULT_AUTO_ORDER_ACCEPT_DAYS, loading: false });
            await loadStores();
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || (mode === "days" ? "Failed to update Auto Process Days" : "Failed to update Auto Order Accept"));
            setAutoOrderAcceptModal((prev) => ({ ...prev, loading: false }));
        }
    };

    const loadPermissionUsers = useCallback(async (store) => {
        setPermModal({ open: true, store, loading: true, saving: false });
        setPermAccounts([]);
        setPermSelected([]);
        setPermEditIds([]);
        setPermSearch("");
        setPermRole("all");
        try {
            const res = await api.get(`/platform-stores/${store.id}/permissions`);
            const accounts = (res?.data?.users || []).map(normalizePermissionUser);
            setPermAccounts(accounts);
            setPermSelected(accounts.filter((acc) => acc.selected).map((acc) => acc.id));
            setPermEditIds(accounts.filter((acc) => acc.canEdit).map((acc) => acc.id));
            setPermModal({ open: true, store, loading: false, saving: false });
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to load store permissions");
            setPermModal({ open: true, store, loading: false, saving: false });
        }
    }, []);

    const openPermModal = (store) => {
        if (!store?.id) return;
        loadPermissionUsers(store);
    };

    const closePermModal = () => {
        if (permModal.saving) return;
        setPermModal({ open: false, store: null, loading: false, saving: false });
    };

    const togglePermSub = (id) => {
        setPermSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
        if (permSelected.includes(id)) {
            setPermEditIds((p) => p.filter((x) => x !== id));
        }
    };

    const togglePermEdit = (id) => {
        setPermSelected((p) => p.includes(id) ? p : [...p, id]);
        setPermEditIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    };

    const confirmPerm = async () => {
        const store = permModal.store;
        if (!store?.id) return;
        setPermModal((p) => ({ ...p, saving: true }));
        try {
            await api.put(`/platform-stores/${store.id}/permissions`, {
                permissions: permSelected.map((id) => ({
                    userId: id,
                    canView: true,
                    canEdit: permEditIds.includes(id),
                })),
            });
            toast.success("Store permission updated");
            closePermModal();
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to update store permission");
            setPermModal((p) => ({ ...p, saving: false }));
        }
    };

    const permRoles = useMemo(() => {
        const roles = permAccounts.reduce((acc, item) => {
            const key = item.roleId ? String(item.roleId) : item.role;
            if (!acc.some((role) => String(role.value) === String(key))) {
                acc.push({ value: key, label: item.role || "No Role" });
            }
            return acc;
        }, []);
        return [{ value: "all", label: "All Roles" }, ...roles];
    }, [permAccounts]);

    const filteredSubAccounts = useMemo(() => {
        let list = permAccounts;
        if (permRole !== "all") {
            list = list.filter((a) => String(a.roleId || a.role) === String(permRole));
        }
        if (permSearch.trim()) {
            const q = permSearch.toLowerCase();
            list = list.filter((a) =>
                [a.account, a.email, a.fullName, a.role]
                    .some((value) => String(value || "").toLowerCase().includes(q))
            );
        }
        return list;
    }, [permAccounts, permSearch, permRole]);

    return {
        platform, setPlatform: setPlatformFilter,
        selectPlatform, setSelectPlatform: setSelectPlatformFilter,
        authFilter, setAuthFilter,
        search, setSearch,
        platforms: PLATFORMS,
        statuses: STATUSES,
        stores,
        loading,
        error,
        reloadStores: loadStores,
        selectedIds, selectedStores, selectionLoading, toggleSelect, toggleAll,
        allSelected: stores.length > 0 && stores.every((s) => selectedIds.includes(s.id)),
        openActionId, setOpenActionId,
        nicknameModal, openAddStore, openEditStore,
        addStoreModal,
        addStoreCountries: ADD_STORE_COUNTRIES,
        closeAddStore,
        setAddStorePlatform,
        setAddStoreCountry,
        submitAddStore,
        closeNickname, setNickname, handleNicknameSubmit,
        unlinkStore: requestUnlinkStore,
        unlinkModal, closeUnlinkModal, confirmUnlinkStore,
        autoOrderAcceptModal,
        autoOrderAcceptDayOptions: AUTO_ORDER_ACCEPT_DAY_OPTIONS,
        requestAutoOrderAcceptToggle,
        requestAutoOrderAcceptDays,
        toggleAutoOrderAcceptDay,
        closeAutoOrderAcceptModal,
        confirmAutoOrderAcceptToggle,
        permModal, permSearch, setPermSearch,
        permRole, setPermRole,
        permRoles,
        permSelected,
        permEditIds,
        togglePermSub,
        togglePermEdit,
        confirmPerm,
        filteredSubAccounts,
        closePermModal,
        openPermModal,
    };
}
