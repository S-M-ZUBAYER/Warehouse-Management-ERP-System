import { useState, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api";
import useDebounce from "../../../hooks/useDebounce";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────
export const MERCHANT_SKU_KEYS = {
    all: () => ["merchant-skus"],
    list: (filters) => ["merchant-skus", "list", filters],
    detail: (id) => ["merchant-skus", "detail", id],
    dropdowns: () => ["merchant-skus", "dropdowns"],
};

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch the warehouse + country dropdowns for filter bar */
const fetchDropdowns = () =>
    api.get("/merchant-skus/dropdowns").then((r) => r.data);

/** Fetch paginated merchant SKU list */
const fetchMerchantSkus = async (params) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", params.page);
    if (params.limit) qs.set("limit", params.searchField === "gtin" && params.search?.trim() ? 1000 : params.limit);
    if (params.search?.trim() && params.searchField !== "gtin") qs.set("search", params.search.trim());
    if (params.searchField) {
        qs.set("searchField", params.searchField);
        qs.set("skuType", params.searchField);
    }
    if (params.searchField === "gtin" && params.search?.trim()) {
        qs.set("gtin", params.search.trim());
    }
    if (params.warehouseId) qs.set("warehouseId", params.warehouseId);
    if (params.status && params.status !== "all") qs.set("status", params.status);
    if (params.country && params.country !== "all") qs.set("country", params.country);
    if (params.sku?.trim()) qs.set("search", params.sku.trim()); // server searches by sku_name
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    if (params.sortOrder) qs.set("sortOrder", params.sortOrder);
    const response = await api.get(`/merchant-skus?${qs.toString()}`);

    if (params.searchField !== "gtin" || !params.search?.trim()) return response;

    const query = params.search.trim().toLowerCase();
    const filtered = (response?.data ?? []).filter((sku) =>
        String(sku.gtin ?? "").toLowerCase().includes(query)
    );

    return {
        ...response,
        data: filtered,
        pagination: {
            ...(response?.pagination ?? {}),
            page: 1,
            limit: filtered.length || params.limit || 10,
            total: filtered.length,
            totalPages: 1,
        },
    };
};

/** Convert file → base64 string (strips the data:...;base64, prefix for API) */
const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const formatDetailsForEdit = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    if (typeof value !== "string") return String(value);

    const trimmed = value.trim();
    if (!trimmed) return "";

    try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
        return value;
    }
};

const formatDetailsForSave = (value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    if (!["{", "["].includes(trimmed[0])) return trimmed;
    return JSON.stringify(JSON.parse(trimmed));
};

const optionalValue = (value) => {
    if (value === null || value === undefined) return undefined;
    const trimmed = String(value).trim();
    return trimmed === "" ? undefined : trimmed;
};

const optionalNumber = (value) => {
    const normalized = optionalValue(value);
    if (normalized === undefined) return undefined;
    return Number(normalized);
};

const compactPayload = (payload) =>
    Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined && !Number.isNaN(value))
    );

