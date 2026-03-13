import { useState, useMemo } from "react";

const MOCK_SUB_ACCOUNTS = [
    { id: 1, name: "Sophia Voss", accountId: "W120378", role: "Digital Marketer", createdAt: "01 Dec 2025  16:20", image: "https://i.pravatar.cc/36?img=1" },
    { id: 2, name: "Liam Hart", accountId: "O093809", role: "Customer Service", createdAt: "02 Dec 2025  17:30", image: "https://i.pravatar.cc/36?img=2" },
    { id: 3, name: "Amara Finch", accountId: "X456123", role: "Product Manager", createdAt: "03 Dec 2025  18:45", image: "https://i.pravatar.cc/36?img=3" },
    { id: 4, name: "Milo Drake", accountId: "P001234", role: "UX Designer", createdAt: "04 Dec 2025  19:00", image: "https://i.pravatar.cc/36?img=4" },
    { id: 5, name: "Zara Lark", accountId: "Q567890", role: "Data Analyst", createdAt: "05 Dec 2025  20:15", image: "https://i.pravatar.cc/36?img=5" },
    { id: 6, name: "Jasper Wylde", accountId: "R891011", role: "Software Engineer", createdAt: "06 Dec 2025  21:30", image: "https://i.pravatar.cc/36?img=6" },
];

const MARKETPLACE_STORES = [
    { id: 1, marketplace: "Shopee", storeName: "Shopee" },
    { id: 2, marketplace: "Lazada", storeName: "Lazada" },
    { id: 3, marketplace: "Tokopedia", storeName: "Tokopedia" },
    { id: 4, marketplace: "Bukalapak", storeName: "Bukalapak" },
    { id: 5, marketplace: "Zalora", storeName: "Zalora" },
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

    const filteredWarehouses = useMemo(() => {
        if (!warehouseSearch.trim()) return WAREHOUSES;
        const q = warehouseSearch.toLowerCase();
        return WAREHOUSES.filter((w) => w.name.toLowerCase().includes(q));
    }, [warehouseSearch]);

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
        roles: ROLES,
        warehouses: WAREHOUSES,
    };
}