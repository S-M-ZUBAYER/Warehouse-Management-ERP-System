const toDateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().split("T")[0] : "";
};

const dateInputToSeconds = (value, endOfDay = false) => {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59)
    : new Date(year, month - 1, day, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
};

export const dashboardOrderStatusTargets = {
  pending: {
    path: "/warehouse_management/orders/processing/new_order",
    tab: "To Pack",
  },
  processing: {
    path: "/warehouse_management/orders/processing/processed",
    tab: "Pushing",
  },
  shipped: {
    path: "/warehouse_management/orders/processing/shipped",
    showAllShopeeShipped: true,
  },
  completed: {
    path: "/warehouse_management/orders/processing/completed",
  },
  cancelled: {
    path: "/warehouse_management/orders/processing/canceled",
    tab: "Cancelled",
  },
};

export const buildDashboardOrderStatusNavigation = (statusKey, dateRange = {}) => {
  const target = dashboardOrderStatusTargets[statusKey];
  if (!target) return null;

  const startDate = toDateInput(dateRange.startDate);
  const endDate = toDateInput(dateRange.endDate);
  const query = new URLSearchParams();

  if (target.tab) query.set("tab", target.tab);
  if (target.showAllShopeeShipped) query.set("showAllShopeeShipped", "1");
  if (startDate) query.set("start", startDate);
  if (endDate) query.set("end", endDate);

  return {
    pathname: target.path,
    search: query.toString() ? `?${query.toString()}` : "",
    state: {
      dashboardOrderStatus: {
        tab: target.tab || "",
        showAllShopeeShipped: target.showAllShopeeShipped === true,
        startDate,
        endDate,
      },
    },
  };
};

export const getDashboardOrderStatusFilter = (location = {}) => {
  const params = new URLSearchParams(location.search || "");
  const state = location.state?.dashboardOrderStatus || {};
  const tab = params.get("tab") || state.tab || "";
  const showAllShopeeShipped = params.get("showAllShopeeShipped") === "1" || state.showAllShopeeShipped === true;
  const startDate = params.get("start") || state.startDate || "";
  const endDate = params.get("end") || state.endDate || "";
  const start = dateInputToSeconds(startDate);
  const end = dateInputToSeconds(endDate, true);

  return {
    tab,
    showAllShopeeShipped,
    dateRange: start && end && start <= end ? { start, end } : undefined,
    datePreset: start && end && start <= end ? "custom" : undefined,
  };
};