/** Create a new merchant SKU */
const createMerchantSku = async (payload) => {
    let image = undefined;
    if (payload.photoFile) {
        const base64 = await fileToBase64(payload.photoFile);
        // Strip the data URI prefix — send raw base64 only
        image = base64.replace(/^data:image\/[a-z]+;base64,/, "");
    } else if (payload.imageBase64) {
        image = String(payload.imageBase64).replace(/^data:image\/[a-z]+;base64,/, "");
    } else if (payload.imageUrl) {
        image = payload.imageUrl;
    } else if (payload.image) {
        image = payload.image;
    }
console.log({
        skuName: optionalValue(payload.skuName),
        skuTitle: optionalValue(payload.skuTitle ?? payload.productName),
        productDetails: formatDetailsForSave(payload.productDetails) || undefined,
        gtin: optionalValue(payload.gtin),
        price: optionalNumber(payload.price ?? payload.productPrice),
        costPrice: optionalNumber(payload.costPrice ?? payload.cost_price),
        country: optionalValue(payload.country),
        weight: optionalNumber(payload.weight),
        length: optionalNumber(payload.length),
        width: optionalNumber(payload.width),
        height: optionalNumber(payload.height),
        warehouseId: optionalNumber(payload.warehouseId),
        status: optionalValue(payload.status) ?? "active",
        ...(image !== undefined && { image }),
    });

    const body = compactPayload({
        skuName: optionalValue(payload.skuName),
        skuTitle: optionalValue(payload.skuTitle ?? payload.productName),
        productDetails: formatDetailsForSave(payload.productDetails) || undefined,
        gtin: optionalValue(payload.gtin),
        price: optionalNumber(payload.price ?? payload.productPrice),
        costPrice: optionalNumber(payload.costPrice ?? payload.cost_price),
        country: optionalValue(payload.country),
        weight: optionalNumber(payload.weight),
        length: optionalNumber(payload.length),
        width: optionalNumber(payload.width),
        height: optionalNumber(payload.height),
        warehouseId: optionalNumber(payload.warehouseId),
        status: optionalValue(payload.status) ?? "active",
        ...(image !== undefined && { image }),
    });

    return api.post("/merchant-skus", body).then((r) => r.data);
};

/** Update merchant SKU */
const updateMerchantSku = async ({ id, payload }) => {
    let image = undefined;
    if (payload.photoFile) {
        const base64 = await fileToBase64(payload.photoFile);
        image = base64.replace(/^data:image\/[a-z]+;base64,/, "");
    }

    const body = {
        skuName: payload.skuName,
        skuTitle: payload.productName,
        productDetails: formatDetailsForSave(payload.productDetails) || undefined,
        gtin: payload.gtin || undefined,
        price: payload.productPrice || undefined,
        weight: payload.weight || undefined,
        length: payload.length || undefined,
        width: payload.width || undefined,
        height: payload.height || undefined,
        warehouseId: payload.warehouseId || undefined,
        status: "active",
        ...(image !== undefined && { image }),
    };
    return api.put(`/merchant-skus/${id}`, body).then((r) => r.data);
};

/** Delete single SKU */
const deleteMerchantSku = (id) =>
    api.delete(`/merchant-skus/${id}`).then((r) => r.data);

/** Bulk delete SKUs */
const bulkDeleteMerchantSkus = (skuIds) =>
    api.delete("/merchant-skus/bulk", { data: { skuIds } }).then((r) => r.data);

const columnIndexFromRef = (ref = "") => {
    const letters = String(ref).replace(/\d/g, "");
    return [...letters].reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
};

const unzipXlsxFile = async (file) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const files = {};
    let offset = 0;
    const decoder = new TextDecoder();

    while (offset < bytes.length - 30) {
        const view = new DataView(bytes.buffer, offset);
        if (view.getUint32(0, true) !== 0x04034b50) break;

        const method = view.getUint16(8, true);
        const compressedSize = view.getUint32(18, true);
        const fileNameLength = view.getUint16(26, true);
        const extraLength = view.getUint16(28, true);
        const nameStart = offset + 30;
        const dataStart = nameStart + fileNameLength + extraLength;
        const name = decoder.decode(bytes.slice(nameStart, nameStart + fileNameLength));
        const compressed = bytes.slice(dataStart, dataStart + compressedSize);

        if (method === 0) {
            files[name] = decoder.decode(compressed);
        } else if (method === 8 && "DecompressionStream" in globalThis) {
            const stream = new Blob([compressed]).stream().pipeThrough(new globalThis.DecompressionStream("deflate-raw"));
            files[name] = decoder.decode(await new Response(stream).arrayBuffer());
        }

        offset = dataStart + compressedSize;
    }

    return files;
};

const readCellValue = (cell, sharedStrings) => {
    const type = cell.getAttribute("t");
    if (type === "inlineStr") return cell.querySelector("is t")?.textContent ?? "";
    const value = cell.querySelector("v")?.textContent ?? "";
    if (type === "s") return sharedStrings[Number(value)] ?? "";
    return value;
};

