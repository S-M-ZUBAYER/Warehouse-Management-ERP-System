import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Topbar from "../../../../components/layout/Topbar";
import OrderFilterBar from "../../shared/components/OrderFilterBar";
import OrderFooter from "../../shared/components/OrderFooter";
import OrderDateRangePicker, { getDateRangeLabel, getPresetRange } from "../../shared/components/OrderDateRangePicker";
import PortalActionMenu from "../../../../components/shared/PortalActionMenu";
import api from "../../../../lib/api";
import { translateStaticText } from "../../../../i18nDomTranslator";
import { filterWarehousesByPermission } from "../../../../utils/permissions";
import { formatPlatformDateTime, resolvePlatformRegion } from "../../shared/utils/platformDateTime";
import shopeeLogo from "../../../../assets/ShopPlatform/shopee.svg";
import tiktokLogo from "../../../../assets/ShopPlatform/tiktok.svg";

const tr = (text) => translateStaticText(text);

const PLATFORM_OPTIONS = ["All Platforms", "Shopee", "TikTok", "Manual"];
const SEARCH_TYPES = ["Single Search", "Batch Search"];
const SKU_TYPES = ["SKU", "Order Number", "Tracking Number", "Return ID", "Return Status", "Platform Status"];

const RETURN_STATUS_OPTIONS = [
  { value: "need_to_check", label: "Need To Check" },
  { value: "defect_found", label: "Defect Found" },
  { value: "pending_inspection", label: "Pending Inspection" },
  { value: "resalable_item", label: "Resalable Item" },
];

const RETURN_TYPE_OPTIONS = [
  { value: "by_logistic", label: "By Logistic" },
  { value: "by_buyer_use_logistic", label: "By Buyer Use Logistic" },
  { value: "by_buyer_direct_give", label: "By Buyer Direct Give" },
  { value: "without_logistic", label: "Without Logistic" },
];

const TRACKING_REQUIRED_TYPES = new Set(["by_logistic", "by_buyer_use_logistic"]);
const RETURN_TYPE_VALUES = new Set(RETURN_TYPE_OPTIONS.map((option) => option.value));
const RETURN_DATE_MAX_LOOKBACK_DAYS = 183;

const normalizeEditableReturnType = (value) => {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const aliases = {
    by_logistic: "by_logistic",
    by_buyer_use_logistic: "by_buyer_use_logistic",
    by_buyer: "by_buyer_use_logistic",
    by_buyer_direct_give: "by_buyer_direct_give",
    buyer_direct: "by_buyer_direct_give",
    without_logistic: "without_logistic",
    no_logistic: "without_logistic",
  };
  const normalized = aliases[key] || key;
  return RETURN_TYPE_VALUES.has(normalized) ? normalized : "by_logistic";
};

const RETURN_ORDER_COLUMNS = [
  { label: "Platform", key: "platformLabel" },
  { label: "Store", key: "storeName" },
  { label: "Created Time", key: "createdAt" },
  { label: "Updated Time", key: "updatedAt" },
  { label: "SKU", key: "sku" },
  { label: "Order Number", key: "orderNumber" },
  { label: "Tracking Number", key: "trackingNo" },
  { label: "Return Status", key: "returnStatusLabel" },
  { label: "Platform Status", key: "platformStatusLabel" },
];

const INPUT_CLASS =
  "w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10";
const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50";
const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-surface-border bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-card";

const unwrapResponseData = (response) => response?.data?.data || response?.data || response;
const getRows = (response) => {
  const payload = unwrapResponseData(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.returnOrders)) return payload.returnOrders;
  return [];
};
const getResponseData = (response) => unwrapResponseData(response);

const getSavedReturnOrder = (response) => {
  const payload = getResponseData(response);
  return (
    payload?.order ||
    payload?.returnOrder ||
    payload?.manualReturnOrder ||
    payload?.manualOrder ||
    payload?.item ||
    payload
  );
};

const getPagination = (response, fallback = {}) => ({
  total: response?.pagination?.total ?? fallback.total ?? 0,
  page: response?.pagination?.page ?? fallback.page ?? 1,
  limit: response?.pagination?.limit ?? fallback.limit ?? 20,
  totalPages: response?.pagination?.totalPages ?? fallback.totalPages ?? 1,
});

const getReturnSyncStatus = () =>
  api.get("/return-orders/sync/status", {
    params: { _t: Date.now() },
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

const getSyncPayload = (response) => response?.data || response || {};

const isRelevantSyncRunning = (response, scope) => {
  const status = getSyncPayload(response);
  if (!status.running) return false;
  const platforms = Array.isArray(scope?.platforms) ? scope.platforms : [];
  if (!platforms.length) return true;
  const jobs = Array.isArray(status.jobs) ? status.jobs : [];
  if (!jobs.length && status.platform) return platforms.includes(status.platform);
  return jobs.some((job) => platforms.includes(job.platform));
};

const platformParam = (label) => {
  if (label === "Shopee") return "shopee";
  if (label === "TikTok") return "tiktok";
  if (label === "Manual") return "manual";
  return "all";
};

const getStatusLabel = (value) =>
  RETURN_STATUS_OPTIONS.find((option) => option.value === value)?.label || value || "";

const getReturnTypeLabel = (value) =>
  RETURN_TYPE_OPTIONS.find((option) => option.value === value)?.label || value || "";

const normalizeWarehouse = (warehouse) => ({
  id: String(warehouse.id ?? warehouse.warehouseId ?? warehouse.warehouse_id ?? ""),
  name: warehouse.name || warehouse.warehouseName || warehouse.code || "Warehouse",
  code: warehouse.code || warehouse.warehouse_code || "",
});

const toNumberOrNull = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const getDaysUntil = (value) => {
  if (!value) return null;
  const expiryTime = new Date(value).getTime();
  if (!Number.isFinite(expiryTime)) return null;
  return Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000));
};

const getStoreSubscriptionSnapshot = (store = {}) => {
  const subscription = store.subscription || {};
  return {
    status: subscription.status ?? store.subscriptionStatus ?? store.subscription_status,
    remainingDays: subscription.remainingDays ?? subscription.remaining_days ?? store.remainingDays ?? store.remaining_days,
    expiresAt: subscription.expiresAt ?? subscription.expires_at ?? store.expiresAt ?? store.expires_at,
  };
};

const hasUsableStoreSubscription = (store = {}) => {
  const subscription = getStoreSubscriptionSnapshot(store);
  const hasSubscriptionInfo =
    subscription.status !== undefined ||
    subscription.remainingDays !== undefined ||
    subscription.expiresAt !== undefined;

  if (!hasSubscriptionInfo) return false;

  const status = String(subscription.status || "").toLowerCase();
  const remainingDays =
    toNumberOrNull(subscription.remainingDays) ?? getDaysUntil(subscription.expiresAt);

  return status !== "expired" && Number(remainingDays) > 0;
};

const normalizeStore = (store) => {
  const subscription = getStoreSubscriptionSnapshot(store);
  return {
    id: String(store.id ?? ""),
    label: store.store_name || store.storeName || store.external_store_id || store.store_shop_id || "Store",
    platform: store.platform || "",
    region: store.region || store.country || "",
    subscription,
    isSubscriptionExpired: !hasUsableStoreSubscription(store),
  };
};

const normalizePlatformValue = (value) => String(value || "").trim().toLowerCase();

const storeMatchesPlatform = (store, platform) => {
  const storePlatform = normalizePlatformValue(store?.platform);
  const platformValue = normalizePlatformValue(platform);
  if (!storePlatform || !platformValue) return false;
  if (platformValue === "tiktok") return storePlatform.includes("tiktok") || storePlatform.includes("tik tok");
  return storePlatform.includes(platformValue);
};

const getReturnOrderStoreKeys = (order = {}) => [
  order.platformStoreId,
  order.platform_store_id,
  order.storeId,
  order.store_id,
  order.raw?.platformStoreId,
  order.raw?.platform_store_id,
  order.storeName,
].map((value) => String(value || "").trim()).filter(Boolean);

const filterOrdersByUsableStores = (rows = [], usableStores = []) => {
  const usableIds = new Set(usableStores.map((item) => String(item.id || "")).filter(Boolean));
  const usableLabels = new Set(usableStores.map((item) => String(item.label || "")).filter(Boolean));
  if (!usableIds.size && !usableLabels.size) return [];

  return rows.filter((order) => {
    const keys = getReturnOrderStoreKeys(order);
    return keys.some((key) => usableIds.has(key) || usableLabels.has(key));
  });
};

const normalizeSku = (sku) => {
  const merchantSkuId = sku.merchantSkuId ?? sku.merchant_sku_id ?? sku.id;
  return {
    id: String(merchantSkuId),
    merchantSkuId: Number(merchantSkuId),
    sku: sku.sku || sku.sku_name || sku.skuName || "",
    productName: sku.productName || sku.sku_title || sku.skuTitle || sku.name || "",
    image: sku.image || sku.image_url || sku.imageUrl || "",
    stock: Number(sku.qty_on_hand ?? sku.qty_available ?? sku.currentStock ?? sku.available ?? 0),
  };
};

const formatDateTime = (value, region) => {
  if (!value) return "-";
  return formatPlatformDateTime(value, region);
};

const getReturnOrderRegion = (order, stores = []) => {
  const matchingStore = stores.find((item) =>
    String(item.id || "") === String(order.platformStoreId || order.platform_store_id || order.storeId || "")
    || (item.label && item.label === order.storeName)
  );

  return resolvePlatformRegion(
    order.platformRegion,
    order.platform_region,
    order.storeContext?.region,
    order.region,
    order.country,
    order.customer?.country,
    order.buyer?.country,
    order.raw?.region,
    order.raw?.country,
    matchingStore?.region,
  );
};

const formatPlatformTimestamp = (value) => {
  if (!value) return "-";
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return formatDateTime(numeric > 9999999999 ? numeric : numeric * 1000);
  }
  return formatDateTime(value);
};

const getRawValue = (source, paths = []) => {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], source);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
};

const yesNo = (value) => {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
};

const getReturnVideos = (raw = {}) =>
  (Array.isArray(raw.buyer_videos) ? raw.buyer_videos : Array.isArray(raw.buyerVideos) ? raw.buyerVideos : [])
    .map((video) => ({
      url: getRawValue(video, ["video_url", "videoUrl", "url"]),
      thumbnail: getRawValue(video, ["thumbnail_url", "thumbnailUrl", "thumbnail"]),
    }))
    .filter((video) => video.url || video.thumbnail);

