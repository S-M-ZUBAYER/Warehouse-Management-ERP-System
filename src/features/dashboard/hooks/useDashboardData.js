import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../../lib/api";
import platformApi from "../../../lib/platformApi";

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

const formatNumber = (value) => Number(value || 0).toLocaleString();
const PAGE_LIMIT = 100;
const SECONDS_IN_DAY = 24 * 60 * 60;
const SHOPEE_MAX_RANGE_SECONDS = 15 * SECONDS_IN_DAY - 60;

const emptyDailyRows = (year = currentYear, month = currentMonth, defaults = {}) => {
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    return {
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      label: String(day).padStart(2, "0"),
      ...defaults,
    };
  });
};

const defaultSummary = {
  totalProducts: 0,
  todayOrders: 0,
  totalStockUnits: 0,
  lowStock: 0,
  outOfStock: 0,
  platforms: [],
};

const orderStatusTemplate = [
  { key: "pending", name: "Pending Orders", color: "#F59E0B" },
  { key: "processing", name: "Processing Orders", color: "#3B82F6" },
  { key: "shipped", name: "Shipped Orders", color: "#8B5CF6" },
  { key: "completed", name: "Completed Orders", color: "#22C55E" },
  { key: "cancelled", name: "Cancelled Orders", color: "#EF4444" },
];

const emptyOrderStatus = () => orderStatusTemplate.map((item) => ({ ...item, value: 0 }));

const formatDate = (date) => date.toISOString().split("T")[0];

const defaultOrderDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { startDate: formatDate(start), endDate: formatDate(end) };
};