const TEMPLATE_HEADER_ALIASES = {
    skuname: "skuName",
    sku_name: "skuName",
    sku: "skuName",
    skutitle: "skuTitle",
    sku_title: "skuTitle",
    productname: "skuTitle",
    product_name: "skuTitle",
    producttitle: "skuTitle",
    product_title: "skuTitle",
    productdetails: "productDetails",
    product_details: "productDetails",
    details: "productDetails",
    gtin: "gtin",
    imageurl: "imageUrl",
    image_url: "imageUrl",
    imagebase64: "imageBase64",
    image_base64: "imageBase64",
    image: "image",
    price: "price",
    productprice: "price",
    product_price: "price",
    costprice: "costPrice",
    cost_price: "costPrice",
    country: "country",
    weight: "weight",
    length: "length",
    width: "width",
    height: "height",
    status: "status",
};

const normalizeTemplateHeader = (header) => {
    const key = String(header ?? "")
        .trim()
        .replace(/\s+/g, "")
        .replace(/-/g, "_")
        .toLowerCase();
    return TEMPLATE_HEADER_ALIASES[key] ?? header;
};

const getApiErrorMessage = (err) => {
    const data = err?.response?.data;
    if (data?.errors && typeof data.errors === "object") {
        return Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
            .join("; ");
    }
    return data?.message ?? err?.message ?? "Validation error";
};

const parseMerchantSkuTemplate = async (file) => {
    const files = await unzipXlsxFile(file);
    const sheetXml = files["xl/worksheets/sheet1.xml"];
    if (!sheetXml) throw new Error("Could not read the first worksheet from this XLSX file");

    const parser = new DOMParser();
    const sharedXml = files["xl/sharedStrings.xml"];
    const sharedStrings = sharedXml
        ? [...parser.parseFromString(sharedXml, "application/xml").querySelectorAll("si")]
            .map((node) => [...node.querySelectorAll("t")].map((text) => text.textContent).join(""))
        : [];
    const sheet = parser.parseFromString(sheetXml, "application/xml");
    const rows = [...sheet.querySelectorAll("sheetData row")].map((row) => {
        const values = [];
        [...row.querySelectorAll("c")].forEach((cell) => {
            values[columnIndexFromRef(cell.getAttribute("r"))] = readCellValue(cell, sharedStrings);
        });
        return values;
    }).filter((row) => row.some((value) => String(value ?? "").trim()));

    const headers = (rows[0] ?? []).map(normalizeTemplateHeader);
    return rows.slice(1).map((row) =>
        headers.reduce((record, header, index) => {
            if (header) record[header] = String(row[index] ?? "").trim();
            return record;
        }, {})
    ).filter((record) => Object.values(record).some(Boolean));
};

const importMerchantSkuTemplate = async ({ file, warehouseId }) => {
    const rows = await parseMerchantSkuTemplate(file);
    if (!rows.length) throw new Error("No product rows found in the XLSX file");

    const results = [];
    for (const [index, row] of rows.entries()) {
        if (!row.skuName || !(row.skuTitle || row.productName)) {
            throw new Error(`Row ${index + 2}: Each row must include skuName and skuTitle`);
        }
        if (!optionalValue(row.price ?? row.productPrice)) {
            throw new Error(`Row ${index + 2} (${row.skuName}): price is required`);
        }
        try {
            results.push(await createMerchantSku({
                ...row,
                warehouseId,
            }));
        } catch (err) {
            const message = getApiErrorMessage(err);
            throw new Error(`Row ${index + 2} (${row.skuName}): ${message}`);
        }
    }

    return { imported: results.length, message: `${results.length} product(s) imported successfully` };
};

const setStockAlert = ({ skuIds, minStock }) =>
    api.put("/inventory/stock-alert", {
        skuIds: skuIds.map(Number),
        minStock: Number(minStock),
    }).then((r) => r.data);