const getPlatformInfoItems = (order = {}) => {
  const raw = order.raw || {};
  return [
    ["Reason Code", getRawValue(raw, ["reason", "returnReason", "return_reason"])],
    ["Reason Text", order.returnReasonText || getRawValue(raw, ["text_reason", "textReason", "returnReasonText", "return_reason_text"])],
    ["Return Method", getRawValue(raw, ["returnMethod", "return_method", "validation_type", "validationType"])],
    ["Shipment Type", order.shipmentType || getRawValue(raw, ["shipmentType", "shipment_type"])],
    ["Needs Logistics", yesNo(getRawValue(raw, ["needs_logistics", "needsLogistics"]))],
    ["Handover Method", getRawValue(raw, ["handoverMethod", "handover_method"])],
    ["Provider ID", getRawValue(raw, ["returnProviderId", "return_provider_id", "logistics_provider_id", "logisticsProviderId"])],
    ["Return Ship Due", formatPlatformTimestamp(getRawValue(raw, ["return_ship_due_date", "returnShipDueDate"]))],
    ["Latest Solution", getRawValue(raw, ["negotiation.latest_solution", "negotiation.latestSolution"])],
    ["Warehouse Address", getRawValue(raw, ["returnWarehouseAddress.fullAddress", "return_warehouse_address.full_address"])],
  ].filter(([, value]) => value && value !== "-");
};

const getOrderDisplayNumber = (order) =>
  order?.orderNumber || order?.orderNo || order?.platformReturnId || String(order?.id || "");

const formatSelectedReturnOrder = (order) => ({
  ...order,
  returnStatusLabel: getStatusLabel(order.returnStatus),
  orderNumber: getOrderDisplayNumber(order),
});

const statusClass = (status) => {
  if (status === "resalable_item") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "defect_found") return "bg-red-50 text-red-700 border-red-100";
  if (status === "pending_inspection") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

const getPlatformLogo = (platform) => {
  const value = String(platform || "").toLowerCase();
  if (value.includes("shopee")) return shopeeLogo;
  if (value.includes("tik")) return tiktokLogo;
  return "";
};

const isManualReturnOrder = (order = {}) => {
  const values = [
    order.platform,
    order.platformLabel,
    order.source,
    order.orderSource,
    order.returnId,
    order.platformReturnId,
    order.raw?.source,
    order.raw?.orderSource,
  ].map((value) => String(value || "").trim().toLowerCase());

  return values.some((value) =>
    value === "manual" ||
    value === "manual_return" ||
    value === "manual_return_order" ||
    value.startsWith("manual-")
  );
};

function ManualAddBadge() {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
      {tr("Manual Add")}
    </span>
  );
}

function PlatformBadge({ order }) {
  const label = order?.platformLabel || order?.platform || "-";
  const logo = getPlatformLogo(order?.platform || label);
  return logo ? (
    <img src={logo} alt={label} title={label} className="h-8 w-14 object-contain" />
  ) : (
    <span className="text-xs font-semibold text-slate-700">{label}</span>
  );
}