const toUnixSeconds = (dateText, endOfDay = false) => {
  const date = new Date(`${dateText}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  const time = date.getTime();
  return Number.isFinite(time) ? Math.floor(time / 1000) : Math.floor(Date.now() / 1000);
};

const normalizePlatform = (platform) => {
  const value = String(platform || "").toLowerCase();
  if (value.includes("shopee")) return "shopee";
  if (value.includes("tik")) return "tiktok";
  return value;
};

const buildStoreContext = (store) => ({
  platform: normalizePlatform(store?.platform),
  shopId: store?.store_shop_id ?? store?.shop_id ?? store?.external_store_id ?? "",
  openId: store?.store_open_id ?? store?.open_id ?? store?.platform_open_id ?? "",
  cipher: store?.store_cipher ?? store?.cipher ?? store?.platform_cipher ?? "",
});

const isOrderCountStore = (store) => {
  if (store.platform === "shopee") return Boolean(store.shopId);
  if (store.platform === "tiktok") return Boolean(store.openId && store.cipher);
  return false;
};

const getOrderCountStores = (stores = []) =>
  (Array.isArray(stores) ? stores : [])
    .map(buildStoreContext)
    .filter((store) => ["shopee", "tiktok"].includes(store.platform))
    .filter(isOrderCountStore);

const unwrapPlatformStores = (res) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const fetchAllPlatformStores = async () => {
  const allStores = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await api.get("/platform-stores", { params: { page, limit: PAGE_LIMIT } });
    const rows = unwrapPlatformStores(res);
    allStores.push(...rows);
    totalPages = res?.pagination?.totalPages || res?.data?.pagination?.totalPages || (rows.length === PAGE_LIMIT ? page + 1 : page);
    page += 1;
  } while (page <= totalPages && page <= 100);

  return allStores;
};

const unwrapCountPayload = (response) =>
  response?.data?.response ??
  response?.data?.data ??
  response?.body?.response ??
  response?.body?.data ??
  response?.response ??
  response?.data ??
  response?.body ??
  response ??
  {};

const splitDateRange = (start, end, maxRangeSeconds) => {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return [];

  const windows = [];
  let cursor = start;

  while (cursor <= end) {
    const windowEnd = Math.min(cursor + maxRangeSeconds, end);
    windows.push({ start: cursor, end: windowEnd });
    cursor = windowEnd + 1;
  }

  return windows;
};

const statusGroupsByPlatform = {
  shopee: {
    pending: ["READY_TO_SHIP"],
    processing: ["PROCESSED"],
    shipped: ["SHIPPED"],
    completed: ["COMPLETED"],
    cancelled: ["IN_CANCEL", "CANCELLED"],
  },
  tiktok: {
    pending: ["AWAITING_SHIPMENT"],
    processing: ["AWAITING_COLLECTION"],
    shipped: ["DELIVERED"],
    completed: ["COMPLETED"],
    cancelled: ["CANCEL", "CANCELLED"],
  },
};

const normalizeStatusKey = (status, platform) => {
  const value = String(status || "").toUpperCase().replace(/[\s-]+/g, "_");
  const statusGroups = statusGroupsByPlatform[platform] || {};
  const exactMatch = Object.entries(statusGroups).find(([, statuses]) => statuses.includes(value))?.[0];
  return exactMatch || "";
};

const getCountValue = (item) =>
  Number(
    item?.count ??
      item?.orderCount ??
      item?.order_count ??
      item?.total ??
      item?.totalCount ??
      item?.total_count ??
      item?.value ??
      0
  ) || 0;

const addCountItem = (totals, status, count, platform) => {
  const key = normalizeStatusKey(status, platform);
  if (!key) return false;
  totals[key] += Number(count || 0);
  return true;
};

const collectOrderCounts = (payload, totals, platform) => {
  const counts = payload?.order_counts ?? payload?.orderCounts ?? payload?.counts ?? payload;
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) return false;

  let collected = false;
  Object.entries(counts).forEach(([status, count]) => {
    collected = addCountItem(totals, status, count, platform) || collected;
  });

  return collected;
};

const collectStatusCounts = (payload, totals, platform) => {
  if (!payload) return;

  if (collectOrderCounts(payload, totals, platform)) return;

  if (Array.isArray(payload)) {
    payload.forEach((item) => {
      if (item && typeof item === "object") {
        addCountItem(
          totals,
          item.status ?? item.orderStatus ?? item.order_status ?? item.name ?? item.label,
          getCountValue(item),
          platform
        );
        collectStatusCounts(item.counts ?? item.statusCounts ?? item.status_counts, totals, platform);
      }
    });
    return;
  }

  if (typeof payload !== "object") return;

  Object.entries(payload).forEach(([key, value]) => {
    if (typeof value === "number" || typeof value === "string") {
      addCountItem(totals, key, Number(value), platform);
      return;
    }

    if (Array.isArray(value)) {
      collectStatusCounts(value, totals, platform);
      return;
    }

    if (value && typeof value === "object") {
      addCountItem(
        totals,
        value.status ?? value.orderStatus ?? value.order_status ?? key,
        getCountValue(value),
        platform
      );
      collectStatusCounts(value, totals, platform);
    }
  });
};

export function useDashboardData() {
  const orderStatusStoresRef = useRef([]);
  const orderStatusStoresPromiseRef = useRef(null);
  const orderStatusRequestIdRef = useRef(0);
  const [summary, setSummary] = useState(defaultSummary);
  const [inventoryData, setInventoryData] = useState(
    emptyDailyRows(currentYear, currentMonth, { stockIn: 0, stockOut: 0 })
  );
  const [salesTrendsData, setSalesTrendsData] = useState(
    emptyDailyRows(currentYear, currentMonth, { sales: 0, quantity: 0, orders: 0 })
  );
  const [orderStatusData, setOrderStatusData] = useState(emptyOrderStatus);
  const [orderStatusDateRange, setOrderStatusDateRange] = useState(defaultOrderDateRange);

  const [inventoryYear, setInventoryYear] = useState(currentYear);
  const [inventoryMonth, setInventoryMonth] = useState(currentMonth);
  const [salesYear, setSalesYear] = useState(currentYear);
  const [salesMonth, setSalesMonth] = useState(currentMonth);
  const [salesPlatform, setSalesPlatform] = useState("all");

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [orderStatusLoading, setOrderStatusLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await api.get("/dashboard/summary");
      setSummary({ ...defaultSummary, ...(res?.data || {}) });
    } catch (err) {
      console.error("Dashboard summary failed", err);
      setSummary(defaultSummary);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchInventoryStatus = useCallback(async () => {
    setInventoryLoading(true);
    try {
      const res = await api.get("/dashboard/inventory-status", {
        params: { year: inventoryYear, month: inventoryMonth },
      });
      setInventoryData(
        res?.data?.data?.length
          ? res.data.data
          : emptyDailyRows(inventoryYear, inventoryMonth, { stockIn: 0, stockOut: 0 })
      );
    } catch (err) {
      console.error("Dashboard inventory status failed", err);
      setInventoryData(emptyDailyRows(inventoryYear, inventoryMonth, { stockIn: 0, stockOut: 0 }));
    } finally {
      setInventoryLoading(false);
    }
  }, [inventoryYear, inventoryMonth]);

  const fetchSalesTrends = useCallback(async () => {
    setSalesLoading(true);
    try {
      const res = await api.get("/dashboard/sales-trends", {
        params: {
          year: salesYear,
          month: salesMonth,
          platform: salesPlatform === "all" ? "" : salesPlatform,
        },
      });
      setSalesTrendsData(
        res?.data?.data?.length
          ? res.data.data
          : emptyDailyRows(salesYear, salesMonth, { sales: 0, quantity: 0, orders: 0 })
      );
    } catch (err) {
      console.error("Dashboard sales trends failed", err);
      setSalesTrendsData(emptyDailyRows(salesYear, salesMonth, { sales: 0, quantity: 0, orders: 0 }));
    } finally {
      setSalesLoading(false);
    }
  }, [salesYear, salesMonth, salesPlatform]);

  const loadOrderStatusStores = useCallback(async () => {
    if (orderStatusStoresRef.current.length > 0) return orderStatusStoresRef.current;

    if (!orderStatusStoresPromiseRef.current) {
      orderStatusStoresPromiseRef.current = fetchAllPlatformStores()
        .then((rows) => {
          orderStatusStoresRef.current = rows;
          return rows;
        })
        .finally(() => {
          orderStatusStoresPromiseRef.current = null;
        });
    }

    return orderStatusStoresPromiseRef.current;
  }, []);

  const fetchOrderStatus = useCallback(async () => {
    const requestId = orderStatusRequestIdRef.current + 1;
    orderStatusRequestIdRef.current = requestId;
    setOrderStatusLoading(true);

    try {
      let countStores = getOrderCountStores(orderStatusStoresRef.current);

      if (countStores.length === 0) {
        const fullStores = await loadOrderStatusStores();
        countStores = getOrderCountStores(fullStores);
      }

      if (countStores.length === 0) {
        if (orderStatusRequestIdRef.current === requestId) {
          setOrderStatusData(emptyOrderStatus());
        }
        return;
      }

      const timeFrom = toUnixSeconds(orderStatusDateRange.startDate);
      const timeTo = toUnixSeconds(orderStatusDateRange.endDate, true);
      const shopeeWindows = splitDateRange(timeFrom, timeTo, SHOPEE_MAX_RANGE_SECONDS);
      const totals = emptyOrderStatus().reduce((acc, item) => ({ ...acc, [item.key]: 0 }), {});

      await Promise.all(
        countStores.map(async (store) => {
          try {
            if (store.platform === "shopee") {
              for (const windowRange of shopeeWindows) {
                const response = await platformApi.get("/new-shopee-open-shop/api/dev/order/get-order-count", {
                  params: {
                    shopId: store.shopId,
                    timeFrom: windowRange.start,
                    timeTo: windowRange.end,
                  },
                });
                collectStatusCounts(unwrapCountPayload(response), totals, store.platform);
              }
            }

            if (store.platform === "tiktok") {
              const response = await platformApi.get("/tiktokshop-partner-country/api/dev/order/get-order-count", {
                params: {
                  openId: store.openId,
                  cipher: store.cipher,
                  createTimeGe: timeFrom,
                  createTimeLt: timeTo,
                },
              });
              collectStatusCounts(unwrapCountPayload(response), totals, store.platform);
            }

            return null;
          } catch (err) {
            console.error(`Dashboard ${store.platform} order count failed`, err);
            return null;
          }
        })
      );

      if (orderStatusRequestIdRef.current === requestId) {
        setOrderStatusData(orderStatusTemplate.map((item) => ({ ...item, value: totals[item.key] || 0 })));
      }
    } catch (err) {
      if (orderStatusRequestIdRef.current === requestId) {
        console.error("Dashboard order status failed", err);
        setOrderStatusData(emptyOrderStatus());
      }
    } finally {
      if (orderStatusRequestIdRef.current === requestId) {
        setOrderStatusLoading(false);
      }
    }
  }, [loadOrderStatusStores, orderStatusDateRange.endDate, orderStatusDateRange.startDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchInventoryStatus();
  }, [fetchInventoryStatus]);

  useEffect(() => {
    fetchSalesTrends();
  }, [fetchSalesTrends]);

  useEffect(() => {
    fetchOrderStatus();
  }, [fetchOrderStatus]);

  const kpiCards = useMemo(
    () => [
      {
        id: "total_products",
        label: "Total Platform Products",
        value: formatNumber(summary.totalProducts),
        icon: "product-management",
        color: "#3B82F6",
        bg: "#EFF6FF",
      },
      {
        id: "today_orders",
        label: "Today's Orders",
        value: formatNumber(summary.todayOrders),
        icon: "cart",
        color: "#22C55E",
        bg: "#F0FDF4",
      },
      {
        id: "low_stock",
        label: "Low Stock",
        value: formatNumber(summary.lowStock),
        icon: "alert",
        color: "#F59E0B",
        bg: "#FFFBEB",
      },
      {
        id: "out_of_stock",
        label: "Out of Stock",
        value: formatNumber(summary.outOfStock),
        icon: "out-of-stock",
        color: "#EF4444",
        bg: "#FEF2F2",
      },
    ],
    [summary]
  );

  const platforms = useMemo(() => {
    const apiPlatforms = (summary.platforms || []).filter(Boolean);
    return ["all", ...apiPlatforms.filter((p, i) => apiPlatforms.indexOf(p) === i)];
  }, [summary.platforms]);

  const years = useMemo(() => {
    const start = currentYear - 3;
    const end = currentYear + 1;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, []);

  return {
    loading: summaryLoading,
    kpiCards,
    inventoryData,
    orderStatusData,
    orderStatusLoading,
    orderStatusDateRange,
    setOrderStatusDateRange,
    salesTrendsData,
    platforms,
    years,
    inventoryLoading,
    salesLoading,
    inventoryYear,
    inventoryMonth,
    setInventoryYear,
    setInventoryMonth,
    salesYear,
    salesMonth,
    salesPlatform,
    setSalesYear,
    setSalesMonth,
    setSalesPlatform,
  };
}
