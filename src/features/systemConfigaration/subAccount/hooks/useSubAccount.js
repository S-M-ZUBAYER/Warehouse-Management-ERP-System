import { useState, useMemo } from "react";
import api from "../../../../lib/api";
import useDebounce from "../../../../hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";

const MOCK_SUB_ACCOUNTS = [
    { id: 1, name: "Sophia Voss", accountId: "W120378", role: "Digital Marketer", createdAt: "01 Dec 2025  16:20", image: "https://i.pravatar.cc/36?img=1" },
    { id: 2, name: "Liam Hart", accountId: "O093809", role: "Customer Service", createdAt: "02 Dec 2025  17:30", image: "https://i.pravatar.cc/36?img=2" },
    { id: 3, name: "Amara Finch", accountId: "X456123", role: "Product Manager", createdAt: "03 Dec 2025  18:45", image: "https://i.pravatar.cc/36?img=3" },
    { id: 4, name: "Milo Drake", accountId: "P001234", role: "UX Designer", createdAt: "04 Dec 2025  19:00", image: "https://i.pravatar.cc/36?img=4" },
    { id: 5, name: "Zara Lark", accountId: "Q567890", role: "Data Analyst", createdAt: "05 Dec 2025  20:15", image: "https://i.pravatar.cc/36?img=5" },
    { id: 6, name: "Jasper Wylde", accountId: "R891011", role: "Software Engineer", createdAt: "06 Dec 2025  21:30", image: "https://i.pravatar.cc/36?img=6" },
];

const MARKETPLACE_STORES = [
    { id: 1, marketplace: "Shopee", storeName: "Shopee1" },
    { id: 2, marketplace: "Shopee", storeName: "Shopee2" },
    { id: 3, marketplace: "Lazada", storeName: "Lazada1" },
    { id: 4, marketplace: "Lazada", storeName: "Lazada2" },
    { id: 5, marketplace: "TikTok", storeName: "TikTok1" },
    { id: 6, marketplace: "TikTok", storeName: "TikTok2" },
    { id: 7, marketplace: "TikTok", storeName: "TikTok3" },

];

const WAREHOUSES = [
    { id: 1, name: "Storage-A" },
    { id: 2, name: "Depot-B" },
    { id: 3, name: "Hangar-C" },
];

const ROLES = ["Product Designer", "UX Researcher", "Customer Service", "Data Analyst", "Software Engineer"];

const EMPTY_FORM = {
    photo: null, photoPreview: null,
    role: "", warehouse: "",
    accountId: "", password: "",
    name: "", department: "",
    designation: "", phoneNumber: "",
    email: "", address: "",
};


const fetchAllWarehouses = async (search = '') => {
    const firstRes = await api.get(`/warehouses?page=1&limit=20&search=${search}`);
    const totalPages = firstRes.pagination?.totalPages ?? 1;

    if (totalPages === 1) return firstRes.data;

    // Fetch remaining pages in parallel
    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
            api.get(`/warehouses?page=${i + 2}&limit=20&search=${search}`)
        )
    );

    return [...firstRes.data, ...rest.flatMap((r) => r.data)];
};

const fetchAllRoles = async () => {
    const firstRes = await api.get(`/roles?page=1&limit=20`);
    const totalPages = firstRes.pagination?.totalPages ?? 1;

    if (totalPages === 1) return firstRes.data;

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
            api.get(`/roles?page=${i + 2}&limit=20`)
        )
    );

    return [...firstRes.data, ...rest.flatMap((r) => r.data)];
};

export function useSubAccount() {
    const [search, setSearch] = useState("");
    const [accounts, setAccounts] = useState(MOCK_SUB_ACCOUNTS);
    const [selectedIds, setSelectedIds] = useState([]);
    const [openActionId, setOpenActionId] = useState(null);

    // Add Account page
    const [showAddPage, setShowAddPage] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Store / Warehouse permissions
    const [storeSearch, setStoreSearch] = useState("");
    const [warehouseSearch, setWarehouseSearch] = useState("");
    const [selectedStores, setSelectedStores] = useState([]);
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);
    const [storeMarketplace, setStoreMarketplace] = useState("All");
    const debouncedSearch = useDebounce(warehouseSearch, 300);

    const {
        data: warehouses = [],
        isLoading: warehouseLoading,
        isError: isWarehouseError,
        error: warehouseError,
    } = useQuery({
        queryKey: ['warehouses-all', debouncedSearch],
        queryFn: () => fetchAllWarehouses(debouncedSearch),
        staleTime: 1000 * 60 * 2,
        placeholderData: (prev) => prev,
    });

    const filtered = useMemo(() => {
        if (!search.trim()) return accounts;
        const q = search.toLowerCase();
        return accounts.filter((a) =>
            a.name.toLowerCase().includes(q) ||
            a.accountId.toLowerCase().includes(q) ||
            a.role.toLowerCase().includes(q)
        );
    }, [search, accounts]);

    const filteredStores = useMemo(() => {
        let list = MARKETPLACE_STORES;
        if (storeSearch.trim()) {
            const q = storeSearch.toLowerCase();
            list = list.filter((s) => s.marketplace.toLowerCase().includes(q));
        }
        return list;
    }, [storeSearch]);

    const {
        data: roles = [],
        isLoading: rolesLoading,
        isError: rolesError,
    } = useQuery({
        queryKey: ['roles-all'],
        queryFn: fetchAllRoles,
        staleTime: 1000 * 60 * 5, // cache 5 mins
    });

    // Map to options format for FormSelect
    const roleOptions = roles.map((r) => ({
        name: r.name,
        id: r.id,        // or r.name if your form expects a string
    }));



    const filteredWarehouses = warehouses;

    const toggleSelect = (id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    const toggleStore = (id) => setSelectedStores((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    const toggleWarehouse = (id) => setSelectedWarehouses((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setForm((p) => ({ ...p, photo: file, photoPreview: url }));
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Name is required";
        if (!form.accountId.trim()) e.accountId = "Account ID is required";
        if (!form.password.trim()) e.password = "Password is required";
        if (!form.role.trim()) e.role = "Role is required";
        return e;
    };

    const handleSave = async () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setSaving(true);
        await new Promise((r) => setTimeout(r, 600));
        setAccounts((p) => [...p, { id: Date.now(), name: form.name, accountId: form.accountId, role: form.role, createdAt: new Date().toLocaleDateString(), image: "https://i.pravatar.cc/36?img=10" }]);
        setSaving(false);
        setShowAddPage(false);
        setForm(EMPTY_FORM);
    };

    return {
        search, setSearch,
        accounts: filtered,
        selectedIds, toggleSelect, setOpenActionId, openActionId,
        // Add page
        showAddPage, setShowAddPage,
        form, handleFormChange, handlePhotoChange, errors, saving, handleSave,
        // Permissions
        storeSearch, setStoreSearch,
        warehouseSearch, setWarehouseSearch,
        storeMarketplace, setStoreMarketplace,
        filteredStores, filteredWarehouses,
        selectedStores, selectedWarehouses,
        toggleStore, toggleWarehouse,
        roles: roleOptions,
        rolesLoading,
        rolesError,
        warehouses: warehouses,
        warehouseError,
        isWarehouseError,
        warehouseLoading
    };
}