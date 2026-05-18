import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

const formatNumber = (value) => Number(value || 0).toLocaleString();

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

const defaultOrderStatus = [
  { name: "Pending Orders", value: 220, color: "#F59E0B" },
  { name: "Processing Orders", value: 180, color: "#3B82F6" },
  { name: "Shipped Orders", value: 310, color: "#8B5CF6" },
  { name: "Completed Orders", value: 420, color: "#22C55E" },
  { name: "Cancelled Orders", value: 80, color: "#EF4444" },
];

export function useDashboardData() {
  const [summary, setSummary] = useState(defaultSummary);
  const [inventoryData, setInventoryData] = useState(
    emptyDailyRows(currentYear, currentMonth, { stockIn: 0, stockOut: 0 })
  );
  const [salesTrendsData, setSalesTrendsData] = useState(
    emptyDailyRows(currentYear, currentMonth, { sales: 0, quantity: 0, orders: 0 })
  );

  const [inventoryYear, setInventoryYear] = useState(currentYear);
  const [inventoryMonth, setInventoryMonth] = useState(currentMonth);
  const [salesYear, setSalesYear] = useState(currentYear);
  const [salesMonth, setSalesMonth] = useState(currentMonth);
  const [salesPlatform, setSalesPlatform] = useState("all");

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);

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

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchInventoryStatus();
  }, [fetchInventoryStatus]);

  useEffect(() => {
    fetchSalesTrends();
  }, [fetchSalesTrends]);

  const kpiCards = useMemo(
    () => [
      {
        id: "total_products",
        label: "Total Products",
        value: formatNumber(summary.totalProducts),
        icon: "product-management",
        color: "#3B82F6",
        bg: "#EFF6FF",
      },
      {
        id: "today_orders",
        label: "Today Orders",
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
    orderStatusData: defaultOrderStatus,
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
