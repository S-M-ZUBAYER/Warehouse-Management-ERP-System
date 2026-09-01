import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  AlertCircle,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Topbar from "../../../components/layout/Topbar";
import ConfirmActionModal from "../../../components/shared/ConfirmActionModal";
import ManualOrderSubscriptionGate from "../shared/components/ManualOrderSubscriptionGate";
import OrderFooter from "../shared/components/OrderFooter";
import PageSizePagination from "../shared/components/PageSizePagination";
import api from "../../../lib/api";
import { filterWarehousesByPermission } from "../../../utils/permissions";
import { formatPlatformDateTime, resolvePlatformRegion } from "../shared/utils/platformDateTime";

const STATUS_OPTIONS = ["All", "Processed", "On The Way", "Shipped", "Delivered", "Completed", "Cancelled"];
const SEARCH_TYPES = ["Single Search", "Batch Search"];
const SEARCH_FIELDS = ["SKU", "Order Number"];
const DEFAULT_PLATFORM_MANUAL_ORDER_PAGE_SIZE = 10;

const PLATFORM_MANUAL_ORDER_COLUMNS = [
  { label: "Order Number", key: "orderNumber" },
  { label: "Country", key: "buyer.country" },
  { label: "Receiver", key: "buyer.name" },
  { label: "Courier", key: "logistic.deliveryCompany" },
  { label: "Tracking Number", key: "logistic.trackingNumber" },
  { label: "Shipment Status", key: "shipmentStatus" },
  { label: "Created", key: "createdAt" },
];

const padDatePart = (value) => String(value).padStart(2, "0");
const todayInputValue = (date = new Date()) => `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
const currentTimeInputValue = (date = new Date()) => `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;

const valueOrDash = (...values) => {
  const value = values.find((item) => item !== null && item !== undefined && String(item).trim() !== "");
  return value === undefined ? "-" : value;
};

const firstText = (...values) => {
  const value = values.find((item) => item !== null && item !== undefined && String(item).trim() !== "");
  return value === undefined ? "" : String(value).trim();
};

const inferCountryFromText = (text = "") => {
  const normalized = String(text).toLowerCase();
  if (normalized.includes("malaysia")) return "Malaysia";
  if (normalized.includes("singapore")) return "Singapore";
  if (normalized.includes("thailand")) return "Thailand";
  if (normalized.includes("philippines")) return "Philippines";
  if (normalized.includes("indonesia")) return "Indonesia";
  if (normalized.includes("vietnam")) return "Vietnam";
  if (normalized.includes("china")) return "China";
  return "";
};

const getWarehouseSenderInfo = (warehouse = {}) => {
  const address = firstText(
    warehouse.location,
    warehouse.address,
    warehouse.full_address,
    warehouse.fullAddress,
    warehouse.address_line1,
    warehouse.address1,
    warehouse.street
  );
  return {
    name: firstText(warehouse.manager_name, warehouse.managerName, warehouse.manager, warehouse.contact_name, warehouse.name),
    company: firstText(warehouse.name, warehouse.code),
    phone: firstText(warehouse.phone, warehouse.phoneNumber, warehouse.phone_number, warehouse.contact_phone, warehouse.manager_phone),
    address,
    country: firstText(warehouse.country, warehouse.country_name, warehouse.countryName, warehouse.country_code, warehouse.countryCode) || inferCountryFromText(address),
    state: firstText(warehouse.state, warehouse.province, warehouse.region),
    city: firstText(warehouse.city),
    zipCode: firstText(warehouse.zipCode, warehouse.zip_code, warehouse.postcode, warehouse.postalCode, warehouse.postal_code),
  };
};

const formatPlatformManualOrderDate = (value, fallbackDate, fallbackTime, region) => {
  const rawValue = value || (fallbackDate ? `${fallbackDate}${fallbackTime ? `T${fallbackTime}` : ""}` : "");
  if (!rawValue) return "-";
  return formatPlatformDateTime(rawValue, region);
};