const getStockRowIds = (product) => {
    if (Array.isArray(product?.stock)) {
        return product.stock.flatMap((stock) => [
            stock?.id,
            stock?.stock_id,
            stock?.stockId,
            stock?.sku_warehouse_stock_id,
            stock?.skuWarehouseStockId,
            stock?.skuWarehouseStock?.id,
        ]).filter(Boolean);
    }
    return [
        product?.stock?.id,
        product?.stock?.stock_id,
        product?.stock?.stockId,
        product?.stock?.sku_warehouse_stock_id,
        product?.stock?.skuWarehouseStockId,
        product?.stock?.skuWarehouseStock?.id,
        product?.stock_id,
        product?.stockId,
        product?.sku_warehouse_stock_id,
        product?.skuWarehouseStockId,
    ].filter(Boolean);
};

const findInventoryStockRowIds = async (product) => {
    const skuName = product?.sku_name ?? product?.skuName;
    if (!skuName) return [];

    const qs = new URLSearchParams({
        page: "1",
        limit: "100",
        search: skuName,
        skuType: "sku_name",
    });

    const response = await api.get(`/inventory?${qs.toString()}`);
    return (response?.data ?? [])
        .filter((row) =>
            row?.merchantSku?.id === product.id ||
            row?.merchant_sku_id === product.id ||
            row?.merchantSku?.sku_name === skuName ||
            row?.sku_name === skuName
        )
        .map((row) => row.id)
        .filter(Boolean);
};

// ─────────────────────────────────────────────────────────────────────────────
// Empty form
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
    productName: "",
    skuName: "",
    productDetails: "",
    gtin: "",
    productPrice: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    warehouseId: "",
    warehouseName: "Warehouse name",
    photoFile: null,
    photoPreview: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Main hook
