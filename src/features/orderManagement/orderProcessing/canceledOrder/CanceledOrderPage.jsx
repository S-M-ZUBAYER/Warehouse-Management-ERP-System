import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { Calendar, X } from "lucide-react";
import { useMemo } from "react";
import Topbar from "../../../../components/layout/Topbar";
import OrderProcessingFilterBar from "../../shared/components/OrderProcessingFilterBar";
import OrderTable from "../../shared/components/OrderTable";
import OrderFooter from "../../shared/components/OrderFooter";
import { useOrderList } from "../../shared/hooks/useOrderList";
import {
  formatDateInput,
  getDateRangeLabel,
  getPresetRange,
} from "../../shared/components/OrderDateRangePicker";
import { fetchCanceledOrderTabCounts, getStoredOrderListReturnState, setOrderDetailReturnContext } from "../../shared/utils/orderApi";
import { getDashboardOrderStatusFilter } from "../utils/dashboardOrderStatusFilter";

const SUB_TABS = [
  { label: "All", count: "00" },
  { label: "Cancelation Request", count: "00" },
  { label: "Cancelled", count: "00" },
];

const dateInputToSeconds = (value, endOfDay = false) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59)
    : new Date(year, month - 1, day, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
};

export default function CanceledOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const dashboardFilter = useMemo(
    () => getDashboardOrderStatusFilter(location),
    [location.search, location.state]
  );
  const restoredPageState = useMemo(
    () => getStoredOrderListReturnState({ pathname: location.pathname, navigationType, pageType: "canceled" }),
    [location.pathname, navigationType]
  );
  const [activeTab, setActiveTab] = useState(() =>
    SUB_TABS.some((tab) => tab.label === restoredPageState.activeTab)
      ? restoredPageState.activeTab
      : SUB_TABS.some((tab) => tab.label === dashboardFilter.tab)
        ? dashboardFilter.tab
        : "All"
  );
  const [datePreset, setDatePreset] = useState(() => restoredPageState.datePreset || dashboardFilter.datePreset || "last_7_days");
  const [dateRange, setDateRange] = useState(() => restoredPageState.dateRange || dashboardFilter.dateRange || getPresetRange("last_7_days"));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [customStart, setCustomStart] = useState(() => formatDateInput(dateRange.start));
  const [customEnd, setCustomEnd] = useState(() => formatDateInput(dateRange.end));
  const list = useOrderList({ pageType: "canceled", activeTab, datePreset, dateRange });
  const { data: tabCounts = {} } = useQuery({
    queryKey: [
      "order-management",
      "canceled-order-tab-counts",
      list.storeContext,
      list.appliedSearch,
      list.appliedSearchType,
      list.appliedSkuType,
      dateRange.start,
      dateRange.end,
    ],
    queryFn: () =>
      fetchCanceledOrderTabCounts({
        context: list.storeContext,
        search: list.appliedSearch,
        searchType: list.appliedSearchType,
        skuType: list.appliedSkuType,
        dateRange,
        tabs: SUB_TABS.map((tab) => tab.label),
      }),
    enabled: list.hasStore,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!restoredPageState.activeTab && SUB_TABS.some((tab) => tab.label === dashboardFilter.tab)) {
      setActiveTab(dashboardFilter.tab);
    }

    if (!restoredPageState.dateRange && dashboardFilter.dateRange) {
      setDatePreset(dashboardFilter.datePreset || "custom");
      setDateRange(dashboardFilter.dateRange);
      setCustomStart(formatDateInput(dashboardFilter.dateRange.start));
      setCustomEnd(formatDateInput(dashboardFilter.dateRange.end));
    }
  }, [dashboardFilter, restoredPageState.activeTab, restoredPageState.dateRange]);

  const dateLabel = useMemo(() => getDateRangeLabel(datePreset, dateRange), [datePreset, dateRange]);

  const applyPreset = (preset) => {
    const nextRange = getPresetRange(preset);
    setDatePreset(preset);
    setDateRange(nextRange);
    setCustomStart(formatDateInput(nextRange.start));
    setCustomEnd(formatDateInput(nextRange.end));
    setDatePickerOpen(false);
  };

  const applyCustomRange = () => {
    const start = dateInputToSeconds(customStart);
    const end = dateInputToSeconds(customEnd, true);
    if (!start || !end || start > end) return;
    setDatePreset("custom");
    setDateRange({ start, end });
    setDatePickerOpen(false);
  };

  const handleDetails = (order) => {
    list.cacheOrderForDetail(order);
    setOrderDetailReturnContext({
      fromPath: location.pathname,
      orderId: order.id,
    });
    navigate(`/warehouse_management/orders/detail/${encodeURIComponent(order.id)}`, {
      state: { order, fromPath: location.pathname },
    });
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Order Processing" />
      <OrderProcessingFilterBar {...list} />

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800 font-display">Cancelled Orders</h2>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDatePickerOpen((open) => !open)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600 bg-white hover:bg-surface-card transition-colors"
              >
                <Calendar size={13} className="text-slate-400" />
                {dateLabel}
              </button>

              {datePickerOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-96 rounded-xl border border-surface-border bg-white p-4 shadow-lg">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800">Select Date Range</p>
                    <button
                      type="button"
                      onClick={() => setDatePickerOpen(false)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Close date picker"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["today", "Today"],
                      ["last_7_days", "Last 7 Days"],
                      ["last_month", "Last 1 Month"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => applyPreset(value)}
                        className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                          datePreset === value
                            ? "border-primary bg-primary text-white"
                            : "border-surface-border text-slate-600 hover:bg-surface-card"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="text-xs font-semibold text-slate-600">
                      Start
                      <input
                        type="date"
                        value={customStart}
                        onChange={(event) => setCustomStart(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-surface-border px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-primary"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      End
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(event) => setCustomEnd(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-surface-border px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-primary"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={applyCustomRange}
                    className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                  >
                    Apply Date Range
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 border-b border-surface-border">
            {SUB_TABS.map(({ label, count }) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveTab(label)}
                className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === label
                    ? "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label} ({formatCount(tabCounts[label] ?? count)})
              </button>
            ))}
          </div>
        </div>

        <OrderTable
          orders={list.orders}
          loading={list.isLoading}
          isError={list.isError}
          errorMessage={list.error?.response?.data?.message || list.error?.message || "Failed to load orders"}
          onRetry={list.refetch}
          selectedIds={list.selectedIds}
          selectionLoading={list.selectionLoading}
          onToggleSelect={list.toggleSelect}
          onToggleAll={list.toggleAll}
          allSelected={list.allSelected}
          pagination={list.pagination}
          page={list.page}
          setPage={list.setPage}
          statusSortDirection={list.statusSortDirection}
          onStatusSortChange={list.setStatusSortDirection}
          showActionsCol={false}
          compact
          onDetails={handleDetails}
        />

        <OrderFooter selectedRows={list.selectedRows} />
      </div>
    </div>
  );
}

function formatCount(value) {
  const count = Number(value || 0);
  return String(Number.isFinite(count) ? count : 0).padStart(2, "0");
}
