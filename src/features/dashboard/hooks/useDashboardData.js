import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";
import platformApi from "../../../lib/platformApi";
import { useShopPlatformStore } from "../../../stores/shopPlatformStore";

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

const formatNumber = (value) => Number(value || 0).toLocaleString();
const PAGE_LIMIT = 100;

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

const buildStoreContext = (store) => ({
  platform: String(store?.platform || "").toLowerCase(),
  shopId: store?.store_shop_id ?? store?.shop_id ?? store?.external_store_id ?? "",
  openId: store?.store_open_id ?? store?.open_id ?? store?.platform_open_id ?? "",
  cipher: store?.store_cipher ?? store?.cipher ?? store?.platform_cipher ?? "",
});

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

const statusGroupsByPlatform = {
  shopee: {
    pending: ["READY_TO_SHIP"],
    processing: ["PROCESSED"],
    shipped: ["SHIPPED"],
    completed: ["COMPLETED"],
    cancelled: ["CANCELLED"],
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
  if (key) totals[key] += Number(count || 0);
};

const collectOrderCounts = (payload, totals, platform) => {
  const counts = payload?.order_counts ?? payload?.orderCounts ?? payload?.counts ?? payload;
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) return false;

  Object.entries(counts).forEach(([status, count]) => {
    addCountItem(totals, status, count, platform);
  });

  return true;
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
  const stores = useShopPlatformStore((state) => state.stores);
  const [platformStores, setPlatformStores] = useState([]);
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

  const fetchPlatformStores = useCallback(async () => {
    try {
      const rows = await fetchAllPlatformStores();
      setPlatformStores(rows);
    } catch (err) {
      console.error("Dashboard platform stores failed", err);
      setPlatformStores([]);
    }
  }, []);

  const fetchOrderStatus = useCallback(async () => {
    const sourceStores = platformStores.length ? platformStores : stores;
    const countStores = sourceStores
      .map(buildStoreContext)
      .filter((store) => ["shopee", "tiktok"].includes(store.platform));

    if (countStores.length === 0) {
      setOrderStatusData(emptyOrderStatus());
      setOrderStatusLoading(false);
      return;
    }

    setOrderStatusLoading(true);

    const timeFrom = toUnixSeconds(orderStatusDateRange.startDate);
    const timeTo = toUnixSeconds(orderStatusDateRange.endDate, true);
    const totals = emptyOrderStatus().reduce((acc, item) => ({ ...acc, [item.key]: 0 }), {});

    await Promise.all(
      countStores.map(async (store) => {
        try {
          if (store.platform === "shopee" && store.shopId) {
            const response = await platformApi.get("/new-shopee-open-shop/api/dev/order/get-order-count", {
              params: {
                shopId: store.shopId,
                timeFrom,
                timeTo,
              },
            });
            collectStatusCounts(unwrapCountPayload(response), totals, store.platform);
          }

          if (store.platform === "tiktok" && store.openId && store.cipher) {
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

    setOrderStatusData(orderStatusTemplate.map((item) => ({ ...item, value: totals[item.key] || 0 })));
    setOrderStatusLoading(false);
  }, [orderStatusDateRange.endDate, orderStatusDateRange.startDate, platformStores, stores]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchPlatformStores();
  }, [fetchPlatformStores]);

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