// ─────────────────────────────────────────────────────────────────────────────
export function useProductList() {
    // ── Filter state ──────────────────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [searchField, setSearchField] = useState("sku_name");
    const [warehouseFilter, setWarehouseFilter] = useState("all");
    const [warehouseFilterName, setWarehouseFilterName] = useState("All Warehouses");
    const [productStatus, setProductStatus] = useState("all");
    const [country, setCountry] = useState("all");
    const [sku, setSku] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy] = useState("created_at");
    const [sortOrder] = useState("DESC");
    const [bulkAction, setBulkAction] = useState("");

    // ── Selection state ───────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState([]);

    // ── Add modal state ───────────────────────────────────────────────────────
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [warehouseSearch, setWarehouseSearch] = useState("");
    const fileInputRef = useRef(null);

    // ── Delete confirm state ──────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [showStockAlertModal, setShowStockAlertModal] = useState(false);
    const [minStock, setMinStock] = useState("");
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importWarehouseId, setImportWarehouseId] = useState("");
    const [importWarehouseName, setImportWarehouseName] = useState("Warehouse name");

    // ── Debounced values ──────────────────────────────────────────────────────
    const debouncedSearch = useDebounce(search, 350);
    const debouncedSku = useDebounce(sku, 350);
    const debouncedWhSearch = useDebounce(warehouseSearch, 300);

    const queryClient = useQueryClient();

    // ─────────────────────────────────────────────────────────────────────────
    // Query: dropdowns (warehouses + countries)
    // ─────────────────────────────────────────────────────────────────────────
    const {
        data: dropdowns,
        isLoading: dropdownsLoading,
        isError: isDropdownError,
    } = useQuery({
        queryKey: MERCHANT_SKU_KEYS.dropdowns(),
        queryFn: fetchDropdowns,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });

    // Build dropdown option arrays from API response
    const warehouseOptions = useMemo(() => {
        const base = [{ label: "All Warehouses", value: "all" }];
        if (!dropdowns?.warehouses) return base;
        return [
            ...base,
            ...dropdowns.warehouses.map((w) => ({
                label: w.name,
                value: String(w.id),
            })),
        ];
    }, [dropdowns]);

    const countryOptions = useMemo(() => {
        const base = [{ label: "All Countries", value: "all" }];
        if (!dropdowns?.countries) return base;
        return [
            ...base,
            ...dropdowns.countries.map((c) => ({ label: c, value: c })),
        ];
    }, [dropdowns]);

    const statusOptions = [
        { label: "All Status", value: "all" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "In Stock", value: "in_stock" },
        { label: "Out of Stock", value: "out_of_stock" },
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Query: warehouse list for the modal picker (with search)
    // Uses same pattern as your demo fetchAllWarehouses
    // ─────────────────────────────────────────────────────────────────────────
    const fetchAllWarehouses = useCallback((search = "") => {
        const qs = search
            ? `?page=1&limit=20&search=${encodeURIComponent(search)}`
            : "?page=1&limit=20";
        return api.get(`/warehouses${qs}`).then(async (first) => {
            const totalPages = first.pagination?.totalPages ?? 1;
            if (totalPages === 1) return first.data;
            const rest = await Promise.all(
                Array.from({ length: totalPages - 1 }, (_, i) =>
                    api.get(`/warehouses?page=${i + 2}&limit=20&search=${encodeURIComponent(search)}`)
                )
            );
            return [...first.data, ...rest.flatMap((r) => r.data)];
        });
    }, []);

    const {
        data: modalWarehouses = [],
        isLoading: warehouseLoading,
        isError: isWarehouseError,
        error: warehouseError,
    } = useQuery({
        queryKey: ["warehouses", "modal", debouncedWhSearch],
        queryFn: () => fetchAllWarehouses(debouncedWhSearch),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
        placeholderData: (prev) => prev,
        enabled: showAddModal || showImportModal,  // only fetch when a modal needs warehouses
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Query: merchant SKU list
    // ─────────────────────────────────────────────────────────────────────────
    const listFilters = useMemo(() => ({
        page,
        limit: 10,
        search: debouncedSearch,
        searchField,
        sku: debouncedSku,
        warehouseId: warehouseFilter !== "all" ? warehouseFilter : undefined,
        status: productStatus,
        country: country,
        sortBy,
        sortOrder,
    }), [page, debouncedSearch, searchField, debouncedSku, warehouseFilter, productStatus, country, sortBy, sortOrder]);

    const {
        data: listData,
        isLoading: listLoading,
        isFetching: listFetching,
        isError: isListError,
        error: listError,
    } = useQuery({
        queryKey: MERCHANT_SKU_KEYS.list(listFilters),
        queryFn: () => fetchMerchantSkus(listFilters),
        staleTime: 1000 * 60 * 1,
        gcTime: 1000 * 60 * 3,
        placeholderData: (prev) => prev,
    });

    const products = useMemo(() => listData?.data ?? [], [listData?.data]);
    const pagination = listData?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 20 };

    // ─────────────────────────────────────────────────────────────────────────
    // Mutation: create merchant SKU
    // ─────────────────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: createMerchantSku,
        onSuccess: (data) => {
            toast.success(`SKU "${data.sku_name}" created successfully`);
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.all() });
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.dropdowns() });
            setShowAddModal(false);
            setForm(EMPTY_FORM);
            setErrors({});
        },
        onError: (err) => {
            const status = err?.response?.status;
            const msg = err?.response?.data?.message ?? err.message ?? "Failed to create SKU";

            if (status === 409) {
                // Duplicate SKU name
                setErrors({ skuName: msg });
                toast.error(msg);
                return;
            }

            if (status === 422) {
                // Validation errors
                const fieldErrors = err?.response?.data?.errors;
                if (fieldErrors?.length) {
                    const mapped = {};
                    fieldErrors.forEach(({ field, message }) => {
                        const localField = field === "skuTitle" ? "productName" : field;
                        mapped[localField] = message;
                    });
                    setErrors(mapped);
                }
            }

            toast.error(msg);
        },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Mutation: update merchant SKU
    // ─────────────────────────────────────────────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: updateMerchantSku,
        onSuccess: (data) => {
            toast.success(`SKU "${data.sku_name}" updated successfully`);
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.all() });
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.dropdowns() });
            setShowAddModal(false);
            setEditingProduct(null);
            setForm(EMPTY_FORM);
            setErrors({});
        },
        onError: (err) => {
            const fieldErrors = err?.response?.data?.errors;
            if (fieldErrors?.length) {
                const mapped = {};
                fieldErrors.forEach(({ field, message }) => {
                    const localField = field === "skuTitle" ? "productName" : field;
                    mapped[localField] = message;
                });
                setErrors(mapped);
            }
            toast.error(err?.response?.data?.message ?? err.message ?? "Failed to update product");
        },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Mutation: delete single
    // ─────────────────────────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: deleteMerchantSku,
        onSuccess: () => {
            toast.success("Product deleted successfully");
            setShowDeleteModal(false);
            setDeleteTarget(null);
            setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget?.id));
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.all() });
        },
        onError: (err) => {
            const msg = err?.response?.data?.message ?? "Failed to delete product";
            toast.error(msg);
        },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Mutation: bulk delete
    // ─────────────────────────────────────────────────────────────────────────
    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeleteMerchantSkus,
        onSuccess: (data) => {
            toast.success(`${data.deleted} product(s) deleted successfully`);
            setSelectedIds([]);
            setBulkDeleteConfirm(false);
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.all() });
        },
        onError: (err) => {
            const msg = err?.response?.data?.message ?? "Bulk delete failed";
            toast.error(msg);
        },
    });

    const stockAlertMutation = useMutation({
        mutationFn: setStockAlert,
        onSuccess: (data) => {
            toast.success(data?.message ?? "Stock alert updated");
            setShowStockAlertModal(false);
            setSelectedIds([]);
            setMinStock("");
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? "Failed to set stock alert");
        },
    });

    const importTemplateMutation = useMutation({
        mutationFn: importMerchantSkuTemplate,
        onSuccess: (data) => {
            toast.success(data?.message ?? "Products imported successfully");
            setShowImportModal(false);
            setImportFile(null);
            setImportWarehouseId("");
            setImportWarehouseName("Warehouse name");
            queryClient.invalidateQueries({ queryKey: MERCHANT_SKU_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? err?.message ?? "Failed to import products");
        },
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Form helpers
    // ─────────────────────────────────────────────────────────────────────────
    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    }, [errors]);

    const handlePhotoChange = useCallback((e) => {
        console.log("hanle to photo change");

        const file = e.target.files?.[0];
        if (!file) return;
        // Client-side size check (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB");
            return;
        }
        setForm((prev) => ({
            ...prev,
            photoFile: file,
            photoPreview: URL.createObjectURL(file),
        }));
    }, []);

    const handleWarehouseSelect = useCallback((warehouse) => {
        setForm((prev) => ({
            ...prev,
            warehouseId: String(warehouse.id),
            warehouseName: warehouse.name,
        }));
        if (errors.warehouseId) setErrors((prev) => ({ ...prev, warehouseId: "" }));
    }, [errors]);

    const validate = useCallback(() => {
        const e = {};
        if (!form.productName.trim()) e.productName = "Product Name is required";
        if (!form.skuName.trim()) e.skuName = "SKU Name is required";
        const details = form.productDetails.trim();
        if (!details) e.productDetails = "Product Details is required";
        if (details && ["{", "["].includes(details[0])) {
            try {
                JSON.parse(details);
            } catch {
                e.productDetails = "Details JSON is not valid";
            }
        }
        if (form.productPrice && isNaN(Number(form.productPrice))) e.productPrice = "Must be a valid number";
        if (form.weight && isNaN(Number(form.weight))) e.weight = "Must be a valid number";
        return e;
    }, [form]);

    const handleSave = useCallback(async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length) {
            setErrors(validationErrors);
            toast.error("Please fix the highlighted fields");
            return;
        }
        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, payload: form });
        } else {
            createMutation.mutate(form);
        }
    }, [form, validate, createMutation, updateMutation, editingProduct]);

    const handleCloseModal = useCallback(() => {
        console.log("call this function");

        setShowAddModal(false);
        setEditingProduct(null);
        setForm(EMPTY_FORM);
        setErrors({});
        setWarehouseSearch("");
    }, []);

    const openEditModal = useCallback((product) => {
        setEditingProduct(product);
        setForm({
            productName: product.sku_title ?? product.product_name ?? "",
            skuName: product.sku_name ?? "",
            productDetails: formatDetailsForEdit(product.product_details ?? product.productDetails ?? ""),
            gtin: product.gtin ?? "",
            productPrice: product.price ?? "",
            weight: product.weight ?? "",
            length: product.length ?? "",
            width: product.width ?? "",
            height: product.height ?? "",
            warehouseId: product.warehouse_id ? String(product.warehouse_id) : "",
            warehouseName: product.warehouse?.name ?? product.warehouse_name ?? "Warehouse name",
            photoFile: null,
            photoPreview: product.image_url ?? null,
        });
        setErrors({});
        setShowAddModal(true);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Delete helpers
    // ─────────────────────────────────────────────────────────────────────────
    const openDeleteModal = useCallback((product) => {
        setDeleteTarget(product);
        setShowDeleteModal(true);
    }, []);

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id);
    }, [deleteTarget, deleteMutation]);

    const confirmBulkDelete = useCallback(() => {
        if (!selectedIds.length) return;
        bulkDeleteMutation.mutate(selectedIds);
    }, [selectedIds, bulkDeleteMutation]);

    const handleStockAlertOpen = useCallback(() => {
        if (!selectedIds.length) {
            toast.error("Select at least one product to set alert");
            return;
        }
        setMinStock("");
        setShowStockAlertModal(true);
    }, [selectedIds]);

    const confirmSetStockAlert = useCallback(async () => {
        if (minStock === "" || isNaN(Number(minStock)) || Number(minStock) < 0) {
            toast.error("Enter a valid minimum stock quantity (0 or more)");
            return;
        }

        const selectedProducts = products.filter((product) => selectedIds.includes(product.id));
        const directStockRowIds = selectedProducts.flatMap(getStockRowIds);
        const productsNeedingLookup = selectedProducts.filter(
            (product) => getStockRowIds(product).length === 0
        );
        const lookedUpStockRowIds = (
            await Promise.all(productsNeedingLookup.map(findInventoryStockRowIds))
        ).flat();
        const stockRowIds = [...new Set([...directStockRowIds, ...lookedUpStockRowIds])];

        if (!stockRowIds.length) {
            toast.error("Could not resolve stock rows for the selected products");
            return;
        }

        stockAlertMutation.mutate({ skuIds: stockRowIds, minStock });
    }, [selectedIds, minStock, products, stockAlertMutation]);

    const confirmImportTemplate = useCallback(() => {
        if (!importFile) {
            toast.error("Please select an XLSX file first");
            return;
        }
        if (!importWarehouseId) {
            toast.error("Please select a warehouse");
            return;
        }
        importTemplateMutation.mutate({ file: importFile, warehouseId: importWarehouseId });
    }, [importFile, importWarehouseId, importTemplateMutation]);

    const handleImportWarehouseSelect = useCallback((warehouse) => {
        setImportWarehouseId(String(warehouse.id ?? warehouse.value));
        setImportWarehouseName(warehouse.name ?? warehouse.label);
    }, []);

    const resetImportTemplateState = useCallback(() => {
        setImportFile(null);
        setImportWarehouseId("");
        setImportWarehouseName("Warehouse name");
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Selection helpers
    // ─────────────────────────────────────────────────────────────────────────
    const toggleSelect = useCallback((id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }, []);

    const toggleAll = useCallback(() => {
        const ids = products.map((p) => p.id);
        const allSel = ids.every((id) => selectedIds.includes(id));
        setSelectedIds(allSel ? [] : ids);
    }, [products, selectedIds]);

    // ─────────────────────────────────────────────────────────────────────────
    // Filter helpers
    // ─────────────────────────────────────────────────────────────────────────
    const resetFilters = useCallback(() => {
        setSearch("");
        setSearchField("sku_name");
        setSku("");
        setWarehouseFilter("all");
        setWarehouseFilterName("All Warehouses");
        setProductStatus("all");
        setCountry("all");
        setPage(1);
    }, []);

    const hasActiveFilters =
        search.trim() || sku.trim() ||
        warehouseFilter !== "all" ||
        productStatus !== "all" ||
        country !== "all";

    const handleWarehouseFilterChange = useCallback((value, label) => {
        setWarehouseFilter(value);
        setWarehouseFilterName(label);
        setPage(1);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Bulk action handler
    // ─────────────────────────────────────────────────────────────────────────
    const handleBulkAction = useCallback((action) => {
        if (action === "delete" && selectedIds.length > 0) {
            setBulkDeleteConfirm(true);
        }
        setBulkAction(action);
    }, [selectedIds]);

    return {
        // ── filter state ────────────────────────────────────────────────────
        search, setSearch,
        searchField, setSearchField,
        warehouseFilter, warehouseFilterName, handleWarehouseFilterChange,
        productStatus, setProductStatus,
        country, setCountry,
        sku, setSku,
        bulkAction, setBulkAction, handleBulkAction,

        // ── dropdown options ─────────────────────────────────────────────────
        warehouseOptions,
        statusOptions,
        countryOptions,

        // ── product list data ────────────────────────────────────────────────
        products,
        pagination,
        page, setPage,
        listLoading,
        listFetching,
        isListError,
        listError,

        // ── selection ────────────────────────────────────────────────────────
        selectedIds,
        toggleSelect,
        toggleAll,
        allSelected: products.length > 0 && products.every((p) => selectedIds.includes(p.id)),
        someSelected: products.some((p) => selectedIds.includes(p.id)),

        // ── filter meta ──────────────────────────────────────────────────────
        resetFilters,
        hasActiveFilters,
        dropdownsLoading,
        isDropdownError,

        // ── add modal ────────────────────────────────────────────────────────
        showAddModal, setShowAddModal,
        editingProduct, openEditModal,
        form, setForm,
        errors, setErrors,
        fileInputRef,
        handleFormChange,
        handlePhotoChange,
        handleWarehouseSelect,
        handleSave,
        handleCloseModal,
        saving: createMutation.isPending || updateMutation.isPending,

        // ── warehouse search (inside modal) ──────────────────────────────────
        warehouseSearch, setWarehouseSearch,
        modalWarehouses,
        warehouseLoading,
        isWarehouseError,
        warehouseError,

        // ── delete ───────────────────────────────────────────────────────────
        deleteTarget,
        showDeleteModal, setShowDeleteModal,
        openDeleteModal,
        confirmDelete,
        deleting: deleteMutation.isPending,

        // ── bulk delete ──────────────────────────────────────────────────────
        bulkDeleteConfirm, setBulkDeleteConfirm,
        confirmBulkDelete,
        bulkDeleting: bulkDeleteMutation.isPending,

        showStockAlertModal, setShowStockAlertModal,
        minStock, setMinStock,
        handleStockAlertOpen,
        confirmSetStockAlert,
        stockAlertSaving: stockAlertMutation.isPending,

        showImportModal, setShowImportModal,
        importFile, setImportFile,
        importWarehouseId, importWarehouseName,
        handleImportWarehouseSelect,
        resetImportTemplateState,
        confirmImportTemplate,
        importingTemplate: importTemplateMutation.isPending,
    };
}