const parseJsonField = (value, fallback) => {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const resolveAssetUrl = (value) => {
  if (!value) return "";
  const url = String(value);
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  const baseUrl = String(api.defaults?.baseURL || "");
  let backendOrigin = baseUrl.replace(/\/api\/v\d+\/?$/i, "").replace(/\/$/, "");
  try {
    backendOrigin = new URL(baseUrl, window.location.origin).origin;
  } catch {
    // Keep the string fallback above.
  }
  return `${backendOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
};

const emptyForm = () => ({
  warehouseId: "",
  orderNumber: "",
  orderTime: currentTimeInputValue(),
  orderDate: todayInputValue(),
  waybillFileName: "",
  waybillFile: null,
  logistic: { trackingNumber: "", deliveryCompany: "" },
  sender: { name: "", company: "", phone: "", address: "", country: "", state: "", city: "", zipCode: "" },
  buyer: { name: "", phone: "", email: "", address: "", country: "", state: "", city: "", area: "", zipCode: "", unit: "" },
  products: [],
  package: { weight: "", length: "", width: "", height: "" },
});

const readJsonStorage = (key, fallback = {}) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
};

const getCurrentCompanyId = () => {
  const user = readJsonStorage("warehouseUser", {});
  return user.companyId || user.company_id || user.company?.id || "";
};

const normalizeWarehouseOption = (warehouse) => ({
  ...warehouse,
  value: String(warehouse.warehouseId || warehouse.id || warehouse.code || ""),
  label: `${warehouse.name || "Warehouse"}${warehouse.code ? ` (${warehouse.code})` : ""}`,
});

const mergeWarehouseRows = (...rowGroups) => {
  const rows = rowGroups.flat().filter(Boolean);
  const byKey = new Map();
  rows.forEach((warehouse) => {
    const normalized = normalizeWarehouseOption(warehouse);
    const keys = [
      normalized.value,
      normalized.id,
      normalized.warehouseId,
      normalized.code,
    ].filter((key) => key !== null && key !== undefined && String(key).trim() !== "");
    const mapKey = String(keys[0] || normalized.name || byKey.size);
    const existing = byKey.get(mapKey) || {};
    byKey.set(mapKey, { ...existing, ...normalized });
  });
  return Array.from(byKey.values());
};

const getWarehouseRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.warehouses)) return response.warehouses;
  return [];
};

const normalizeSkuOption = (sku) => {
  const skuType = sku.skuType || sku.sku_type || (sku.combineSkuId || sku.combine_sku_id ? "combine" : "merchant");
  const merchantSkuId = sku.merchantSkuId || sku.merchant_sku_id || (skuType === "merchant" ? String(sku.id || "").replace(/^merchant:/, "") : null);
  const combineSkuId = sku.combineSkuId || sku.combine_sku_id || (skuType === "combine" ? String(sku.id || "").replace(/^combine:/, "") : null);
  return {
    id: String(sku.id || `${skuType}:${merchantSkuId || combineSkuId || ""}`),
    merchantSkuId,
    combineSkuId,
    skuType,
    sku: sku.sku || "",
    name: sku.name || sku.sku || "",
    image: sku.image || "",
    availableForPlatform: Number(sku.availableForPlatform || 0),
    qty: 1,
    unitPrice: Number(sku.unitPrice || 0),
    weight: Number(sku.weight || 0),
  };
};

const normalizeOrderProduct = (product = {}) => {
  const skuType = product.skuType || product.sku_type || (product.combineSkuId || product.combine_sku_id ? "combine" : "merchant");
  const merchantSkuId = product.merchantSkuId || product.merchant_sku_id || null;
  const combineSkuId = product.combineSkuId || product.combine_sku_id || null;
  return {
    ...product,
    id: String(product.id || `${skuType}:${merchantSkuId || combineSkuId || product.sku || ""}`),
    merchantSkuId,
    combineSkuId,
    skuType,
    qty: Number(product.qty ?? product.quantity ?? 1) || 1,
    unitPrice: Number(product.unitPrice ?? product.unit_price ?? 0),
    weight: Number(product.weight || 0),
  };
};

const clampProductQty = (value, available) => {
  if (value === "") return "";
  const max = Math.max(0, Number(available) || 0);
  const next = Math.max(1, Number(value) || 1);
  return max > 0 ? Math.min(next, max) : 0;
};

const normalizeProductQtyForSave = (value, available) => {
  if (value === "") return 0;
  return clampProductQty(value, available);
};

const normalizePlatformManualOrder = (order = {}) => ({
  ...order,
  id: String(order.id || order.orderNumber || ""),
  warehouseId: String(order.warehouseId || order.warehouse_id || ""),
  logistic: parseJsonField(order.logistic, {}),
  sender: parseJsonField(order.sender, {}),
  buyer: parseJsonField(order.buyer, {}),
  package: parseJsonField(order.package, {}),
  products: (Array.isArray(order.products) ? order.products : parseJsonField(order.products, [])).map(normalizeOrderProduct),
  waybillUrl: resolveAssetUrl(order.waybillUrl || order.waybill_url || ""),
  waybillFileName: order.waybillFileName || order.waybill_file_name || "",
});

function useWaybillObjectUrl(url) {
  const [objectUrl, setObjectUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!url || /^(blob:|data:)/i.test(url)) {
      setObjectUrl(url || "");
      setError("");
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let nextObjectUrl = "";

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("whmAccessToken");
        const response = await fetch(url, {
          signal: controller.signal,
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) throw new Error(`Waybill preview failed (${response.status})`);
        const blob = await response.blob();
        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      } catch (err) {
        if (err.name !== "AbortError") {
          setObjectUrl(url);
          setError("Waybill preview loaded from original file.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();

    return () => {
      controller.abort();
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [url]);

  return { objectUrl, loading, error };
}

const buildPlatformManualOrderFormData = (payload, { includeLockedFields = true } = {}) => {
  const formData = new FormData();
  if (includeLockedFields) formData.append("warehouseId", payload.warehouseId);
  formData.append("orderNumber", payload.orderNumber);
  formData.append("orderTime", payload.orderTime);
  formData.append("orderDate", payload.orderDate);
  formData.append("logistic", JSON.stringify(payload.logistic || {}));
  if (includeLockedFields) formData.append("sender", JSON.stringify(payload.sender || {}));
  formData.append("buyer", JSON.stringify(payload.buyer || {}));
  if (includeLockedFields) {
    formData.append("products", JSON.stringify((payload.products || []).map((product) => {
      const isCombine = product.skuType === "combine" || product.combineSkuId;
      return {
        id: product.id,
        ...(isCombine
          ? { combineSkuId: product.combineSkuId || String(product.id).replace(/^combine:/, "") }
          : { merchantSkuId: product.merchantSkuId || String(product.id).replace(/^merchant:/, "") }),
        sku: product.sku,
        name: product.name,
        qty: normalizeProductQtyForSave(product.qty, product.availableForPlatform),
        unitPrice: Number(product.unitPrice || 0),
        weight: Number(product.weight || 0),
      };
    })));
  }
  formData.append("package", JSON.stringify(payload.package || {}));
  if (payload.waybillFile) formData.append("waybillFile", payload.waybillFile);
  return formData;
};

const platformManualOrderApi = {
  async list(params = {}) {
    const response = await api.get("/platform-manual-orders", { params });
    return {
      ...(response || {}),
      orders: Array.isArray(response?.orders) ? response.orders.map(normalizePlatformManualOrder) : [],
      total: Number(response?.total || 0),
    };
  },
  async create(payload) {
    return api.post("/platform-manual-orders", buildPlatformManualOrderFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  async update(id, payload) {
    return api.put(`/platform-manual-orders/${encodeURIComponent(id)}`, buildPlatformManualOrderFormData(payload, { includeLockedFields: false }), {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  async updateStatus(id, shipmentStatus) {
    return api.patch(`/platform-manual-orders/${encodeURIComponent(id)}/status`, { shipmentStatus });
  },
  async delete(id) {
    return api.delete(`/platform-manual-orders/${encodeURIComponent(id)}`);
  },
  async warehouses(companyId) {
    const [companyResult, fullResult] = await Promise.allSettled([
      api.get("/warehouses", { params: { companyId, limit: 100 } }),
      api.get("/warehouses", { params: { limit: 100 } }),
    ]);
    const companyRows = companyResult.status === "fulfilled" ? getWarehouseRows(companyResult.value) : [];
    const fullRows = fullResult.status === "fulfilled" ? getWarehouseRows(fullResult.value) : [];
    return mergeWarehouseRows(companyRows, fullRows);
  },
  async merchantSkus(warehouseId, { companyId, search } = {}) {
    if (!warehouseId) return [];
    const response = await api.get(`/warehouses/${encodeURIComponent(warehouseId)}/merchant-skus`, {
      params: { companyId, search: search || undefined },
    });
    return Array.isArray(response) ? response.map(normalizeSkuOption) : [];
  },
};

function ProductThumb({ image, swatch }) {
  if (image) {
    return <img src={image} alt="" className="h-8 w-8 rounded object-cover" />;
  }
  return (
    <div className={`h-8 w-8 overflow-hidden rounded bg-gradient-to-br ${swatch || "from-slate-200 to-slate-500"}`}>
      <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.75),transparent_24%),linear-gradient(135deg,transparent_45%,rgba(255,255,255,0.5)_46%,transparent_49%)]" />
    </div>
  );
}

function TextInput({ label, required, value, onChange, placeholder, type = "text", className = "", disabled = false }) {
  return (
    <label className={className}>
      {label && (
        <span className="mb-1.5 mt-2 block text-xs font-medium text-slate-700">
          {required && <span className="text-red-500">*</span>}
          {label}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-9 w-full rounded-lg border border-surface-border bg-white px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
      />
    </label>
  );
}

function SelectInput({ label, required, value, onChange, options, className = "", disabled = false }) {
  return (
    <label className={className}>
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-slate-700">
          {required && <span className="text-red-500">*</span>}
          {label}
        </span>
      )}
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-9 w-full appearance-none rounded-lg border border-surface-border bg-white px-3 pr-8 text-xs text-slate-700 outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
        >
          {options.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
      </span>
    </label>
  );
}

function ConfirmModal({ open, title, message, confirmLabel = "Confirm", danger = false, loading = false, loadingLabel, onCancel, onConfirm }) {
  return (
    <ConfirmActionModal
      open={open}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      danger={danger}
      loading={loading}
      loadingLabel={loadingLabel}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

function StatusMultiSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const label = value.includes("All") ? "All status" : value.join(", ");

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsidePress = (event) => {
      if (event.target instanceof Element && event.target.closest("[data-platform-status-filter]")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsidePress);
    return () => document.removeEventListener("mousedown", closeOnOutsidePress);
  }, [open]);

  const toggleStatus = (status) => {
    if (status === "All") {
      onChange(["All"]);
      return;
    }
    const withoutAll = value.filter((item) => item !== "All");
    const next = withoutAll.includes(status)
      ? withoutAll.filter((item) => item !== status)
      : [...withoutAll, status];
    onChange(next.length ? next : ["All"]);
  };

  return (
    <div className="relative col-span-12 md:col-span-3" data-platform-status-filter>
      <p className="mb-1.5 text-xs font-medium text-slate-700">Order Status</p>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-full items-center justify-between rounded-lg border border-surface-border bg-white px-3 text-left text-xs text-slate-600"
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={13} className="text-slate-300" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-surface-border bg-white p-2 shadow-lg">
          {STATUS_OPTIONS.map((status) => (
            <button
              type="button"
              key={status}
              onClick={() => toggleStatus(status)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-slate-700 hover:bg-surface-card"
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded border ${value.includes(status) ? "border-primary bg-primary text-white" : "border-slate-300"}`}>
                {value.includes(status) && <Check size={11} />}
              </span>
              {status === "All" ? "All status" : status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlatformManualOrderForm({ initialOrder, warehouses = [], companyId, onCancel, onSubmit, submitLabel = "Save", scrollContainerRef = null }) {
  const [form, setForm] = useState(() => initialOrder ? { ...emptyForm(), ...initialOrder } : emptyForm());
  const [productSearch, setProductSearch] = useState("");
  const [warehouseProducts, setWarehouseProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initialOrder?.id);
  const selectedWarehouse = useMemo(
    () => warehouses.find((warehouse) => String(warehouse.value) === String(form.warehouseId)),
    [warehouses, form.warehouseId]
  );

  useEffect(() => {
    if (form.warehouseId || !warehouses.length) return;
    setForm((current) => ({ ...current, warehouseId: warehouses[0].value }));
  }, [form.warehouseId, warehouses]);

  useEffect(() => {
    if (isEdit) return;
    if (!selectedWarehouse) return;
    const senderInfo = getWarehouseSenderInfo(selectedWarehouse);
    setForm((current) => ({
      ...current,
      sender: {
        ...current.sender,
        name: senderInfo.name,
        company: senderInfo.company,
        phone: senderInfo.phone,
        address: senderInfo.address,
        country: senderInfo.country,
        state: senderInfo.state,
        city: senderInfo.city,
        zipCode: senderInfo.zipCode,
      },
    }));
  }, [isEdit, selectedWarehouse]);

  const update = (path, value) => {
    setForm((current) => {
      const next = { ...current };
      const parts = path.split(".");
      let target = next;
      parts.slice(0, -1).forEach((part) => {
        target[part] = { ...target[part] };
        target = target[part];
      });
      target[parts.at(-1)] = value;
      return next;
    });
  };

  const loadWarehouseProducts = async () => {
    if (!form.warehouseId) {
      setWarehouseProducts([]);
      return;
    }
    setProductsLoading(true);
    try {
      const rows = await platformManualOrderApi.merchantSkus(form.warehouseId, {
        companyId,
        search: productSearch.trim(),
      });
      setWarehouseProducts(rows);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to load SKUs");
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouseProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.warehouseId, companyId]);

  const selectedProductIds = form.products.map((product) => product.id);

  const setProductSelected = (product, checked) => {
    setForm((current) => ({
      ...current,
      products: checked
        ? [...current.products, { ...product, qty: 1 }]
        : current.products.filter((item) => item.id !== product.id),
    }));
  };

  const updateProductQty = (id, qty) => {
    setForm((current) => ({
      ...current,
      products: current.products.map((product) => product.id === id
        ? { ...product, qty: clampProductQty(qty, product.availableForPlatform) }
        : product),
    }));
  };

  const validate = () => {
    const requiredValues = [
      ["Order Number", form.orderNumber],
      ["Upload Waybill", form.waybillFileName || (isEdit && form.waybillUrl)],
      ["Tracking Number", form.logistic.trackingNumber],
      ["Delivery Company", form.logistic.deliveryCompany],
      ...(!isEdit ? [
        ["Sender Name", form.sender.name],
        ["Company", form.sender.company],
        ["Sender Phone Number", form.sender.phone],
        ["Pickup Address", form.sender.address],
        ["Sender Country", form.sender.country],
        ["Sender State", form.sender.state],
        ["Sender City", form.sender.city],
        ["Sender Zip Code", form.sender.zipCode],
      ] : []),
      ["Buyer Name", form.buyer.name],
      ["Buyer Phone Number", form.buyer.phone],
      ["Buyer Email", form.buyer.email],
      ["Buyer Address", form.buyer.address],
      ["Buyer Country", form.buyer.country],
      ["Buyer State", form.buyer.state],
      ["Buyer City", form.buyer.city],
      ["Buyer Area", form.buyer.area],
      ["Buyer Zip Code", form.buyer.zipCode],
      ["Buyer Unit", form.buyer.unit],
    ];
    const missing = requiredValues.find(([, value]) => !String(value || "").trim());
    if (missing) {
      toast.error(`${missing[0]} is required`);
      return false;
    }
    if (!isEdit && !form.products.length) {
      toast.error("Please select at least one product first.");
      return false;
    }
    if (!isEdit && form.products.some((product) => normalizeProductQtyForSave(product.qty, product.availableForPlatform) < 1)) {
      toast.error("Product quantity must be at least 1.");
      return false;
    }
    return true;
  };

  const handleFile = (file) => {
    if (!file) return;
    const isPdfFile = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdfFile) {
      toast.error("Only PDF waybill files can be uploaded.");
      return;
    }
    setForm((current) => ({ ...current, waybillFileName: file.name, waybillFile: file }));
  };

  const handleSaveClick = () => {
    if (!validate()) return;
    if (isEdit && scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      window.setTimeout(() => setConfirmOpen(true), 180);
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-xl border border-surface-border bg-white p-5">
          <div className="grid grid-cols-12 gap-4">
            <SelectInput
              required
              label="Select Warehouse"
              value={form.warehouseId}
              onChange={(value) => setForm((current) => ({ ...current, warehouseId: value, products: [] }))}
              options={warehouses.length ? warehouses : [{ value: "", label: "No warehouse found" }]}
              disabled={isEdit}
              className="col-span-12 md:col-span-2"
            />
            <TextInput required label="Order Number" value={form.orderNumber} onChange={(value) => update("orderNumber", value)} placeholder="Order Number Here" className="col-span-12 md:col-span-2" />
            <TextInput label="Select Time" type="time" value={form.orderTime} onChange={(value) => update("orderTime", value)} className="col-span-6 md:col-span-2" />
            <TextInput label="Select Date" type="date" value={form.orderDate} onChange={(value) => update("orderDate", value)} className="col-span-6 md:col-span-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-surface-border bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-slate-800 font-display">Upload Waybill <span className="text-red-500">*</span></h2>
            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFile(event.dataTransfer.files?.[0]);
              }}
              className={`flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border px-6 text-center transition-colors ${form.waybillFileName ? "border-emerald-400 bg-emerald-50/40" : "border-blue-100 bg-white"}`}
            >
              <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
              <UploadCloud size={34} className={form.waybillFileName ? "mb-5 text-emerald-500" : "mb-5 text-blue-500"} />
              <p className="text-xl font-bold text-slate-800">
                {form.waybillFileName || "Choose a PDF file or drag & drop it here"}
              </p>
              <p className="mt-3 text-xs text-slate-400">PDF only, less than 10MB</p>
              <span className="mt-5 flex h-10 w-full max-w-lg items-center justify-center rounded-lg border border-blue-100 bg-white text-sm font-semibold text-slate-600">
                Browse File
              </span>
            </label>
          </section>

          <section className="rounded-xl border border-surface-border bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-slate-800 font-display">Logistic Information</h2>
            <div className="space-y-10 pt-5">
              <TextInput required label="Tracking Number" value={form.logistic.trackingNumber} onChange={(value) => update("logistic.trackingNumber", value)} placeholder="Tracking Number Here" />
              <TextInput classname="mt-2" required label="Delivery Company" value={form.logistic.deliveryCompany} onChange={(value) => update("logistic.deliveryCompany", value)} placeholder="Delivery company name here" />
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-surface-border bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-slate-800 font-display">Sender Information</h2>
          <div className="grid grid-cols-12 gap-4">
            <TextInput required label="Sender Name" value={form.sender.name} onChange={(value) => update("sender.name", value)} placeholder="Sender name here" disabled={isEdit} className="col-span-12 md:col-span-4" />
            <TextInput required label="Company" value={form.sender.company} onChange={(value) => update("sender.company", value)} placeholder="Company / warehouse name" disabled={isEdit} className="col-span-12 md:col-span-4" />
            <TextInput required label="Phone Number" value={form.sender.phone} onChange={(value) => update("sender.phone", value)} placeholder="Phone Number Here" disabled={isEdit} className="col-span-12 md:col-span-4" />
            <TextInput required label="Address" value={form.sender.address} onChange={(value) => update("sender.address", value)} placeholder="Address here" disabled={isEdit} className="col-span-12 md:col-span-6" />
            <TextInput required label="Country" value={form.sender.country} onChange={(value) => update("sender.country", value)} placeholder="Country Name here" disabled={isEdit} className="col-span-12 md:col-span-6" />
            <TextInput required label="State" value={form.sender.state} onChange={(value) => update("sender.state", value)} placeholder="State name here" disabled={isEdit} className="col-span-12 md:col-span-4" />
            <TextInput required label="City" value={form.sender.city} onChange={(value) => update("sender.city", value)} placeholder="City name here" disabled={isEdit} className="col-span-12 md:col-span-4" />
            <TextInput required label="Zip Code" value={form.sender.zipCode} onChange={(value) => update("sender.zipCode", value)} placeholder="Zip code here" disabled={isEdit} className="col-span-12 md:col-span-4" />
          </div>
        </section>

        <section className="rounded-xl border border-surface-border bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-slate-800 font-display">Buyer Information</h2>
          <div className="grid grid-cols-12 gap-4">
            <TextInput required label="Buyer Name" value={form.buyer.name} onChange={(value) => update("buyer.name", value)} placeholder="Buyer name here" className="col-span-12 md:col-span-4" />
            <TextInput required label="Phone Number" value={form.buyer.phone} onChange={(value) => update("buyer.phone", value)} placeholder="Phone Number Here" className="col-span-12 md:col-span-4" />
            <TextInput required label="Email" value={form.buyer.email} onChange={(value) => update("buyer.email", value)} placeholder="Email for label or notification" className="col-span-12 md:col-span-4" />
            <TextInput required label="Address" value={form.buyer.address} onChange={(value) => update("buyer.address", value)} placeholder="Buyer Address here" className="col-span-12 md:col-span-6" />
            <TextInput required label="Country" value={form.buyer.country} onChange={(value) => update("buyer.country", value)} placeholder="Country Name here" className="col-span-12 md:col-span-6" />
            <TextInput required label="State" value={form.buyer.state} onChange={(value) => update("buyer.state", value)} placeholder="State name here" className="col-span-12 md:col-span-3" />
            <TextInput required label="City" value={form.buyer.city} onChange={(value) => update("buyer.city", value)} placeholder="City name here" className="col-span-12 md:col-span-3" />
            <TextInput required label="Area" value={form.buyer.area} onChange={(value) => update("buyer.area", value)} placeholder="Area name here" className="col-span-12 md:col-span-3" />
            <TextInput required label="Zip Code" value={form.buyer.zipCode} onChange={(value) => update("buyer.zipCode", value)} placeholder="Zip code here" className="col-span-12 md:col-span-2" />
            <TextInput required label="Unit" value={form.buyer.unit} onChange={(value) => update("buyer.unit", value)} placeholder="Unit here" className="col-span-12 md:col-span-1" />
          </div>
        </section>

        <section className="rounded-xl border border-surface-border bg-white p-5">
          {!isEdit && (
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Merchant / Combine SKU"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  className="h-9 w-full rounded-lg border border-surface-border bg-white py-2 pl-9 pr-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary"
                />
              </div>
              <button type="button" onClick={loadWarehouseProducts} className="h-9 rounded-lg bg-primary px-10 text-sm font-semibold text-white">
                {productsLoading ? "Searching..." : "Search"}
              </button>
            </div>
          )}

          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="text-left text-sm font-bold text-slate-800">
                  {(isEdit ? ["Product Name", "SKU", "* Quantity", "Unit Price", "Weight", "Total"] : ["Select", "Image", "Product Name", "SKU", "Available", "* Quantity", "Unit Price", "Weight", "Total"]).map((heading) => (
                    <th key={heading} className="pb-3 pr-5">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isEdit ? (
                  form.products.map((product) => (
                    <tr key={product.id || product.sku} className="text-sm text-slate-700">
                      <td className="py-2 pr-5"><span className="block max-w-56 truncate">{product.name}</span></td>
                      <td className="py-2 pr-5 font-mono">{product.sku}</td>
                      <td className="py-2 pr-5">
                        <input
                          type="number"
                          value={product.qty || 1}
                          disabled
                          className="h-8 w-16 rounded-lg border border-surface-border bg-slate-50 text-center text-sm text-slate-500 outline-none"
                        />
                      </td>
                      <td className="py-2 pr-5">$ {product.unitPrice}</td>
                      <td className="py-2 pr-5">{product.weight} gm</td>
                      <td className="py-2 pr-5 font-semibold text-slate-800">$ {Number(product.qty || 0) * Number(product.unitPrice || 0)}</td>
                    </tr>
                  ))
                ) : (
                  <>
                    {productsLoading && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-xs text-slate-400">Loading SKUs...</td>
                      </tr>
                    )}
                    {!productsLoading && warehouseProducts.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-xs text-slate-400">No SKU found for this warehouse.</td>
                      </tr>
                    )}
                    {!productsLoading && warehouseProducts.map((product) => {
                      const selected = selectedProductIds.includes(product.id);
                      const orderProduct = form.products.find((item) => item.id === product.id) || product;
                      return (
                        <tr key={product.id} className="text-sm text-slate-700">
                          <td className="py-2 pr-5">
                            <input type="checkbox" checked={selected} onChange={(event) => setProductSelected(product, event.target.checked)} className="h-4 w-4 accent-primary" />
                          </td>
                          <td className="py-2 pr-5"><ProductThumb image={product.image} swatch={product.swatch} /></td>
                          <td className="py-2 pr-5"><span className="block max-w-56 truncate">{product.name}</span></td>
                          <td className="py-2 pr-5 font-mono">{product.sku}</td>
                          <td className="py-2 pr-5">{product.availableForPlatform}</td>
                          <td className="py-2 pr-5">
                            <input
                              type="number"
                              min="1"
                              max={Math.max(1, Number(product.availableForPlatform) || 1)}
                              disabled={!selected}
                              value={selected ? orderProduct.qty : 1}
                              onChange={(event) => updateProductQty(product.id, event.target.value)}
                              className="h-8 w-16 rounded-lg border border-surface-border bg-white text-center text-sm text-slate-600 outline-none disabled:bg-slate-50"
                            />
                          </td>
                          <td className="py-2 pr-5">$ {product.unitPrice}</td>
                          <td className="py-2 pr-5">{product.weight} gm</td>
                          <td className="py-2 pr-5 font-semibold text-slate-800">$ {Number(orderProduct.qty || 0) * Number(product.unitPrice || 0)}</td>
                        </tr>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-surface-border bg-white p-5">
          <div className="grid grid-cols-12 gap-4">
            <TextInput label="Package Weight" value={form.package.weight} onChange={(value) => update("package.weight", value)} placeholder="Package weight here" className="col-span-12 md:col-span-2" />
            <div className="col-span-12 md:col-span-4">
              <span className="mb-1.5 block text-xs font-medium text-slate-700">Package Size</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={form.package.length}
                  onChange={(event) => update("package.length", event.target.value)}
                  placeholder="Length"
                  className="h-9 w-full rounded-lg border border-surface-border bg-white px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary"
                />
                <input
                  type="text"
                  value={form.package.width}
                  onChange={(event) => update("package.width", event.target.value)}
                  placeholder="Width"
                  className="h-9 w-full rounded-lg border border-surface-border bg-white px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary"
                />
                <input
                  type="text"
                  value={form.package.height}
                  onChange={(event) => update("package.height", event.target.value)}
                  placeholder="Height"
                  className="h-9 w-full rounded-lg border border-surface-border bg-white px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-5 pb-2">
          <button type="button" onClick={onCancel} disabled={submitting} className="h-10 min-w-40 rounded-lg border border-surface-border bg-white px-8 text-sm font-semibold text-slate-700 hover:bg-surface-card disabled:cursor-not-allowed disabled:opacity-60">
            Cancel
          </button>
          <button type="button" onClick={handleSaveClick} disabled={submitting} className="h-10 min-w-40 rounded-lg bg-primary px-8 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? (isEdit ? "Updating..." : "Saving...") : submitLabel}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={isEdit ? "Confirm Update" : "Confirm Save"}
        message={isEdit ? "Confirm update this platform manual order?" : "Confirm save this platform manual order?"}
        confirmLabel={isEdit ? "Update" : "Save"}
        loading={submitting}
        loadingLabel={isEdit ? "Updating..." : "Saving..."}
        onCancel={() => {
          if (!submitting) setConfirmOpen(false);
        }}
        onConfirm={async () => {
          setSubmitting(true);
          try {
            await onSubmit(form);
            setConfirmOpen(false);
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </>
  );
}

function EditOrderModal({ order, warehouses, companyId, onClose, onSubmit }) {
  const scrollContainerRef = useRef(null);
  if (!order) return null;
  return (
    <div ref={scrollContainerRef} className="fixed inset-0 z-[10000] overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-6xl rounded-2xl bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 font-display">Edit Platform Manual Order</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
        <PlatformManualOrderForm initialOrder={order} warehouses={warehouses} companyId={companyId} onCancel={onClose} onSubmit={onSubmit} submitLabel="Update" scrollContainerRef={scrollContainerRef} />
      </div>
    </div>
  );
}

function PlatformManualOrderDetailModal({ order, onClose }) {
  const [waybillOpen, setWaybillOpen] = useState(false);
  const waybillUrl = order?.waybillUrl || "";
  const waybillPreview = useWaybillObjectUrl(waybillUrl);
  if (!order) return null;
  const buyer = order.buyer || {};
  const sender = order.sender || {};
  const logistic = order.logistic || {};
  const packageInfo = order.package || {};
  const orderRegion = resolvePlatformRegion(buyer.country, order.buyerCountry, sender.country, order.country);
  const infoRows = [
    ["Order Number", order.orderNumber],
    ["Shipment Status", order.shipmentStatus],
    ["Order Date", order.orderDate],
    ["Order Time", order.orderTime],
    ["Created", formatPlatformManualOrderDate(order.createdAt, order.orderDate, order.orderTime, orderRegion)],
    ["Warehouse ID", order.warehouseId],
    ["Tracking Number", logistic.trackingNumber],
    ["Delivery Company", logistic.deliveryCompany],
    ["Waybill File", order.waybillFileName],
  ];

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-surface-border px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 font-display">Platform Manual Order Details</h3>
            <p className="mt-1 text-xs text-slate-500">{order.orderNumber}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[76vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <section className="rounded-xl border border-surface-border bg-slate-50/60 p-4">
                <h4 className="mb-3 text-sm font-bold text-slate-800">Order Information</h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {infoRows.map(([label, value]) => (
                    <DetailInfo key={label} label={label} value={value} />
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <DetailSection title="Receiver Information" rows={[
                  ["Name", buyer.name],
                  ["Phone", buyer.phone],
                  ["Email", buyer.email],
                  ["Country", buyer.country],
                  ["State", buyer.state],
                  ["City", buyer.city],
                  ["Area", buyer.area],
                  ["Zip Code", buyer.zipCode],
                  ["Unit", buyer.unit],
                  ["Address", buyer.address],
                ]} />
                <DetailSection title="Sender Information" rows={[
                  ["Name", sender.name],
                  ["Company", sender.company],
                  ["Phone", sender.phone],
                  ["Country", sender.country],
                  ["State", sender.state],
                  ["City", sender.city],
                  ["Zip Code", sender.zipCode],
                  ["Address", sender.address],
                ]} />
              </div>

              <section className="rounded-xl border border-surface-border bg-white p-4">
                <h4 className="mb-3 text-sm font-bold text-slate-800">Products</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-border text-left text-xs font-bold text-slate-700">
                        {["SKU", "Product Name", "Qty", "Unit Price", "Weight", "Total"].map((heading) => (
                          <th key={heading} className="pb-2 pr-4">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {(order.products || []).map((product) => (
                        <tr key={`${product.id}-${product.sku}`}>
                          <td className="py-2 pr-4 font-mono text-xs text-slate-700">{product.sku || "-"}</td>
                          <td className="py-2 pr-4 text-xs text-slate-700">{product.name || "-"}</td>
                          <td className="py-2 pr-4 text-xs text-slate-600">{product.qty || product.quantity || 1}</td>
                          <td className="py-2 pr-4 text-xs text-slate-600">$ {Number(product.unitPrice || 0)}</td>
                          <td className="py-2 pr-4 text-xs text-slate-600">{Number(product.weight || 0)} gm</td>
                          <td className="py-2 pr-4 text-xs font-semibold text-slate-800">$ {Number(product.unitPrice || 0) * Number(product.qty || product.quantity || 1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-xl border border-surface-border bg-white p-4">
                <h4 className="mb-3 text-sm font-bold text-slate-800">Waybill</h4>
                {waybillUrl ? (
                  waybillPreview.loading ? (
                    <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-surface-border bg-slate-50 text-xs font-semibold text-slate-400">
                      Loading waybill preview...
                    </div>
                  ) : waybillPreview.objectUrl ? (
                    <iframe
                      src={waybillPreview.objectUrl}
                      title="Platform Manual Waybill PDF"
                      className="h-[420px] w-full rounded-xl border border-surface-border bg-slate-50"
                    />
                  ) : (
                    <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-surface-border bg-slate-50 px-4 text-center text-xs font-semibold text-slate-400">
                      {waybillPreview.error || "Waybill preview unavailable"}
                    </div>
                  )
                ) : (
                  <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-surface-border bg-slate-50 text-xs text-slate-400">
                    No waybill file
                  </div>
                )}
                {waybillUrl && (
                  <button
                    type="button"
                    onClick={() => setWaybillOpen(true)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                  >
                    <Printer size={15} />
                    Open Waybill
                  </button>
                )}
              </section>
              <DetailSection title="Package Information" rows={[
                ["Weight", packageInfo.weight],
                ["Length", packageInfo.length],
                ["Width", packageInfo.width],
                ["Height", packageInfo.height],
              ]} />
            </div>
          </div>
        </div>
      </div>
      <PlatformWaybillPreviewModal
        open={waybillOpen}
        url={waybillUrl}
        previewUrl={waybillPreview.objectUrl}
        filename={order.waybillFileName || "platform-waybill"}
        onClose={() => setWaybillOpen(false)}
      />
    </div>
  );
}

function PlatformWaybillPreviewModal({ open, url, previewUrl = "", filename, onClose }) {
  if (!open) return null;
  const isPdf = /\.pdf($|\?)/i.test(url);
  const displayUrl = previewUrl || url;

  const handlePrint = () => {
    if (!displayUrl) return;
    if (isPdf) {
      const printWindow = window.open(displayUrl, "_blank", "noopener,noreferrer");
      if (printWindow) setTimeout(() => printWindow.print?.(), 800);
      return;
    }

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=900");
    if (!printWindow) return;
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${filename || "Waybill"}</title>
          <style>
            body { margin: 0; padding: 24px; font-family: Arial, sans-serif; background: #fff; }
            img { display: block; max-width: 100%; max-height: 95vh; margin: 0 auto; object-fit: contain; }
            @media print { body { padding: 0; } img { max-height: 100vh; } }
          </style>
        </head>
        <body>
          <img src="${displayUrl}" alt="${filename || "Waybill"}" onload="window.focus(); window.print();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 px-4 py-6 font-body">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-surface-border px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">Platform Manual Waybill</h3>
            <p className="mt-1 text-xs text-slate-500">{filename}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X size={17} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex h-[68vh] min-h-[520px] items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-slate-50 shadow-sm">
            {isPdf ? (
              <iframe src={displayUrl} title="Platform Manual Waybill PDF" className="h-full w-full" />
            ) : displayUrl ? (
              <img src={displayUrl} alt={filename || "Waybill"} className="h-full w-full object-contain" />
            ) : (
              <div className="px-6 text-center text-sm font-semibold text-slate-500">Waybill preview unavailable. Open original may still work.</div>
            )}
          </div>

          <div className="rounded-xl border border-surface-border p-4">
            <p className="text-sm font-bold text-slate-800">Waybill Actions</p>
            <p className="mt-1 text-xs text-slate-500">Print or open the uploaded platform manual waybill PDF.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                <Printer size={15} />
                Print
              </button>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-card"
              >
                Open Original
              </a>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-surface-border px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-surface-border px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-card">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, rows }) {
  return (
    <section className="rounded-xl border border-surface-border bg-white p-4">
      <h4 className="mb-3 text-sm font-bold text-slate-800">{title}</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <DetailInfo key={label} label={label} value={value} full={label === "Address"} />
        ))}
      </div>
    </section>
  );
}

function DetailInfo({ label, value, full = false }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-[11px] font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-800">{valueOrDash(value)}</p>
    </div>
  );
}

function PlatformManualOrderList({ orders, loading, error, warehouses, companyId, onCreate, onReload, onQueryChange, onFetchAll }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedOrderRows, setSelectedOrderRows] = useState([]);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PLATFORM_MANUAL_ORDER_PAGE_SIZE);
  const [pageSizeInput, setPageSizeInput] = useState(String(DEFAULT_PLATFORM_MANUAL_ORDER_PAGE_SIZE));
  const [statusFilters, setStatusFilters] = useState(["All"]);
  const [searchType, setSearchType] = useState("Single Search");
  const [searchField, setSearchField] = useState("SKU");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState({ type: "Single Search", field: "SKU", values: [] });
  const [actionOpenId, setActionOpenId] = useState("");
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [statusOrder, setStatusOrder] = useState(null);
  const [nextStatus, setNextStatus] = useState("Processed");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredOrders = useMemo(() => {
    const activeStatuses = statusFilters.includes("All") ? STATUS_OPTIONS.filter((status) => status !== "All") : statusFilters;
    const searchValues = appliedSearch.values.map((value) => value.toLowerCase());
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter((order) => activeStatuses.includes(order.shipmentStatus))
      .filter((order) => {
        if (!searchValues.length) return true;
        if (appliedSearch.field === "Order Number") {
          return searchValues.some((value) => String(order.orderNumber || "").toLowerCase().includes(value));
        }
        return order.products?.some((product) => searchValues.some((value) => String(product.sku || "").toLowerCase().includes(value)));
      });
  }, [appliedSearch, orders, statusFilters]);

  const selectedOrders = useMemo(() => {
    const cachedRowsMatchSelection =
      selectedOrderRows.length === selectedIds.length &&
      selectedIds.every((id) => selectedOrderRows.some((order) => order.id === id));

    if (cachedRowsMatchSelection) return selectedOrderRows;
    return filteredOrders.filter((order) => selectedIds.includes(order.id));
  }, [filteredOrders, selectedIds, selectedOrderRows]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const effectivePage = Math.min(page, totalPages);
  const paginatedOrders = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [effectivePage, filteredOrders, pageSize]);

  useEffect(() => {
    setSelectedOrderRows((current) => current.filter((order) => selectedIds.includes(order.id)));
  }, [selectedIds]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!actionOpenId) return undefined;
    const closeOnOutsidePress = (event) => {
      if (event.target instanceof Element && event.target.closest("[data-platform-row-actions]")) return;
      setActionOpenId("");
    };
    document.addEventListener("mousedown", closeOnOutsidePress);
    return () => document.removeEventListener("mousedown", closeOnOutsidePress);
  }, [actionOpenId]);

  const applySearch = () => {
    const values = searchType === "Batch Search"
      ? searchInput.split(/\n|,|\s+/).map((item) => item.trim()).filter(Boolean)
      : [searchInput.trim()].filter(Boolean);
    setAppliedSearch({ type: searchType, field: searchField, values });
    setPage(1);
    setSelectedIds([]);
    setSelectedOrderRows([]);
    onQueryChange({
      statuses: statusFilters.includes("All") ? [] : statusFilters,
      searchType,
      searchField,
      searchValues: values,
    });
  };

  const toggleAll = async () => {
    setSelectionLoading(true);
    try {
      const sourceRows = await onFetchAll?.({
        statuses: statusFilters.includes("All") ? [] : statusFilters,
        searchType: appliedSearch.type,
        searchField: appliedSearch.field,
        searchValues: appliedSearch.values,
      }) || filteredOrders;

      setSelectedIds((current) => {
        const shouldClear = sourceRows.length && sourceRows.every((order) => current.includes(order.id));
        setSelectedOrderRows(shouldClear ? [] : sourceRows);
        return shouldClear ? [] : sourceRows.map((order) => order.id);
      });
    } finally {
      setSelectionLoading(false);
    }
  };

  const toggleOne = (id) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        setSelectedOrderRows((rows) => rows.filter((order) => order.id !== id));
        return current.filter((item) => item !== id);
      }

      const selectedOrder = filteredOrders.find((order) => order.id === id);
      if (selectedOrder) {
        setSelectedOrderRows((rows) => rows.some((order) => order.id === id) ? rows : [...rows, selectedOrder]);
      }
      return [...current, id];
    });
  };

  const handlePageSizeSearch = () => {
    const nextPageSize = Math.max(1, Number.parseInt(pageSizeInput, 10) || DEFAULT_PLATFORM_MANUAL_ORDER_PAGE_SIZE);
    setPageSize(nextPageSize);
    setPageSizeInput(String(nextPageSize));
    setPage(1);
  };

  return (
    <div className="space-y-6 font-body">
      <Topbar PageTitle="Platform Manual Order" />

      <div className="rounded-xl border border-surface-border bg-white p-4">
        <div className="grid grid-cols-12 items-end gap-3">
          <StatusMultiSelect
            value={statusFilters}
            onChange={(value) => {
              setStatusFilters(value);
                setSelectedIds([]);
                setSelectedOrderRows([]);
                setPage(1);
                onQueryChange({
                statuses: value.includes("All") ? [] : value,
                searchType: appliedSearch.type,
                searchField: appliedSearch.field,
                searchValues: appliedSearch.values,
              });
            }}
          />
          <SelectInput label="Select Search Type" value={searchType} onChange={(value) => { setSearchType(value); setSearchInput(""); }} options={SEARCH_TYPES} className="col-span-12 md:col-span-2" />
          <SelectInput label="Search Field" value={searchField} onChange={setSearchField} options={SEARCH_FIELDS} className="col-span-12 md:col-span-2" />
          <label className="col-span-12 md:col-span-4">
            <span className="mb-1.5 block text-xs font-medium text-transparent">Search</span>
            <span className="flex items-center gap-2 rounded-lg border border-surface-border bg-white px-3 text-xs text-slate-500 focus-within:border-primary">
              <Search size={15} className="text-slate-400" />
              {searchType === "Batch Search" ? (
                <textarea
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={`Enter multiple ${searchField}`}
                  className="min-h-20 flex-1 resize-y bg-transparent py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400"
                />
              ) : (
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={`Search ${searchField}`}
                  className="h-9 min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                />
              )}
            </span>
          </label>
          <button onClick={applySearch} className="col-span-12 h-9 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark md:col-span-1">
            Search
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-surface-border bg-white">
        <div className="flex flex-col gap-4 px-5 pb-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-slate-800 font-display">Create Manual Orders</h2>
          <button type="button" onClick={onCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark">
            <Plus size={15} />
            Create Manual Order by Label
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm font-body">
            <thead>
              <tr className="border-b border-surface-border bg-white text-left text-sm font-bold text-slate-800">
                <th className="py-3 pl-5 pr-4">
                  {selectionLoading ? (
                    <Loader2 size={16} className="text-primary animate-spin" />
                  ) : (
                    <input type="checkbox" checked={filteredOrders.length > 0 && filteredOrders.every((order) => selectedIds.includes(order.id))} onChange={toggleAll} className="h-4 w-4 accent-primary" />
                  )}
                </th>
                {["Order Number", "Country", "Receiver", "Courier", "Tracking Number", "Shipment Status", "Created", "Details", "Action"].map((heading) => (
                  <th key={heading} className="py-3 pr-4">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <PlatformManualOrderTableSkeleton />
              ) : error ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <AlertCircle size={36} className="text-red-400 opacity-70" />
                      <p className="text-sm font-medium text-slate-700">{error}</p>
                      <button
                        type="button"
                        onClick={onReload}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <RefreshCw size={12} /> Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <p className="text-xs text-slate-400">No Created Platform Manual order found for now</p>
                      <button
                        type="button"
                        onClick={onReload}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <RefreshCw size={12} /> Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paginatedOrders.map((order) => {
                const country = valueOrDash(order.buyer?.country, order.buyerCountry, order.country);
                const orderRegion = resolvePlatformRegion(order.buyer?.country, order.buyerCountry, order.sender?.country, order.country);
                const receiver = valueOrDash(order.buyer?.name, order.buyerName, order.receiverName, order.receiver);
                const courier = valueOrDash(order.logistic?.deliveryCompany, order.deliveryCompany, order.logisticCompany, order.courier);
                const trackingNumber = valueOrDash(order.logistic?.trackingNumber, order.trackingNumber, order.awbNumber, order.awb, order.waybillNumber);
                const createdAt = formatPlatformManualOrderDate(order.createdAt, order.orderDate, order.orderTime, orderRegion);
                return (
                  <tr key={order.id} className="hover:bg-surface/50">
                    <td className="py-3 pl-5 pr-4">
                      <input type="checkbox" checked={selectedIds.includes(order.id)} onChange={() => toggleOne(order.id)} className="h-4 w-4 accent-primary" />
                    </td>
                    <td className="py-3 pr-4 font-mono text-sm text-primary-text">{order.orderNumber || "-"}</td>
                    <td className="py-3 pr-4 text-sm text-slate-600">{country}</td>
                    <td className="py-3 pr-4 text-sm text-slate-700">
                      <span className="block max-w-36 truncate font-medium" title={receiver}>{receiver}</span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-600">{courier}</td>
                    <td className="py-3 pr-4 font-mono text-sm text-slate-500">{trackingNumber}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        {order.shipmentStatus || "-"}
                        <button
                          type="button"
                          onClick={() => {
                            setStatusOrder(order);
                            setNextStatus(order.shipmentStatus || "Processed");
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-surface-card hover:text-primary"
                          title="Edit status"
                        >
                          <Pencil size={12} />
                        </button>
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-500">{createdAt}</td>
                    <td className="py-3 pr-4">
                      <button type="button" onClick={() => setDetailOrder(order)} className="text-sm font-semibold text-[#004368] transition-colors hover:underline">
                        Details
                      </button>
                    </td>
                    <td className="relative py-3 pr-5">
                      <div data-platform-row-actions>
                        <button
                          type="button"
                          onClick={() => setActionOpenId((current) => (current === order.id ? "" : order.id))}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border text-slate-600 transition-colors hover:bg-surface-card"
                          title="Actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {actionOpenId === order.id && (
                          <div className="absolute bottom-10 right-5 z-30 min-w-32 overflow-hidden rounded-lg border border-surface-border bg-white py-1 shadow-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setActionOpenId("");
                                setEditOrder(order);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-surface-card"
                            >
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActionOpenId("");
                                setDeleteOrder(order);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <PageSizePagination
          page={effectivePage}
          limit={pageSize}
          total={filteredOrders.length}
          onPageChange={setPage}
          pageSizeInput={pageSizeInput}
          onPageSizeInputChange={setPageSizeInput}
          onApplyPageSize={handlePageSizeSearch}
          loading={loading}
        />

        <OrderFooter selectedRows={selectedOrders} columns={PLATFORM_MANUAL_ORDER_COLUMNS} title="Platform Manual Orders" />
      </div>

      <EditOrderModal
        order={editOrder}
        warehouses={warehouses}
        companyId={companyId}
        onClose={() => setEditOrder(null)}
        onSubmit={async (payload) => {
          try {
            await platformManualOrderApi.update(editOrder.id, payload);
            toast.success("Platform manual order updated");
            setEditOrder(null);
            onReload();
          } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to update platform manual order");
            throw err;
          }
        }}
      />

      <PlatformManualOrderDetailModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
      />

      <ConfirmModal
        open={Boolean(deleteOrder)}
        danger
        title="Delete Platform Manual Order"
        message={(
          <p>
            <span>Delete order</span> <span>{deleteOrder?.orderNumber || ""}</span>?
          </p>
        )}
        confirmLabel="Delete"
        loading={deleteLoading}
        loadingLabel="Deleting..."
        onCancel={() => {
          if (!deleteLoading) setDeleteOrder(null);
        }}
        onConfirm={async () => {
          setDeleteLoading(true);
          try {
            await platformManualOrderApi.delete(deleteOrder.id);
            toast.success("Platform manual order deleted");
            setDeleteOrder(null);
            setSelectedIds([]);
            setSelectedOrderRows([]);
            onReload();
          } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to delete platform manual order");
          } finally {
            setDeleteLoading(false);
          }
        }}
      />

      <ConfirmModal
        open={Boolean(statusOrder)}
        title="Update Shipment Status"
        message={(
          <div className="space-y-3">
            <p>
              <span>Choose new shipment status for</span> <span>{statusOrder?.orderNumber}</span>.
            </p>
            <SelectInput value={nextStatus} onChange={setNextStatus} options={STATUS_OPTIONS.filter((status) => status !== "All")} />
          </div>
        )}
        confirmLabel="Update"
        loading={statusUpdating}
        loadingLabel="Updating..."
        onCancel={() => {
          if (!statusUpdating) setStatusOrder(null);
        }}
        onConfirm={async () => {
          setStatusUpdating(true);
          try {
            await platformManualOrderApi.updateStatus(statusOrder.id, nextStatus);
            toast.success("Shipment status updated");
            setStatusOrder(null);
            onReload();
          } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to update shipment status");
          } finally {
            setStatusUpdating(false);
          }
        }}
      />
    </div>
  );
}

function PlatformManualOrderTableSkeleton() {
  return Array.from({ length: 6 }).map((_, index) => (
    <tr key={index} className="animate-pulse">
      <td className="py-3 pl-5 pr-4">
        <div className="h-4 w-4 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-32 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-16 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-28 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-24 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-28 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-24 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-4">
        <div className="h-4 w-28 rounded bg-slate-200" />
      </td>
      <td className="py-3 pr-5">
        <div className="h-7 w-7 rounded-lg bg-slate-200" />
      </td>
      <td className="py-3 pr-5">
        <div className="h-4 w-24 rounded bg-slate-200" />
      </td>
    </tr>
  ));
}

function CreatePlatformManualOrder({ warehouses, companyId, onBack, onCreated }) {
  return (
    <div className="space-y-6 font-body">
      <Topbar PageTitle="Back to Platform Manual Order" showBack onBack={onBack} />
      <PlatformManualOrderForm
        warehouses={warehouses}
        companyId={companyId}
        onCancel={onBack}
        onSubmit={async (payload) => {
          try {
            await platformManualOrderApi.create(payload);
            toast.success("Platform manual order saved");
            onCreated();
          } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to save platform manual order");
            throw err;
          }
        }}
      />
    </div>
  );
}

export default function PlatformManualOrderPage() {
  const [orders, setOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [queryParams, setQueryParams] = useState({
    statuses: [],
    searchType: "Single Search",
    searchField: "SKU",
    searchValues: [],
  });
  const companyId = getCurrentCompanyId();

  const loadWarehouses = async () => {
    if (!companyId) return;
    try {
      const rows = await platformManualOrderApi.warehouses(companyId);
      setWarehouses(filterWarehousesByPermission(rows));
    } catch {
      setWarehouses([]);
    }
  };

  const loadOrders = async (params = queryParams) => {
    if (!companyId) {
      setOrders([]);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const response = await platformManualOrderApi.list({
        companyId,
        statuses: params.statuses?.length ? params.statuses : undefined,
        searchType: params.searchValues?.length ? params.searchType : undefined,
        searchField: params.searchValues?.length ? params.searchField : undefined,
        searchValues: params.searchValues?.length ? params.searchValues : undefined,
        page: 1,
        limit: 200,
      });
      setOrders(response.orders || []);
    } catch (err) {
      setOrders([]);
      setLoadError(err?.response?.data?.message || err?.message || "Failed to load platform manual orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOrders = async (params = queryParams) => {
    if (!companyId) return [];
    const response = await platformManualOrderApi.list({
      companyId,
      statuses: params.statuses?.length ? params.statuses : undefined,
      searchType: params.searchValues?.length ? params.searchType : undefined,
      searchField: params.searchValues?.length ? params.searchField : undefined,
      searchValues: params.searchValues?.length ? params.searchValues : undefined,
      page: 1,
      limit: 1000,
    });
    return response.orders || [];
  };

  const handleQueryChange = (nextParams) => {
    setQueryParams(nextParams);
    loadOrders(nextParams);
  };

  useEffect(() => {
    loadWarehouses();
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (showCreate) {
    return (
      <ManualOrderSubscriptionGate>
        <CreatePlatformManualOrder
          warehouses={warehouses}
          companyId={companyId}
          onBack={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadOrders();
          }}
        />
      </ManualOrderSubscriptionGate>
    );
  }

  return (
    <ManualOrderSubscriptionGate>
      <PlatformManualOrderList
        orders={orders}
        loading={loading}
        error={loadError}
        warehouses={warehouses}
        companyId={companyId}
        onCreate={() => setShowCreate(true)}
        onReload={() => loadOrders()}
        onQueryChange={handleQueryChange}
        onFetchAll={fetchAllOrders}
      />
    </ManualOrderSubscriptionGate>
  );
}