function PlatformInformation({ order }) {
  const items = getPlatformInfoItems(order);
  const videos = getReturnVideos(order?.raw || {});
  if (!items.length && !videos.length) return null;

  return (
    <div className="rounded-xl border border-surface-border bg-white p-5">
      <h3 className="text-base font-bold text-slate-800">Platform Information</h3>
      {items.length ? (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {items.map(([label, value]) => (
            <InfoBox key={label} label={label} value={value} />
          ))}
        </div>
      ) : null}
      {videos.length ? (
        <div className="mt-4 rounded-lg border border-surface-border bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase text-slate-400">Return Videos</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {videos.map((video, index) => (
              <a
                key={`${video.url || video.thumbnail}-${index}`}
                href={video.url || video.thumbnail}
                target="_blank"
                rel="noreferrer"
                className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg border border-surface-border bg-white text-xs font-semibold text-primary"
              >
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt={`Return video ${index + 1}`} className="h-full w-full object-cover" />
                ) : (
                  `Video ${index + 1}`
                )}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ReturnOrderPage() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  const [mode, setMode] = useState("list");
  const [detailOrderId, setDetailOrderId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [pageSizeInput, setPageSizeInput] = useState("10");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedRowsById, setSelectedRowsById] = useState({});
  const [selectingAll, setSelectingAll] = useState(false);
  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [datePreset, setDatePreset] = useState("last_month");
  const [dateRange, setDateRange] = useState(() => getPresetRange("last_month"));
  const [platform, setPlatform] = useState("All Platforms");
  const [store, setStore] = useState("All Stores");
  const [searchType, setSearchType] = useState("Single Search");
  const [skuType, setSkuType] = useState("SKU");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedSearchType, setAppliedSearchType] = useState("Single Search");
  const [appliedSkuType, setAppliedSkuType] = useState("SKU");
  const [searchSubmitKey, setSearchSubmitKey] = useState(0);
  const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false);
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [manualEditOrder, setManualEditOrder] = useState(null);
  const [openActionId, setOpenActionId] = useState(null);
  const [openActionAnchor, setOpenActionAnchor] = useState(null);
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [accessWarningOpen, setAccessWarningOpen] = useState(false);
  const [syncStatusPolling, setSyncStatusPolling] = useState(false);
  const syncWaitScopeRef = useRef(null);
  const pageOpenSyncStartedRef = useRef(false);
  const pendingManualReturnRef = useRef(null);

  const storeOptions = useMemo(
    () => ["All Stores", ...stores.map((item) => item.label)],
    [stores]
  );

  const selectedRows = useMemo(
    () => {
      const visibleById = new Map(orders.map((order) => [String(order.id), order]));
      return selectedIds
        .map((id) => selectedRowsById[String(id)] || visibleById.get(String(id)))
        .filter(Boolean)
        .map(formatSelectedReturnOrder);
    },
    [orders, selectedIds, selectedRowsById]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectedRowsById({});
  }, []);

  const getReturnOrderParams = useCallback((overrides = {}) => {
    const selectedStore = stores.find((item) => item.label === store);
    return {
      page: pagination.page,
      limit: pagination.limit,
      platform: platformParam(platform),
      storeId: selectedStore?.id || "all",
      search: appliedSearch.trim() || undefined,
      searchType: appliedSearch.trim() ? appliedSearchType : undefined,
      skuType: appliedSearch.trim() ? appliedSkuType : undefined,
      startDate: dateRange.start || undefined,
      endDate: dateRange.end || undefined,
      ...overrides,
    };
  }, [appliedSearch, appliedSearchType, appliedSkuType, dateRange.end, dateRange.start, pagination.limit, pagination.page, platform, store, stores]);

  const loadWarehouses = useCallback(async () => {
    try {
      const response = await api.get("/warehouses", { params: { page: 1, limit: 100 } });
      setWarehouses(filterWarehousesByPermission(getRows(response)).map(normalizeWarehouse));
    } catch (error) {
      toast.error(error?.response?.data?.message || tr("Failed to load warehouses"));
    }
  }, []);

  const loadStores = useCallback(async () => {
    try {
      const response = await api.get("/platform-stores", { params: { page: 1, limit: 1000 } });
      const usableStores = getRows(response)
        .filter(hasUsableStoreSubscription)
        .map(normalizeStore);
      setStores(usableStores);
      setStore((currentStore) =>
        currentStore === "All Stores" || usableStores.some((item) => item.label === currentStore)
          ? currentStore
          : "All Stores"
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || tr("Failed to load stores"));
    }
  }, []);

  const loadOrders = useCallback(async () => {
    let keepLoadingForSync = false;
    setLoading(true);
    try {
      const response = await api.get("/return-orders", {
        params: getReturnOrderParams(),
      });
      const rows = filterOrdersByUsableStores(getRows(response), stores);
      const pendingManualReturn = pendingManualReturnRef.current;
      const responseIncludesPending = pendingManualReturn?.id && rows.some((order) => String(order.id) === String(pendingManualReturn.id));
      const nextRows = pendingManualReturn?.id && !responseIncludesPending
        ? [pendingManualReturn, ...rows]
        : rows;
      if (responseIncludesPending) {
        pendingManualReturnRef.current = null;
      }
      setOrders(nextRows);
      setPagination((prev) => {
        const nextPagination = getPagination(response, prev);
        if (pendingManualReturn?.id && nextRows.length > rows.length) {
          return {
            ...nextPagination,
            total: Math.max(nextPagination.total + 1, nextRows.length),
            totalPages: Math.max(nextPagination.totalPages, Math.ceil(Math.max(nextPagination.total + 1, nextRows.length) / nextPagination.limit)),
          };
        }
        return nextPagination;
      });
      try {
        const statusResponse = await getReturnSyncStatus();
        if (isRelevantSyncRunning(statusResponse, syncWaitScopeRef.current)) {
          keepLoadingForSync = true;
          setSyncStatusPolling(true);
        }
      } catch {
        // List load should not fail if sync-status polling is temporarily unavailable.
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || tr("Failed to load return orders"));
    } finally {
      if (!keepLoadingForSync) setLoading(false);
    }
  }, [getReturnOrderParams, searchSubmitKey, stores]);

  const handleDateRangeChange = useCallback((nextRange) => {
    clearSelection();
    setDateRange(nextRange);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [clearSelection]);

  const handleSearch = useCallback(() => {
    const normalizedSearch =
      searchType === "Batch Search"
        ? search
            .split(/[\r\n,]+/)
            .map((value) => value.trim())
            .filter(Boolean)
            .join("\n")
        : search.trim();
    setAppliedSearch(normalizedSearch);
    setAppliedSearchType(searchType);
    setAppliedSkuType(skuType);
    clearSelection();
    setSearchSubmitKey((value) => value + 1);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [clearSelection, search, searchType, skuType]);

  const handlePageSizeSearch = useCallback(() => {
    const nextLimit = Math.max(1, Number.parseInt(pageSizeInput, 10) || 10);
    setPageSizeInput(String(nextLimit));
    setPagination((prev) => ({ ...prev, page: 1, limit: nextLimit }));
  }, [pageSizeInput]);

  const syncReturnOrders = useCallback(async ({ silent = false, platforms = ["tiktok", "shopee"], storeIds = [] } = {}) => {
    if (!stores.length) {
      if (!silent) setAccessWarningOpen(true);
      return;
    }

    setSyncing(true);
    try {
      const selectedPlatforms = platforms.filter((item) => ["tiktok", "shopee"].includes(item));
      const scopedStoreIds = storeIds.map(String).filter(Boolean);
      const syncRequests = selectedPlatforms.flatMap((selectedPlatform) => {
        const platformStoreIds = scopedStoreIds.filter((storeId) =>
          stores.some((item) => item.id === storeId && storeMatchesPlatform(item, selectedPlatform))
        );
        if (scopedStoreIds.length && !platformStoreIds.length) return [];
        const payload = {
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined,
          pageSize: 50,
          ...(platformStoreIds.length
            ? {
                storeIds: platformStoreIds,
                storeId: platformStoreIds.length === 1 ? platformStoreIds[0] : undefined,
              }
            : {}),
        };
        return [api.post(`/return-orders/sync/${selectedPlatform}`, payload)];
      });
      const results = await Promise.allSettled(syncRequests);
      const successful = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value || {});
      const failed = results.filter((result) => result.status === "rejected");

      const summaries = successful.map((summary) => summary.data || summary);
      const backgroundStarted = summaries.some((summary) => summary.queued || summary.alreadyRunning);
      if (backgroundStarted) {
        syncWaitScopeRef.current = { platforms: selectedPlatforms };
        setLoading(true);
        setSyncStatusPolling(true);
      }
      if (!silent && successful.length) {
        const created = summaries.reduce((sum, summary) => sum + Number(summary.created || 0), 0);
        const updated = summaries.reduce((sum, summary) => sum + Number(summary.updated || 0), 0);
        toast.success(backgroundStarted
          ? tr("Return order sync started")
          : tr("Return orders synced") + ` (${created} ${tr("created")}, ${updated} ${tr("updated")})`
        );
      }
      if (!silent && failed.length && !successful.length) {
        toast.error(failed[0]?.reason?.response?.data?.message || tr("Failed to sync return orders"));
      }
      if (!backgroundStarted) await loadOrders();
    } catch (error) {
      if (!silent) {
        toast.error(error?.response?.data?.message || tr("Failed to sync return orders"));
      }
    } finally {
      setSyncing(false);
    }
  }, [dateRange.end, dateRange.start, loadOrders, stores]);

  const confirmSyncReturnOrders = useCallback(async (options) => {
    await syncReturnOrders(options);
    setSyncConfirmOpen(false);
  }, [syncReturnOrders]);

  const openSyncConfirm = useCallback(() => {
    if (!stores.length) {
      setAccessWarningOpen(true);
      return;
    }
    setSyncConfirmOpen(true);
  }, [stores.length]);

  const openManualReturn = useCallback(() => {
    if (!stores.length) {
      setAccessWarningOpen(true);
      return;
    }
    setMode("manual");
  }, [stores.length]);

  const goToReturnPurchasePlan = useCallback(() => {
    setAccessWarningOpen(false);
    navigate("/warehouse_management/pricing");
  }, [navigate]);

  useEffect(() => {
    loadWarehouses();
    loadStores();
  }, [loadStores, loadWarehouses]);

  useEffect(() => {
    if (pageOpenSyncStartedRef.current || !stores.length) return;
    pageOpenSyncStartedRef.current = true;
    syncReturnOrders({ silent: true, platforms: ["tiktok", "shopee"] });
  }, [stores, syncReturnOrders]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadOrders();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  useEffect(() => {
    let cancelled = false;
    const checkInitialSyncStatus = async () => {
      try {
        const response = await getReturnSyncStatus();
        if (!cancelled && isRelevantSyncRunning(response, syncWaitScopeRef.current)) {
          setLoading(true);
          setSyncStatusPolling(true);
        }
      } catch {
        // Status polling is best-effort; the table still loads normally.
      }
    };
    checkInitialSyncStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let completedAfterRunning = false;

    const pollSyncStatus = async () => {
      try {
        const response = await getReturnSyncStatus();
        const relevantRunning = isRelevantSyncRunning(response, syncWaitScopeRef.current);
        if (cancelled) return;

        if (relevantRunning) {
          setLoading(true);
          completedAfterRunning = true;
          window.setTimeout(pollSyncStatus, 3000);
          return;
        }

        setSyncStatusPolling(false);
        if (completedAfterRunning) {
          await loadOrders();
          syncWaitScopeRef.current = null;
        } else {
          syncWaitScopeRef.current = null;
          setLoading(false);
        }
      } catch {
        if (!cancelled) window.setTimeout(pollSyncStatus, 5000);
      }
    };

    if (syncStatusPolling) {
      pollSyncStatus();
    }

    return () => {
      cancelled = true;
    };
  }, [loadOrders, syncStatusPolling]);

  const fetchAllFilteredReturnOrders = useCallback(async () => {
    const pageLimit = 100;
    const firstResponse = await api.get("/return-orders", {
      params: getReturnOrderParams({ page: 1, limit: pageLimit }),
    });
    const firstRows = filterOrdersByUsableStores(getRows(firstResponse), stores);
    const firstPagination = getPagination(firstResponse, { page: 1, limit: pageLimit, totalPages: 1 });
    const totalPages = Math.max(1, Number(firstPagination.totalPages) || 1);
    const allRows = [...firstRows];

    for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
      const response = await api.get("/return-orders", {
        params: getReturnOrderParams({ page: pageNumber, limit: pageLimit }),
      });
      allRows.push(...filterOrdersByUsableStores(getRows(response), stores));
    }

    return allRows;
  }, [getReturnOrderParams, stores]);

  const toggleSelect = (id) => {
    const idKey = String(id);
    const row = orders.find((order) => String(order.id) === idKey);
    const selected = selectedIds.some((item) => String(item) === idKey);

    setSelectedIds((prev) =>
      selected ? prev.filter((item) => String(item) !== idKey) : [...prev, idKey]
    );
    setSelectedRowsById((prev) => {
      if (selected) {
        const next = { ...prev };
        delete next[idKey];
        return next;
      }
      return row ? { ...prev, [idKey]: row } : prev;
    });
  };

  const toggleAll = async () => {
    if (loading || selectingAll) return;
    const selectedTotal = Number(pagination.total) || orders.length;
    const allSelected = selectedTotal > 0 && selectedIds.length >= selectedTotal;
    if (allSelected) {
      clearSelection();
      return;
    }

    setSelectingAll(true);
    try {
      const allRows = await fetchAllFilteredReturnOrders();
      const nextRowsById = {};
      const nextIds = [];
      allRows.forEach((order) => {
        const idKey = String(order.id || "");
        if (!idKey || nextRowsById[idKey]) return;
        nextRowsById[idKey] = order;
        nextIds.push(idKey);
      });
      setSelectedRowsById(nextRowsById);
      setSelectedIds(nextIds);
      if (nextIds.length) {
        toast.success(`${nextIds.length} ${tr("Return Orders")} ${tr("selected")}`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || tr("Failed to load return orders"));
    } finally {
      setSelectingAll(false);
    }
  };

  const handleStatusUpdated = (updated) => {
    setOrders((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
    setSelectedRowsById((prev) => {
      const idKey = String(updated.id || "");
      return prev[idKey] ? { ...prev, [idKey]: { ...prev[idKey], ...updated } } : prev;
    });
    setStatusModalOrder(null);
  };

  const handleDeleted = (id) => {
    setOrders((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => prev.filter((item) => String(item) !== String(id)));
    setSelectedRowsById((prev) => {
      const next = { ...prev };
      delete next[String(id)];
      return next;
    });
    setDeleteOrder(null);
  };

  const openDetails = (id) => {
    setDetailOrderId(id);
    setMode("details");
  };

  const handleManualSaved = useCallback((savedOrder) => {
    const normalizedSavedOrder = getSavedReturnOrder(savedOrder);
    if (normalizedSavedOrder?.id) {
      const manualSavedOrder = {
        ...normalizedSavedOrder,
        source: normalizedSavedOrder.source || normalizedSavedOrder.orderSource || "manual",
        orderSource: normalizedSavedOrder.orderSource || normalizedSavedOrder.source || "manual",
      };
      pendingManualReturnRef.current = manualSavedOrder;
      setOrders((prev) => {
        const exists = prev.some((item) => String(item.id) === String(manualSavedOrder.id));
        return exists
          ? prev.map((item) => (String(item.id) === String(manualSavedOrder.id) ? { ...item, ...manualSavedOrder } : item))
          : [{ ...manualSavedOrder }, ...prev];
      });
      setPagination((prev) => ({ ...prev, total: Math.max(prev.total + 1, 1) }));
    }
    window.setTimeout(() => {
      loadOrders();
    }, 300);
  }, [loadOrders]);

  if (mode === "manual") {
    return (
      <ManualReturnOrderForm
        language={language}
        warehouses={warehouses}
        stores={stores}
        onSaved={handleManualSaved}
        onBack={() => {
          setMode("list");
        }}
      />
    );
  }

  if (mode === "details" && detailOrderId) {
    return (
      <ReturnOrderDetails
        language={language}
        orderId={detailOrderId}
        warehouses={warehouses}
        stores={stores}
        onOrderUpdated={(updated) => {
          setOrders((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
          setSelectedRowsById((prev) => {
            const idKey = String(updated.id || "");
            return prev[idKey] ? { ...prev, [idKey]: { ...prev[idKey], ...updated } } : prev;
          });
        }}
        onOrderDeleted={(id) => {
          setOrders((prev) => prev.filter((item) => item.id !== id));
          setSelectedIds((prev) => prev.filter((item) => String(item) !== String(id)));
          setSelectedRowsById((prev) => {
            const next = { ...prev };
            delete next[String(id)];
            return next;
          });
        }}
        onBack={() => {
          setMode("list");
          setDetailOrderId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 font-body" data-language={language}>
      <Topbar PageTitle="Order Processing" />

      <OrderFilterBar
        platform={platform}
        setPlatform={(value) => {
          setPlatform(value);
          clearSelection();
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        platforms={PLATFORM_OPTIONS}
        store={store}
        setStore={(value) => {
          setStore(value);
          clearSelection();
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        stores={storeOptions}
        searchType={searchType}
        setSearchType={setSearchType}
        searchTypes={SEARCH_TYPES}
        skuType={skuType}
        setSkuType={setSkuType}
        skuTypes={SKU_TYPES}
        search={search}
        setSearch={setSearch}
        onSearch={handleSearch}
        showSearchTypeDropdown={showSearchTypeDropdown}
        setShowSearchTypeDropdown={setShowSearchTypeDropdown}
      />

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-800 font-display">Return Orders</h2>
            <div className="flex items-center gap-2">
              <OrderDateRangePicker
                datePreset={datePreset}
                setDatePreset={setDatePreset}
                dateRange={dateRange}
                setDateRange={handleDateRangeChange}
                maxLookbackDays={RETURN_DATE_MAX_LOOKBACK_DAYS}
                onApply={() => {
                  clearSelection();
                  setSearchSubmitKey((value) => value + 1);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
              />
              <button
                type="button"
                onClick={openSyncConfirm}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-card disabled:opacity-60"
              >
                {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {syncing ? tr("Syncing...") : tr("Sync Return Orders")}
              </button>
              <button
                type="button"
                onClick={openManualReturn}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                <Plus size={14} />
                Add Manual Return Order
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-sm">
            <thead className="bg-white">
              <tr className="border-y border-surface-border text-left text-slate-800">
                <th className="w-20 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={pagination.total > 0 && selectedIds.length >= pagination.total}
                      onChange={toggleAll}
                      disabled={loading || selectingAll || !orders.length}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    {selectingAll ? <Loader2 size={14} className="animate-spin text-primary" /> : null}
                  </div>
                </th>
                {[
                  { label: "Platform" },
                  { label: "Store" },
                  { label: "Created Time" },
                  { label: "Updated Time" },
                  { label: "Image" },
                  { label: "SKU" },
                  { label: "Order Number" },
                  { label: "Tracking Number" },
                  { label: "Return Status" },
                  { label: "Platform Status" },
                  { label: "Actions" },
                ].map((header) => (
                  <th key={header.label} className="px-4 py-3 font-bold whitespace-nowrap">
                    {tr(header.label)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <ReturnOrderTableSkeleton colSpan={12} />
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="h-40 text-center text-slate-400">
                    No return orders found
                  </td>
                </tr>
                ) : (
                orders.map((order) => {
                  const orderRegion = getReturnOrderRegion(order, stores);

                  return (
                  <tr key={order.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.some((id) => String(id) === String(order.id))}
                        onChange={() => toggleSelect(order.id)}
                        className="h-4 w-4 rounded accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <PlatformBadge order={order} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex flex-col items-start gap-1.5">
                        <span>{order.storeName || "-"}</span>
                        {isManualReturnOrder(order) ? <ManualAddBadge /> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(order.platformCreatedAt || order.createdAt, orderRegion)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(order.platformUpdatedAt || order.updatedAt, orderRegion)}</td>
                    <td className="px-4 py-3">
                      <img
                        src={order.image || "https://placehold.co/36x36/E6ECF0/004368?text=?"}
                        alt={order.sku || "Return SKU"}
                        className="h-9 w-9 rounded-md object-cover"
                        onError={(event) => {
                          event.currentTarget.src = "https://placehold.co/36x36/E6ECF0/004368?text=?";
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">{order.sku || "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{getOrderDisplayNumber(order)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{order.trackingNo || "-"}</div>
                      {order.localReturnTrackingNo ? (
                        <div className="mt-1 font-semibold text-orange-600">{order.localReturnTrackingNo}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setStatusModalOrder(order)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(order.returnStatus)}`}
                      >
                        {getStatusLabel(order.returnStatus)}
                        <Pencil size={12} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{isManualReturnOrder(order) ? "--" : order.platformStatusLabel || "-"}</td>
                    <td className="px-4 py-3">
                      <ReturnOrderRowActions
                        order={order}
                        open={openActionId === order.id}
                        anchor={openActionAnchor}
                        onToggle={(anchor) => {
                          setOpenActionAnchor(anchor);
                          setOpenActionId((current) => (current === order.id ? null : order.id));
                        }}
                        onClose={() => {
                          setOpenActionId(null);
                          setOpenActionAnchor(null);
                        }}
                        onDetails={() => openDetails(order.id)}
                        onEdit={() => setManualEditOrder(order)}
                        onDelete={() => setDeleteOrder(order)}
                      />
                    </td>
                  </tr>
                  );
                })
                )}
            </tbody>
          </table>
        </div>

        {pagination.total > 0 && (
        <div className="grid grid-cols-1 items-center gap-3 border-t border-surface-border px-5 py-4 md:grid-cols-3">
          <div className="flex flex-wrap items-center gap-3 md:justify-start">
            <p className="text-xs text-slate-500">
              {tr("Showing")} {orders.length ? (pagination.page - 1) * pagination.limit + 1 : 0}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} {tr("of")} {pagination.total} {tr("return orders")}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <label className="flex items-center gap-2">
              <span>{tr("Orders per page")}</span>
              <input
                type="number"
                min="1"
                value={pageSizeInput}
                onChange={(event) => setPageSizeInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handlePageSizeSearch();
                }}
                className="h-8 w-20 rounded-lg border border-surface-border bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
              />
            </label>
            <button
              type="button"
              onClick={handlePageSizeSearch}
              disabled={loading}
              className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? tr("Searching...") : tr("Search")}
            </button>
          </div>
          <div className="flex items-center gap-1 md:justify-end">
            <button
              type="button"
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1 || loading}
              className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-surface-card disabled:cursor-not-allowed disabled:opacity-40"
            >
              {tr("Previous")}
            </button>
            <span className="px-3 py-1.5 text-xs font-semibold text-primary">
              {tr("Page")} {pagination.page} {tr("of")} {Math.max(1, pagination.totalPages)}
            </span>
            <button
              type="button"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(Math.max(1, prev.totalPages), prev.page + 1),
                }))
              }
              disabled={pagination.page >= pagination.totalPages || loading}
              className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-surface-card disabled:cursor-not-allowed disabled:opacity-40"
            >
              {tr("Next")}
            </button>
          </div>
        </div>
        )}

        {(selectingAll || selectedIds.length > 0) && (
          <div className="border-t border-surface-border px-5 py-3 text-xs font-semibold text-slate-600">
            {selectingAll
              ? tr("Selecting all return orders...")
              : `${selectedIds.length} ${tr("Return Orders")} ${tr("selected")}`}
          </div>
        )}

        <OrderFooter
          selectedRows={selectedRows}
          columns={RETURN_ORDER_COLUMNS}
          title="Selected Return Orders"
        />
      </div>

      <ReturnStatusModal
        order={statusModalOrder}
        warehouses={warehouses}
        onClose={() => setStatusModalOrder(null)}
        onUpdated={handleStatusUpdated}
      />
      <DeleteReturnModal
        order={deleteOrder}
        onClose={() => setDeleteOrder(null)}
        onDeleted={handleDeleted}
      />
      <ManualReturnEditModal
        order={manualEditOrder}
        warehouses={warehouses}
        stores={stores}
        onClose={() => setManualEditOrder(null)}
        onUpdated={(updated) => {
          setOrders((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
          setSelectedRowsById((prev) => {
            const idKey = String(updated.id || "");
            return prev[idKey] ? { ...prev, [idKey]: { ...prev[idKey], ...updated } } : prev;
          });
          setManualEditOrder(null);
        }}
      />
      {syncConfirmOpen && (
        <SyncReturnOrdersConfirmModal
          syncing={syncing}
          dateLabel={getDateRangeLabel(datePreset, dateRange)}
          stores={stores}
          onClose={() => setSyncConfirmOpen(false)}
          onConfirm={confirmSyncReturnOrders}
        />
      )}

      {accessWarningOpen && (
        <ReturnOrderAccessWarningModal
          t={t}
          onClose={() => setAccessWarningOpen(false)}
          onPricing={goToReturnPurchasePlan}
        />
      )}
    </div>
  );
}

function ReturnOrderTableSkeleton({ colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-5">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 animate-pulse">
              <div className="h-4 w-4 rounded bg-slate-200" />
              <div className="h-4 w-20 rounded bg-slate-200" />
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-10 w-10 rounded-lg bg-slate-200" />
              <div className="h-4 w-20 rounded bg-slate-200" />
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-4 w-24 rounded bg-slate-200" />
              <Loader2 size={14} className="animate-spin text-primary" />
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}

function ReturnOrderRowActions({ order, open, anchor, onToggle, onClose, onDetails, onEdit, onDelete }) {
  const buttonRef = useRef(null);
  const manualOrder = isManualReturnOrder(order);

  if (!manualOrder) {
    return (
      <button
        type="button"
        onClick={onDetails}
        className="rounded-md p-1.5 text-slate-500 hover:bg-blue-50 hover:text-primary"
        title={tr("Details")}
      >
        <Eye size={16} />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => onToggle(event.currentTarget)}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        title={tr("Actions")}
      >
        <MoreHorizontal size={17} />
      </button>
      <PortalActionMenu
        open={open}
        anchorRef={{ current: anchor || buttonRef.current }}
        onClose={onClose}
        width={150}
        className="overflow-hidden"
      >
        <button
          type="button"
          onClick={() => {
            onClose();
            onDetails();
          }}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          <Eye size={13} />
          {tr("Details")}
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onEdit();
          }}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          <Pencil size={13} />
          {tr("Edit")}
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onDelete();
          }}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
        >
          <Trash2 size={13} />
          {tr("Delete")}
        </button>
      </PortalActionMenu>
    </div>
  );
}

function ReturnOrderAccessWarningModal({ t, onClose, onPricing }) {
  return (
    <ModalShell onClose={onClose} width="max-w-md">
      <div className="px-6 py-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <AlertTriangle size={28} />
        </div>

        <h3 className="mt-5 text-lg font-bold text-slate-900">
          {t("subscription.manualOrderAccessTitle", { defaultValue: "Purchase Plan Required" })}
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {t("subscription.returnOrderAccessMessage", {
            defaultValue:
              "Return Orders are available only when this company has at least one store with active plan days or free trial days. Please purchase any plan for any store first, then you can use this section.",
          })}
        </p>
      </div>

      <div className="flex gap-3 border-t border-surface-border px-6 py-4">
        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-surface-border px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
          {t("subscription.cancel", { defaultValue: "Cancel" })}
        </button>
        <button type="button" onClick={onPricing} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
          {t("subscription.manualOrderAccessPurchasePlan", { defaultValue: "Purchase Plan" })}
        </button>
      </div>
    </ModalShell>
  );
}

function SyncReturnOrdersConfirmModal({ syncing, dateLabel, stores, onClose, onConfirm }) {
  const [selectedPlatforms, setSelectedPlatforms] = useState(["tiktok", "shopee"]);
  const [syncAllStores, setSyncAllStores] = useState(true);
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);
  const availableStores = useMemo(
    () => stores.filter((store) => selectedPlatforms.some((platformValue) => storeMatchesPlatform(store, platformValue))),
    [selectedPlatforms, stores]
  );
  const visibleSelectedStoreIds = selectedStoreIds.filter((storeId) =>
    availableStores.some((store) => store.id === storeId)
  );
  const canConfirm = selectedPlatforms.length > 0 && (syncAllStores || visibleSelectedStoreIds.length > 0);

  const togglePlatform = (platformValue) => {
    const next = selectedPlatforms.includes(platformValue)
      ? selectedPlatforms.filter((item) => item !== platformValue)
      : [...selectedPlatforms, platformValue];
    setSelectedPlatforms(next);
    setSelectedStoreIds((current) =>
      current.filter((storeId) => stores.some((store) => store.id === storeId && next.some((item) => storeMatchesPlatform(store, item))))
    );
  };

  const toggleStore = (storeId) => {
    setSyncAllStores(false);
    setSelectedStoreIds((prev) => (prev.includes(storeId) ? prev.filter((item) => item !== storeId) : [...prev, storeId]));
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      platforms: selectedPlatforms,
      storeIds: syncAllStores ? [] : visibleSelectedStoreIds,
    });
  };

  return (
    <ModalShell onClose={syncing ? undefined : onClose} width="max-w-lg">
      <div className="p-6">
        <h3 className="text-base font-bold text-slate-800">{tr("Confirm Sync Return Orders")}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {tr("Are you sure you want to sync Shopee and TikTok return orders for the selected date range? New returns will be stored and existing return statuses/reasons will be updated.")}
          {dateLabel ? ` ${tr("Date Range")}: ${tr(dateLabel)}.` : ""}
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">{tr("Choose Platform")}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["tiktok", "TikTok"],
                ["shopee", "Shopee"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 rounded-lg border border-surface-border px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(value)}
                    onChange={() => togglePlatform(value)}
                    disabled={syncing}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  {tr(label)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">{tr("Choose Store")}</p>
            <label className="flex items-center gap-2 rounded-lg border border-surface-border px-3 py-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={syncAllStores}
                onChange={() => {
                  setSyncAllStores(true);
                  setSelectedStoreIds([]);
                }}
                disabled={syncing}
                className="h-4 w-4 rounded accent-primary"
              />
              {tr("Sync all matching stores")}
            </label>
            <div className="mt-2 max-h-44 space-y-2 overflow-y-auto rounded-lg border border-surface-border p-2">
              {availableStores.length ? (
                availableStores.map((store) => (
                  <label key={store.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                    <span className="flex min-w-0 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!syncAllStores && visibleSelectedStoreIds.includes(store.id)}
                        onChange={() => toggleStore(store.id)}
                        disabled={syncing}
                        className="h-4 w-4 rounded accent-primary"
                      />
                      <span className="truncate font-semibold text-slate-700">{store.label}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">{tr(store.platform || "")}</span>
                  </label>
                ))
              ) : (
                <p className="px-2 py-4 text-center text-sm text-slate-400">{tr("No stores found for selected platform")}</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={syncing} className={SECONDARY_BUTTON_CLASS}>
            {tr("Cancel")}
          </button>
          <button type="button" onClick={handleConfirm} disabled={syncing || !canConfirm} className={PRIMARY_BUTTON_CLASS}>
            {syncing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {tr("Syncing...")}
              </>
            ) : (
              tr("Start Sync")
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ReturnStatusModal({ order, warehouses, onClose, onUpdated }) {
  const [form, setForm] = useState({
    returnStatus: "need_to_check",
    returnType: "by_logistic",
    localReturnTrackingNo: "",
    logisticName: "",
    warehouseId: "",
    remark: "",
  });
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!order) return;
    setForm({
      returnStatus: order.returnStatus || "need_to_check",
      returnType: order.localReturnType ? normalizeEditableReturnType(order.localReturnType) : "by_logistic",
      localReturnTrackingNo: order.localReturnTrackingNo || order.returnTrackingNo || "",
      logisticName: order.logisticName || "",
      warehouseId: order.warehouseId ? String(order.warehouseId) : "",
      remark: order.remark || "",
    });
    setConfirming(false);
  }, [order]);

  if (!order) return null;

  const requiresTracking = TRACKING_REQUIRED_TYPES.has(form.returnType);
  const isChangingToResalable = order.returnStatus !== "resalable_item" && form.returnStatus === "resalable_item";
  const isReversingResalable = order.returnStatus === "resalable_item" && form.returnStatus !== "resalable_item";
  const confirmationTitle = isReversingResalable ? "Confirm Stock Reduction" : "Confirm Return Status";
  const confirmationMessage = isReversingResalable
    ? "This return was already marked as resalable. Changing to another status will reduce warehouse inventory and reduce mapped platform stock for the related SKUs. Are you sure you want to continue?"
    : isChangingToResalable
      ? "Are you sure this item is resalable? These order SKU quantities will be manually inbounded into the selected warehouse and mapped platform stock will be increased."
      : "Are you sure you want to update this return status?";

  const validate = () => {
    if (!form.returnStatus) return "Return status is required";
    if (!form.returnType) return "Return type is required";
    if (!form.warehouseId) return "Warehouse is required";
    return "";
  };

  const requestSave = () => {
    const error = validate();
    if (error) {
      toast.error(tr(error));
      return;
    }
    setConfirming(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    try {
      const response = await api.patch(`/return-orders/${order.id}/status`, {
        returnStatus: form.returnStatus,
        returnType: form.returnType,
        localReturnTrackingNo: form.localReturnTrackingNo.trim(),
        logisticName: form.logisticName.trim(),
        warehouseId: Number(form.warehouseId),
        remark: form.remark.trim(),
        previousReturnStatus: order.returnStatus || "",
        stockAdjustmentAction: isReversingResalable ? "reverse_resalable" : isChangingToResalable ? "apply_resalable" : "none",
      });
      toast.success(tr("Return status updated"));
      onUpdated(response.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || tr("Failed to update return status"));
    } finally {
      setSaving(false);
      setConfirming(false);
    }
  };

  return (
    <ModalShell onClose={onClose} width="max-w-lg">
      <div>
        <div className="flex items-start justify-between border-b border-surface-border px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Return Status</h3>
            <p className="mt-1 text-xs text-slate-500">{getOrderDisplayNumber(order)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <FormField label="Select Status" required>
            <select
              value={form.returnStatus}
              onChange={(event) => setForm((prev) => ({ ...prev, returnStatus: event.target.value }))}
              className={INPUT_CLASS}
            >
              {RETURN_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Remark">
            <textarea
              value={form.remark}
              onChange={(event) => setForm((prev) => ({ ...prev, remark: event.target.value }))}
              placeholder="Other Remarks"
              rows={3}
              className={`${INPUT_CLASS} resize-none`}
            />
          </FormField>

          <FormField label="Select Return Type" required>
            <select
              value={form.returnType}
              onChange={(event) => setForm((prev) => ({ ...prev, returnType: event.target.value }))}
              className={INPUT_CLASS}
            >
              {RETURN_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Return Tracking Number">
            <input
              type="text"
              value={order.platformTrackingNo || order.trackingNo || ""}
              readOnly
              placeholder="No platform tracking number"
              className={`${INPUT_CLASS} bg-slate-50 text-slate-500`}
            />
          </FormField>

          {requiresTracking ? (
            <FormField label="Additional Tracking Number">
              <input
                type="text"
                value={form.localReturnTrackingNo}
                onChange={(event) => setForm((prev) => ({ ...prev, localReturnTrackingNo: event.target.value }))}
                placeholder="Input another tracking number here"
                className={INPUT_CLASS}
              />
            </FormField>
          ) : null}

          <FormField label="Logistic Name">
            <input
              type="text"
              value={form.logisticName}
              onChange={(event) => setForm((prev) => ({ ...prev, logisticName: event.target.value }))}
              placeholder="Logistic name here"
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField label="Select Warehouse" required>
            <select
              value={form.warehouseId}
              onChange={(event) => setForm((prev) => ({ ...prev, warehouseId: event.target.value }))}
              className={INPUT_CLASS}
            >
              <option value="">Warehouse name here</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}{warehouse.code ? ` (${warehouse.code})` : ""}
                </option>
              ))}
            </select>
          </FormField>

          {confirming ? (
            <div className={`rounded-lg border p-4 ${isReversingResalable ? "border-red-200 bg-red-50" : "border-primary/20 bg-primary/5"}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${isReversingResalable ? "bg-red-500" : "bg-primary"}`}>
                  <AlertTriangle size={16} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{tr(confirmationTitle)}</h4>
                  <p className={`mt-1 text-sm leading-6 ${isReversingResalable ? "text-red-700" : "text-slate-600"}`}>
                    {tr(confirmationMessage)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-surface-border px-5 py-4">
          {confirming ? (
            <>
              <button type="button" onClick={() => setConfirming(false)} disabled={saving} className={SECONDARY_BUTTON_CLASS}>
                Back
              </button>
              <button type="button" onClick={confirmSave} disabled={saving} className={PRIMARY_BUTTON_CLASS}>
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Confirm Return Status"
                )}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className={SECONDARY_BUTTON_CLASS}>
                Cancel
              </button>
              <button type="button" onClick={requestSave} className={PRIMARY_BUTTON_CLASS}>
                Save Return Status
              </button>
            </>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

function ManualReturnEditModal({ order, warehouses, stores, onClose, onUpdated }) {
  const [form, setForm] = useState({
    warehouseId: "",
    platform: "shopee",
    platformStoreId: "",
    orderNumber: "",
    returnId: "",
    buyerUsername: "",
    buyerEmail: "",
    refundCurrency: "",
    refundTotal: "",
    returnReasonText: "",
    returnType: "by_logistic",
    warehousePackageNo: "",
    trackingNumber: "",
    localReturnTrackingNo: "",
    logisticName: "",
    remark: "",
  });
  const [saving, setSaving] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const platformStores = useMemo(
    () => stores.filter((item) => storeMatchesPlatform(item, form.platform)),
    [form.platform, stores]
  );

  useEffect(() => {
    if (!order) return;
    let cancelled = false;
    setDetailOrder(order);
    setDetailLoading(true);
    api.get(`/return-orders/${order.id}`)
      .then((response) => {
        if (!cancelled) setDetailOrder(response.data || response || order);
      })
      .catch(() => {
        if (!cancelled) setDetailOrder(order);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [order]);

  useEffect(() => {
    const source = detailOrder || order;
    if (!source) return;
    const platformValue = normalizePlatformValue(source.platform || source.platformLabel).includes("tik") ? "tiktok" : "shopee";
    const storeId = String(source.platformStoreId || source.storeId || source.platform_store_id || "");
    const matchedStore = storeId
      || stores.find((item) => item.label === source.storeName && storeMatchesPlatform(item, platformValue))?.id
      || "";

    setForm({
      warehouseId: source.warehouseId ? String(source.warehouseId) : "",
      platform: platformValue,
      platformStoreId: matchedStore,
      orderNumber: getOrderDisplayNumber(source),
      returnId: source.returnId || source.platformReturnId || "",
      buyerUsername: source.buyerUsername || "",
      buyerEmail: source.buyerEmail || "",
      refundCurrency: source.refundCurrency || "",
      refundTotal: source.refundTotal ?? "",
      returnReason: source.returnReason || "",
      returnReasonText: source.returnReasonText || "",
      returnType: source.localReturnType ? normalizeEditableReturnType(source.localReturnType) : normalizeEditableReturnType(source.returnType),
      warehousePackageNo: source.warehousePackageNo || source.packageNo || "",
      trackingNumber: source.trackingNo || source.trackingNumber || "",
      localReturnTrackingNo: source.localReturnTrackingNo || "",
      logisticName: source.logisticName || "",
      remark: source.remark || "",
    });
  }, [detailOrder, order, stores]);

  if (!order) return null;

  const sourceOrder = detailOrder || order;
  const products = Array.isArray(sourceOrder.products)
    ? sourceOrder.products
    : Array.isArray(sourceOrder.items)
      ? sourceOrder.items
      : [];
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === String(form.warehouseId));
  const warehouseLabel =
    selectedWarehouse
      ? `${selectedWarehouse.name}${selectedWarehouse.code ? ` (${selectedWarehouse.code})` : ""}`
      : sourceOrder.warehouseName || "-";

  const saveManualEdit = async () => {
    if (!form.warehouseId) {
      toast.error(tr("Warehouse is required"));
      return;
    }
    if (!form.platformStoreId) {
      toast.error(tr("Store is required"));
      return;
    }
    if (!form.orderNumber.trim()) {
      toast.error(tr("Order number is required"));
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch(`/return-orders/${order.id}/manual`, {
        ...form,
        warehouseId: Number(form.warehouseId),
        platformStoreId: Number(form.platformStoreId),
        orderNumber: form.orderNumber.trim(),
        returnId: form.returnId.trim(),
        buyerUsername: form.buyerUsername.trim(),
        buyerEmail: form.buyerEmail.trim(),
        returnReason: form.returnReason.trim(),
        returnReasonText: form.returnReasonText.trim(),
        warehousePackageNo: form.warehousePackageNo.trim(),
        trackingNumber: form.trackingNumber.trim(),
        localReturnTrackingNo: form.localReturnTrackingNo.trim(),
        logisticName: form.logisticName.trim(),
        remark: form.remark.trim(),
      });
      const updated = response.data || response || {};
      toast.success(tr("Manual return order updated"));
      onUpdated({ ...order, ...updated, ...form, id: order.id });
    } catch (error) {
      toast.error(error?.response?.data?.message || tr("Failed to update manual return order"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} width="max-w-5xl" closeOnBackdrop={false}>
      <div className="flex items-start justify-between border-b border-surface-border px-5 py-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">{tr("Edit Manual Return Order")}</h3>
          <p className="mt-1 text-xs text-slate-500">{getOrderDisplayNumber(order)}</p>
        </div>
        <button type="button" onClick={onClose} disabled={saving} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
          <X size={18} />
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FormField label="Select Warehouse" required>
            <input
              value={warehouseLabel}
              readOnly
              className={`${INPUT_CLASS} cursor-not-allowed bg-slate-50 text-slate-500`}
            />
          </FormField>
          <FormField label="Select Platform" required>
            <select
              value={form.platform}
              onChange={(event) => setForm((prev) => ({ ...prev, platform: event.target.value, platformStoreId: "" }))}
              className={INPUT_CLASS}
            >
              <option value="shopee">Shopee</option>
              <option value="tiktok">TikTok</option>
            </select>
          </FormField>
          <FormField label="Select Store" required>
            <select value={form.platformStoreId} onChange={(event) => setForm((prev) => ({ ...prev, platformStoreId: event.target.value }))} className={INPUT_CLASS}>
              <option value="">{tr("Store name here")}</option>
              {platformStores.map((storeOption) => (
                <option key={storeOption.id} value={storeOption.id}>
                  {storeOption.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Order Number" required>
            <input value={form.orderNumber} onChange={(event) => setForm((prev) => ({ ...prev, orderNumber: event.target.value }))} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Return ID">
            <input value={form.returnId} onChange={(event) => setForm((prev) => ({ ...prev, returnId: event.target.value }))} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Warehouse Package No.">
            <input value={form.warehousePackageNo} onChange={(event) => setForm((prev) => ({ ...prev, warehousePackageNo: event.target.value }))} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Buyer Username">
            <input value={form.buyerUsername} onChange={(event) => setForm((prev) => ({ ...prev, buyerUsername: event.target.value }))} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Buyer Email">
            <input value={form.buyerEmail} onChange={(event) => setForm((prev) => ({ ...prev, buyerEmail: event.target.value }))} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Tracking Number">
            <input value={form.trackingNumber} onChange={(event) => setForm((prev) => ({ ...prev, trackingNumber: event.target.value }))} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Additional Tracking Number">
            <input value={form.localReturnTrackingNo} onChange={(event) => setForm((prev) => ({ ...prev, localReturnTrackingNo: event.target.value }))} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Logistic Name">
            <input value={form.logisticName} onChange={(event) => setForm((prev) => ({ ...prev, logisticName: event.target.value }))} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Refund Currency">
            <input value={form.refundCurrency} onChange={(event) => setForm((prev) => ({ ...prev, refundCurrency: event.target.value }))} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Refund Total">
            <input type="number" min="0" value={form.refundTotal} onChange={(event) => setForm((prev) => ({ ...prev, refundTotal: event.target.value }))} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Return Type">
            <select value={form.returnType} onChange={(event) => setForm((prev) => ({ ...prev, returnType: event.target.value }))} className={INPUT_CLASS}>
              {RETURN_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {tr(option.label)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Return Reason">
            <input value={form.returnReason} onChange={(event) => setForm((prev) => ({ ...prev, returnReason: event.target.value }))} className={INPUT_CLASS} />
          </FormField>
        </div>
        <FormField label="Return Reason Text" className="mt-4">
          <input value={form.returnReasonText} onChange={(event) => setForm((prev) => ({ ...prev, returnReasonText: event.target.value }))} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Return Notes" className="mt-4">
          <input value={form.remark} onChange={(event) => setForm((prev) => ({ ...prev, remark: event.target.value }))} className={INPUT_CLASS} />
        </FormField>
        <p className="mt-4 rounded-lg border border-surface-border bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
          {tr("Product SKU information is not changed from this edit.")}
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border border-surface-border">
          <div className="flex items-center justify-between border-b border-surface-border bg-slate-50 px-4 py-3">
            <h4 className="text-sm font-bold text-slate-800">{tr("Product Information")}</h4>
            <span className="text-xs font-semibold text-slate-400">{tr("Read only")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-slate-800">
                  {["Image", "Product Name", "SKU", "Quantity"].map((header) => (
                    <th key={header} className="px-4 py-3 font-bold">{tr(header)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {detailLoading ? (
                  <tr>
                    <td colSpan={4} className="h-24 text-center text-slate-400">
                      <Loader2 size={14} className="mx-auto animate-spin text-primary" />
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="h-24 text-center text-slate-400">
                      {tr("No product information found")}
                    </td>
                  </tr>
                ) : (
                  products.map((item, index) => (
                    <tr key={item.id || item.sku || index}>
                      <td className="px-4 py-3">
                        <img
                          src={item.image || "https://placehold.co/36x36/E6ECF0/004368?text=?"}
                          alt={item.sku || item.productName || "SKU"}
                          className="h-9 w-9 rounded-md object-cover"
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-700">{item.productName || item.name || "-"}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{item.sku || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{item.quantity || item.qty || 1}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-surface-border px-5 py-4">
        <button type="button" onClick={onClose} disabled={saving} className={SECONDARY_BUTTON_CLASS}>
          {tr("Cancel")}
        </button>
        <button type="button" onClick={saveManualEdit} disabled={saving} className={PRIMARY_BUTTON_CLASS}>
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {tr("Saving...")}
            </>
          ) : (
            tr("Save")
          )}
        </button>
      </div>
    </ModalShell>
  );
}

function DeleteReturnModal({ order, onClose, onDeleted }) {
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTyped("");
  }, [order]);

  if (!order) return null;
  const expected = getOrderDisplayNumber(order);
  const canDelete = typed.trim() === expected;

  const confirmDelete = async () => {
    if (!canDelete) {
      toast.error(tr("Please type the correct order number"));
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/return-orders/${order.id}`, { data: { orderNumber: typed.trim() } });
      toast.success(tr("Return order deleted"));
      onDeleted(order.id);
    } catch (error) {
      toast.error(error?.response?.data?.message || tr("Failed to delete return order"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} width="max-w-sm">
      <div className="p-6">
        <h3 className="text-base font-bold text-slate-800">Delete Return Order</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Type the order number to confirm deletion. This action cannot be undone.
        </p>
        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm text-slate-700">{expected}</div>
        <input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder="Type order number here"
          className={`${INPUT_CLASS} mt-4`}
        />
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON_CLASS}>
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={!canDelete || deleting}
            className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Return Order"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ManualReturnOrderForm({ warehouses, stores, onBack, onSaved }) {
  const [form, setForm] = useState({
    warehouseId: "",
    platform: "shopee",
    platformStoreId: "",
    orderNumber: "",
    returnId: "",
    buyerUsername: "",
    buyerEmail: "",
    refundCurrency: "",
    refundTotal: "",
    returnReasonText: "",
    returnType: "by_logistic",
    warehousePackageNo: "",
    trackingNumber: "",
    localReturnTrackingNo: "",
    logisticName: "",
    remark: "",
  });
  const [lines, setLines] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupRaw, setLookupRaw] = useState(null);
  const [confirmingSave, setConfirmingSave] = useState(false);

  const platformStores = useMemo(
    () => stores.filter((item) => storeMatchesPlatform(item, form.platform)),
    [form.platform, stores]
  );

  const updateLineQty = (id, value) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, quantity: value === "" ? "" : Math.max(1, Number(value) || 1) } : line))
    );
  };

  const removeLine = (id) => {
    setLines((prev) => prev.filter((line) => line.id !== id));
  };

  const lookupOrderDetails = async () => {
    if (!form.warehouseId) {
      toast.error(tr("Warehouse is required"));
      return;
    }
    if (!form.platform) {
      toast.error(tr("Platform is required"));
      return;
    }
    if (!form.platformStoreId) {
      toast.error(tr("Store is required"));
      return;
    }
    if (!form.orderNumber.trim()) {
      toast.error(tr("Order number is required"));
      return;
    }
    setLookupLoading(true);
    try {
      const response = await api.post("/return-orders/manual/order-lookup", {
        platform: form.platform,
        platformStoreId: Number(form.platformStoreId),
        orderNumber: form.orderNumber.trim(),
      });
      const data = response.data || response;
      setLookupRaw(data.raw || null);
      setForm((prev) => ({
        ...prev,
        orderNumber: data.orderNumber || prev.orderNumber,
        returnId: prev.returnId || `manual-${data.platform || prev.platform}-${data.orderNumber || prev.orderNumber}`,
        buyerUsername: data.buyerUsername || prev.buyerUsername,
        buyerEmail: data.buyerEmail || prev.buyerEmail,
        refundCurrency: data.refundCurrency || prev.refundCurrency,
        refundTotal: data.refundTotal ?? prev.refundTotal,
        trackingNumber: data.trackingNumber || prev.trackingNumber,
        logisticName: data.logisticName || prev.logisticName,
      }));
      setLines((data.products || []).map((item) => ({
        id: item.id || `${item.merchantSkuId || item.sku}-${Date.now()}`,
        merchantSkuId: item.merchantSkuId || "",
        sku: item.sku || "",
        productName: item.productName || "Return product",
        image: item.image || "",
        quantity: item.quantity || 1,
        returnLineItemId: item.returnLineItemId,
        platformItemId: item.platformItemId,
        platformModelId: item.platformModelId,
      })));
      toast.success(tr("Order details loaded"));
    } catch (error) {
      toast.error(error?.response?.data?.message || tr("Failed to load order details"));
    } finally {
      setLookupLoading(false);
    }
  };

  const validateManualReturn = () => {
    if (!form.warehouseId) {
      return "Warehouse is required";
    }
    if (!form.orderNumber.trim()) {
      return "Order number is required";
    }
    if (!form.platform) {
      return "Platform is required";
    }
    if (!form.platformStoreId) {
      return "Store is required";
    }
    if (!form.returnId.trim()) {
      return "Return ID is required";
    }
    if (!form.refundCurrency.trim()) {
      return "Refund currency is required";
    }
    if (!form.returnReasonText.trim()) {
      return "Return reason text is required";
    }
    if (!form.remark.trim()) {
      return "Return notes are required";
    }
    if (!lines.length) {
      return "Select at least one merchant SKU";
    }
    const missingSku = lines.some((line) => !Number(line.merchantSkuId));
    if (missingSku) {
      return "Every return product needs a mapped merchant SKU";
    }
    const invalidQty = lines.some((line) => !Number.isInteger(Number(line.quantity)) || Number(line.quantity) <= 0);
    if (invalidQty) {
      return "Quantity must be a positive integer";
    }
    return "";
  };

  const requestSaveManualReturn = () => {
    const error = validateManualReturn();
    if (error) {
      toast.error(tr(error));
      return;
    }
    setConfirmingSave(true);
  };

  const saveManualReturn = async () => {
    setSaving(true);
    try {
      const response = await api.post("/return-orders/manual", {
        ...form,
        warehouseId: Number(form.warehouseId),
        platformStoreId: Number(form.platformStoreId),
        raw: lookupRaw,
        lines: lines.map((line) => ({
          merchantSkuId: Number(line.merchantSkuId),
          sku: line.sku,
          productName: line.productName,
          image: line.image,
          quantity: Number(line.quantity),
          returnLineItemId: line.returnLineItemId,
          platformItemId: line.platformItemId,
          platformModelId: line.platformModelId,
        })),
      });
      toast.success(tr("Manual return order saved"));
      setConfirmingSave(false);
      onSaved?.(getResponseData(response));
      onBack();
    } catch (error) {
      toast.error(error?.response?.data?.message || tr("Failed to save manual return order"));
    } finally {
      setSaving(false);
    }
  };

  const selectedStoreLabel = platformStores.find((storeOption) => storeOption.id === String(form.platformStoreId))?.label || "-";
  const selectedPlatformLabel = form.platform === "tiktok" ? "TikTok" : form.platform === "shopee" ? "Shopee" : form.platform || "-";

  return (
    <div className="space-y-4 font-body">
      <Topbar
        PageTitle={
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-slate-900">
            <ArrowLeft size={18} />
            {tr("Back to Return Order")}
          </button>
        }
      />

      <div className="rounded-xl border border-surface-border bg-white p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FormField label="Select Warehouse" required>
            <select
              value={form.warehouseId}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, warehouseId: event.target.value }));
                setLines([]);
              }}
              className={INPUT_CLASS}
            >
              <option value="">{tr("Warehouse name here")}</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}{warehouse.code ? ` (${warehouse.code})` : ""}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Select Platform" required>
            <select
              value={form.platform}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, platform: event.target.value, platformStoreId: "" }));
                setLines([]);
                setLookupRaw(null);
              }}
              className={INPUT_CLASS}
            >
              <option value="shopee">Shopee</option>
              <option value="tiktok">TikTok</option>
            </select>
          </FormField>
          <FormField label="Select Store" required>
            <select
              value={form.platformStoreId}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, platformStoreId: event.target.value }));
                setLines([]);
                setLookupRaw(null);
              }}
              className={INPUT_CLASS}
            >
              <option value="">{tr("Store name here")}</option>
              {platformStores.map((storeOption) => (
                <option key={storeOption.id} value={storeOption.id}>
                  {storeOption.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Order Number" required>
            <div className="flex gap-2">
              <input
                value={form.orderNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, orderNumber: event.target.value }))}
                placeholder={tr("Order number here")}
                className={INPUT_CLASS}
              />
              <button type="button" onClick={lookupOrderDetails} disabled={lookupLoading} className={PRIMARY_BUTTON_CLASS}>
                {lookupLoading ? tr("Searching...") : tr("Search")}
              </button>
            </div>
          </FormField>
          <FormField label="Return ID" required>
            <input
              required
              value={form.returnId}
              onChange={(event) => setForm((prev) => ({ ...prev, returnId: event.target.value }))}
              placeholder={tr("Return ID here")}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Warehouse Package No.">
            <input
              value={form.warehousePackageNo}
              onChange={(event) => setForm((prev) => ({ ...prev, warehousePackageNo: event.target.value }))}
              placeholder={tr("Warehouse package No. here")}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Buyer Username">
            <input
              value={form.buyerUsername}
              onChange={(event) => setForm((prev) => ({ ...prev, buyerUsername: event.target.value }))}
              placeholder={tr("Buyer username here")}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Buyer Email">
            <input
              value={form.buyerEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, buyerEmail: event.target.value }))}
              placeholder={tr("Buyer email here")}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Tracking Number">
            <input
              value={form.trackingNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, trackingNumber: event.target.value }))}
              placeholder={tr("Tracking number here")}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Additional Tracking Number">
            <input
              value={form.localReturnTrackingNo}
              onChange={(event) => setForm((prev) => ({ ...prev, localReturnTrackingNo: event.target.value }))}
              placeholder={tr("Additional tracking number here")}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Logistic Name">
            <input
              value={form.logisticName}
              onChange={(event) => setForm((prev) => ({ ...prev, logisticName: event.target.value }))}
              placeholder={tr("Logistic name here")}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Refund Currency" required>
            <input
              required
              value={form.refundCurrency}
              onChange={(event) => setForm((prev) => ({ ...prev, refundCurrency: event.target.value }))}
              placeholder={tr("Currency")}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Refund Total">
            <input
              type="number"
              min="0"
              value={form.refundTotal}
              onChange={(event) => setForm((prev) => ({ ...prev, refundTotal: event.target.value }))}
              placeholder={tr("Refund amount")}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Return Type">
            <select
              value={form.returnType}
              onChange={(event) => setForm((prev) => ({ ...prev, returnType: event.target.value }))}
              className={INPUT_CLASS}
            >
              {RETURN_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {tr(option.label)}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Return Reason Text" required className="mt-4">
          <input
            required
            value={form.returnReasonText}
            onChange={(event) => setForm((prev) => ({ ...prev, returnReasonText: event.target.value }))}
            placeholder={tr("Return reason text")}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Return Notes" required className="mt-4">
          <input
            required
            value={form.remark}
            onChange={(event) => setForm((prev) => ({ ...prev, remark: event.target.value }))}
            placeholder={tr("Return notes here")}
            className={INPUT_CLASS}
          />
        </FormField>
      </div>

      <div className="rounded-xl border border-surface-border bg-white">
        <div className="flex items-center justify-between border-b border-surface-border p-5">
          <h2 className="text-base font-bold text-slate-800">
            <span className="text-red-500">*</span>
            {tr("Product Information")}
          </h2>
          <button
            type="button"
            onClick={() => {
              if (!form.warehouseId) {
                toast.error(tr("Select a warehouse first"));
                return;
              }
              setPickerOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Plus size={14} />
            {tr("Select Merchant SKU")}
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-slate-800">
              {["Image", "Product Name", "SKU", "Quantity", "Action"].map((header) => (
                <th key={header} className="px-5 py-3 font-bold">{tr(header)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={5} className="h-28 text-center text-slate-400">
                  {tr("No items selected")}
                </td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-5 py-3">
                    <img
                      src={line.image || "https://placehold.co/36x36/E6ECF0/004368?text=?"}
                      alt={line.productName}
                      className="h-9 w-9 rounded-md object-cover"
                    />
                  </td>
                  <td className="px-5 py-3 text-slate-700">{line.productName}</td>
                  <td className="px-5 py-3">
                    <div className="font-mono text-slate-700">{line.sku || "-"}</div>
                    {!line.merchantSkuId ? (
                      <div className="mt-1 text-xs font-semibold text-orange-600">{tr("Mapping required")}</div>
                    ) : null}
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(event) => updateLineQty(line.id, event.target.value)}
                      className="h-9 w-24 rounded-lg border border-surface-border px-3 text-sm outline-none focus:border-primary"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onBack} className={SECONDARY_BUTTON_CLASS}>
          {tr("Cancel")}
        </button>
        <button type="button" onClick={requestSaveManualReturn} disabled={saving} className={PRIMARY_BUTTON_CLASS}>
          {tr("Save")}
        </button>
      </div>

      <ReturnSkuPickerModal
        open={pickerOpen}
        warehouseId={form.warehouseId}
        existingIds={lines.map((line) => String(line.merchantSkuId || line.id))}
        onClose={() => setPickerOpen(false)}
        onConfirm={(items) => {
          setLines((prev) => [...prev, ...items.map((item) => ({ ...item, merchantSkuId: item.merchantSkuId || item.id }))]);
          setPickerOpen(false);
        }}
      />

      {confirmingSave ? (
        <ModalShell onClose={() => !saving && setConfirmingSave(false)} width="max-w-md">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">{tr("Confirm Manual Return Order")}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {tr("Are you sure you want to save this manual return order?")}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-surface-border bg-slate-50 p-4 text-sm">
              <InfoLine label={tr("Platform")} value={selectedPlatformLabel} />
              <InfoLine label={tr("Store")} value={selectedStoreLabel} />
              <InfoLine label={tr("Order Number")} value={form.orderNumber || "-"} />
              <InfoLine label={tr("Products")} value={String(lines.length)} />
            </div>

            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
              {tr("This manual return will be added to the selected platform store and marked as Manual Add in the return order list.")}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmingSave(false)} disabled={saving} className={SECONDARY_BUTTON_CLASS}>
                {tr("Cancel")}
              </button>
              <button type="button" onClick={saveManualReturn} disabled={saving} className={PRIMARY_BUTTON_CLASS}>
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {tr("Saving...")}
                  </>
                ) : (
                  tr("Save Manual Return Order")
                )}
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

function ReturnSkuPickerModal({ open, warehouseId, existingIds, onClose, onConfirm }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [skus, setSkus] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [qtyById, setQtyById] = useState({});
  const [cache, setCache] = useState({});

  const loadSkus = useCallback(async () => {
    if (!open || !warehouseId) return;
    setLoading(true);
    try {
      const response = await api.get("/inbound/picker", {
        params: {
          warehouseId,
          search: search.trim() || undefined,
          page: 1,
          limit: 80,
        },
      });
      const nextSkus = getRows(response).map(normalizeSku);
      setSkus(nextSkus);
      setCache((prev) => {
        const next = { ...prev };
        nextSkus.forEach((sku) => {
          next[sku.id] = sku;
        });
        return next;
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || tr("Failed to load SKUs"));
    } finally {
      setLoading(false);
    }
  }, [open, search, warehouseId]);

  useEffect(() => {
    const timer = window.setTimeout(loadSkus, 250);
    return () => window.clearTimeout(timer);
  }, [loadSkus]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedIds([]);
      setQtyById({});
      setSkus([]);
    }
  }, [open]);

  if (!open) return null;

  const toggleSku = (sku) => {
    if (existingIds.map(String).includes(String(sku.id))) return;
    setSelectedIds((prev) => {
      if (prev.includes(sku.id)) return prev.filter((id) => id !== sku.id);
      setCache((current) => ({ ...current, [sku.id]: sku }));
      setQtyById((current) => ({ ...current, [sku.id]: current[sku.id] ?? 1 }));
      return [...prev, sku.id];
    });
  };

  const previewItems = selectedIds.map((id) => cache[id]).filter(Boolean);

  const confirm = () => {
    const invalid = previewItems.some((item) => !Number.isInteger(Number(qtyById[item.id])) || Number(qtyById[item.id]) <= 0);
    if (invalid) {
      toast.error(tr("Quantity must be a positive integer"));
      return;
    }
    onConfirm(
      previewItems.map((item) => ({
        ...item,
        quantity: Number(qtyById[item.id] || 1),
      }))
    );
  };

  return (
    <ModalShell onClose={onClose} width="max-w-5xl">
      <div className="border-b border-surface-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tr("Search merchant SKU from selected warehouse")}
              className={`${INPUT_CLASS} pl-9`}
            />
          </div>
          <button type="button" onClick={loadSkus} className={PRIMARY_BUTTON_CLASS}>
            {tr("Search")}
          </button>
        </div>
      </div>
      <div className="grid min-h-[300px] grid-cols-1 divide-y divide-surface-border md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="min-h-0">
          <h3 className="border-b border-surface-border px-5 py-3 text-sm font-bold text-slate-800">{tr("Select Merchant SKU")}</h3>
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-surface-border text-left text-slate-800">
                  {["Select", "Image", "Product Name", "SKU", "Warehouse Stock"].map((header) => (
                    <th key={header} className="px-4 py-2 font-bold">{tr(header)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center text-slate-400">
                      <Loader2 size={14} className="mx-auto animate-spin text-primary" />
                    </td>
                  </tr>
                ) : skus.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center text-slate-400">
                      {tr("No SKUs found")}
                    </td>
                  </tr>
                ) : (
                  skus.map((sku) => {
                    const checked = selectedIds.includes(sku.id);
                    const alreadySelected = existingIds.includes(sku.id);
                    return (
                      <tr
                        key={sku.id}
                        onClick={() => toggleSku(sku)}
                        className={`cursor-pointer hover:bg-slate-50 ${checked ? "bg-blue-50/70" : ""} ${alreadySelected ? "opacity-50" : ""}`}
                      >
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={checked || alreadySelected}
                            disabled={alreadySelected}
                            onChange={() => {}}
                            className="h-4 w-4 rounded accent-primary"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <img src={sku.image || "https://placehold.co/30x30/E6ECF0/004368?text=?"} alt={sku.sku} className="h-8 w-8 rounded object-cover" />
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-2 text-slate-700" title={sku.productName}>
                          {sku.productName}
                        </td>
                        <td className="px-4 py-2 font-mono text-slate-600">{sku.sku}</td>
                        <td className="px-4 py-2 text-slate-600">{sku.stock}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="min-h-0">
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-3">
            <h3 className="text-sm font-bold text-slate-800">{tr("Preview selection")}</h3>
            <button type="button" onClick={() => { setSelectedIds([]); setQtyById({}); }} className="text-xs font-semibold text-red-500">
              {tr("Clear all")}
            </button>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-border text-left text-slate-800">
                  {["Image", "Product Name", "SKU", "Quantity", "Action"].map((header) => (
                    <th key={header} className="px-4 py-2 font-bold">{tr(header)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {previewItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center text-slate-400">
                      {tr("No items selected")}
                    </td>
                  </tr>
                ) : (
                  previewItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">
                        <img src={item.image || "https://placehold.co/30x30/E6ECF0/004368?text=?"} alt={item.sku} className="h-8 w-8 rounded object-cover" />
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-2 text-slate-700">{item.productName}</td>
                      <td className="px-4 py-2 font-mono text-slate-600">{item.sku}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="1"
                          value={qtyById[item.id] ?? 1}
                          onChange={(event) =>
                            setQtyById((prev) => ({
                              ...prev,
                              [item.id]: event.target.value === "" ? "" : Math.max(1, Number(event.target.value) || 1),
                            }))
                          }
                          className="h-8 w-20 rounded-lg border border-surface-border px-2 outline-none focus:border-primary"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => setSelectedIds((prev) => prev.filter((id) => id !== item.id))}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t border-surface-border px-5 py-4">
        <button type="button" onClick={onClose} className={SECONDARY_BUTTON_CLASS}>
          Cancel
        </button>
        <button type="button" onClick={confirm} disabled={previewItems.length === 0} className={PRIMARY_BUTTON_CLASS}>
          Confirm
        </button>
      </div>
    </ModalShell>
  );
}

function ReturnOrderDetails({ orderId, warehouses, stores = [], onBack, onOrderUpdated, onOrderDeleted }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/return-orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || tr("Failed to load return order details"));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  return (
    <div className="space-y-4 font-body">
      <Topbar
        PageTitle={
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-slate-900">
            <ArrowLeft size={18} />
            Back to Return Order
          </button>
        }
      />

      {loading ? (
        <ReturnOrderDetailsSkeleton />
      ) : !order ? (
        <div className="rounded-xl border border-surface-border bg-white p-10 text-center text-slate-400">
          Return order not found
        </div>
      ) : (
        (() => {
          const orderRegion = getReturnOrderRegion(order, stores);

          return (
        <>
          <div className="rounded-xl border border-surface-border bg-white p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Return Order Details</h2>
                <p className="mt-1 text-sm text-slate-500">{getOrderDisplayNumber(order)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoBox label="Platform" value={order.platformLabel || order.platform} />
              <InfoBox label="Store" value={order.storeName || "-"} />
              <InfoBox label="Warehouse" value={order.warehouseName || "-"} />
              <InfoBox label="Return ID" value={order.returnId || order.platformReturnId || "-"} />
              <InfoBox label="Order Number" value={getOrderDisplayNumber(order)} />
              <InfoBox label="Return Status" value={getStatusLabel(order.returnStatus)} />
              <InfoBox label="Platform Status" value={order.platformStatusLabel || "-"} />
              <InfoBox label="Return Type" value={getReturnTypeLabel(order.returnType) || "-"} />
              <InfoBox label="Return Tracking Number" value={order.trackingNo || "-"} />
              <InfoBox label="Additional Tracking Number" value={order.localReturnTrackingNo || "-"} valueClassName={order.localReturnTrackingNo ? "text-orange-600" : ""} />
              <InfoBox label="Logistic Name" value={order.logisticName || "-"} />
              <InfoBox label="Buyer Username" value={order.buyerUsername || "-"} />
              <InfoBox label="Buyer Email" value={order.buyerEmail || "-"} />
              <InfoBox label="Return Reason" value={order.returnReasonText || order.returnReason || "-"} />
              <InfoBox label="Refund Total" value={order.refundTotal ? `${order.refundCurrency || ""} ${order.refundTotal}` : "-"} />
              <InfoBox label="Platform Created" value={formatDateTime(order.platformCreatedAt || order.createdAt, orderRegion)} />
              <InfoBox label="Platform Updated" value={formatDateTime(order.platformUpdatedAt || order.updatedAt, orderRegion)} />
            </div>
            {order.remark ? (
              <div className="mt-4 rounded-lg border border-surface-border bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">Remark</p>
                <p className="mt-1 text-sm text-slate-700">{order.remark}</p>
              </div>
            ) : null}
            {(order.returnImages || []).length > 0 ? (
              <div className="mt-4 rounded-lg border border-surface-border bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-400">Return Images</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {order.returnImages.map((imageUrl, index) => (
                    <a key={`${imageUrl}-${index}`} href={imageUrl} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={imageUrl}
                        alt={`Return ${index + 1}`}
                        className="h-20 w-20 rounded-lg border border-surface-border bg-white object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-surface-border bg-white">
            <h3 className="border-b border-surface-border px-5 py-4 text-base font-bold text-slate-800">Product Information</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-slate-800">
                  {["Image", "Product Name", "SKU", "Quantity", "Refund"].map((header) => (
                    <th key={header} className="px-5 py-3 font-bold">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {(order.products || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center text-slate-400">
                      No product information found
                    </td>
                  </tr>
                ) : (
                  order.products.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3">
                        <img src={item.image || "https://placehold.co/36x36/E6ECF0/004368?text=?"} alt={item.sku} className="h-9 w-9 rounded-md object-cover" />
                      </td>
                      <td className="px-5 py-3 text-slate-700">{item.productName}</td>
                      <td className="px-5 py-3 font-mono text-slate-700">{item.sku}</td>
                      <td className="px-5 py-3 text-slate-700">{item.quantity}</td>
                      <td className="px-5 py-3 text-slate-700">
                        {item.refundTotal ? `${item.refundCurrency || ""} ${item.refundTotal}` : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PlatformInformation order={order} />

        </>
          );
        })()
      )}
    </div>
  );
}

function ReturnOrderDetailsSkeleton() {
  const blocks = Array.from({ length: 16 });
  const rows = Array.from({ length: 4 });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-surface-border bg-white p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="space-y-2">
            <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {blocks.map((_, index) => (
            <div key={index} className="rounded-lg border border-surface-border bg-slate-50 px-4 py-3">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-4 w-32 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-border bg-white">
        <div className="border-b border-surface-border px-5 py-4">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left">
              {["Image", "Product Name", "SKU", "Quantity", "Refund"].map((header) => (
                <th key={header} className="px-5 py-3">
                  <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {rows.map((_, index) => (
              <tr key={index}>
                <td className="px-5 py-3"><div className="h-9 w-9 animate-pulse rounded-md bg-slate-200" /></td>
                <td className="px-5 py-3"><div className="h-4 w-64 animate-pulse rounded bg-slate-200" /></td>
                <td className="px-5 py-3"><div className="h-4 w-20 animate-pulse rounded bg-slate-200" /></td>
                <td className="px-5 py-3"><div className="h-4 w-12 animate-pulse rounded bg-slate-200" /></td>
                <td className="px-5 py-3"><div className="h-4 w-20 animate-pulse rounded bg-slate-200" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModalShell({ children, onClose, width = "max-w-lg", closeOnBackdrop = true }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.35)", backdropFilter: "blur(3px)" }}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className={`relative max-h-[92vh] w-full overflow-auto rounded-2xl bg-white shadow-xl ${width}`}>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, required = false, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
        {required ? <span className="text-red-500">*</span> : null}
        {tr(label)}
      </span>
      {children}
    </label>
  );
}

function InfoBox({ label, value, valueClassName = "text-slate-700" }) {
  return (
    <div className="rounded-lg border border-surface-border bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-sm font-semibold ${valueClassName}`}>{value || "-"}</p>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold text-slate-800" title={value}>
        {value || "-"}
      </span>
    </div>
  );
}
