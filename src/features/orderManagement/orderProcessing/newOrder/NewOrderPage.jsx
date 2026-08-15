import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import Topbar from "../../../../components/layout/Topbar";
import OrderProcessingFilterBar from "../../shared/components/OrderProcessingFilterBar";
import OrderTable from "../../shared/components/OrderTable";
import OrderFooter from "../../shared/components/OrderFooter";
import OrderActionModals from "../../shared/components/OrderActionModals";
import OrderDateRangePicker, { getPresetRange } from "../../shared/components/OrderDateRangePicker";
import ConfirmActionModal from "../../../../components/shared/ConfirmActionModal";
import { useOrderList } from "../../shared/hooks/useOrderList";
import { fetchNewOrderTabCounts, getStoredOrderListReturnState, setOrderDetailReturnContext } from "../../shared/utils/orderApi";
import { getDashboardOrderStatusFilter } from "../utils/dashboardOrderStatusFilter";

const SUB_TABS = ["To Pack", "Packed Successfully", "Pack Failed", "Out Of Stock", "Exchange/Add", "Platform Processing"];
const SHOPEE_READY_TO_SHIP_TABS = ["To Pack", "Pack Failed", "Exchange/Add"];
const NEW_ORDER_TAB_COUNT_GC_TIME = 1000 * 60 * 5;
const TAB_COUNT_STALE_TIME = 1000 * 150;

export default function NewOrder() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const dashboardFilter = useMemo(
    () => getDashboardOrderStatusFilter(location),
    [location.search, location.state]
  );
  const restoredPageState = useMemo(
    () => getStoredOrderListReturnState({ pathname: location.pathname, navigationType, pageType: "new" }),
    [location.pathname, navigationType]
  );
  const [activeTab, setActiveTab] = useState(() =>
    SUB_TABS.includes(restoredPageState.activeTab)
      ? restoredPageState.activeTab
      : SUB_TABS.includes(dashboardFilter.tab)
        ? dashboardFilter.tab
        : "To Pack"
  );
  const [datePreset, setDatePreset] = useState(() => restoredPageState.datePreset || dashboardFilter.datePreset || "last_7_days");
  const [dateRange, setDateRange] = useState(() => restoredPageState.dateRange || dashboardFilter.dateRange || getPresetRange("last_7_days"));
  const [withdrawOrder, setWithdrawOrder] = useState(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [tabRefreshKey, setTabRefreshKey] = useState(0);
  const list = useOrderList({ pageType: "new", activeTab, datePreset, dateRange, tabRefreshKey });
  const actionName = activeTab === "Packed Successfully" ? "push" : "pack";
  const actionLabel = activeTab === "Packed Successfully" ? "Push" : "Pack";
  const isShopee = String(list.storeContext?.platform || "").toLowerCase().includes("shopee");
  const isOutOfStockTab = activeTab === "Out Of Stock";
  const isPlatformProcessingTab = activeTab === "Platform Processing";
  const isPackedSuccessfullyTab = activeTab === "Packed Successfully";
  const showActionButton =
    !isOutOfStockTab &&
    !isPlatformProcessingTab &&
    (!isShopee || actionName !== "pack" || SHOPEE_READY_TO_SHIP_TABS.includes(activeTab));
  const rowActions = isPackedSuccessfullyTab
    ? [
        { label: "Push", onClick: (order) => list.runAction("push", [order]) },
        { label: "Withdraw", onClick: (order) => setWithdrawOrder(order) },
      ]
    : undefined;
  const tabCountQueryKey = useMemo(
    () => [
      "order-management",
      "new-order-tab-counts",
      list.storeContext,
      list.appliedSearch,
      list.appliedSearchType,
      list.appliedSkuType,
      list.dateRange,
      list.dataRefreshKey,
    ],
    [list.appliedSearch, list.appliedSearchType, list.appliedSkuType, list.dateRange, list.dataRefreshKey, list.storeContext]
  );
  const {
    data: tabCounts = {},
    isLoading: tabCountsLoading,
    isFetching: tabCountsFetching,
    dataUpdatedAt: tabCountsUpdatedAt,
  } = useQuery({
    queryKey: tabCountQueryKey,
    queryFn: () =>
      fetchNewOrderTabCounts({
        context: list.storeContext,
        search: list.appliedSearch,
        searchType: list.appliedSearchType,
        skuType: list.appliedSkuType,
        dateRange: list.dateRange,
        tabs: SUB_TABS,
    }),
    enabled: list.hasStore,
    staleTime: TAB_COUNT_STALE_TIME,
    gcTime: NEW_ORDER_TAB_COUNT_GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const activeTabCount = list.isLoading
    ? tabCounts[activeTab]
    : list.pagination?.total ?? list.allOrders?.length ?? list.orders.length;
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    if (!tabCountsFetching && tabCountsUpdatedAt && Date.now() - tabCountsUpdatedAt >= TAB_COUNT_STALE_TIME) {
      queryClient.invalidateQueries({ queryKey: tabCountQueryKey });
    }
    setTabRefreshKey((current) => current + 1);
    setActiveTab(tab);
  };

  useEffect(() => {
    if (!restoredPageState.activeTab && SUB_TABS.includes(dashboardFilter.tab)) {
      setActiveTab(dashboardFilter.tab);
    }

    if (!restoredPageState.dateRange && dashboardFilter.dateRange) {
      setDatePreset(dashboardFilter.datePreset || "custom");
      setDateRange(dashboardFilter.dateRange);
    }
  }, [dashboardFilter, restoredPageState.activeTab, restoredPageState.dateRange]);

  const handleDetails = (order) => {
    list.cacheOrderForDetail(order);
    setOrderDetailReturnContext({
      fromPath: location.pathname,
      orderId: order.id,
    });
    navigate(`/warehouse_management/orders/detail/${encodeURIComponent(order.id)}`, {
      state: { order, fromPath: location.pathname, pageType: "new", activeTab },
    });
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawOrder) return;

    setWithdrawLoading(true);
    try {
      await list.markWithdraw([withdrawOrder]);
      setWithdrawOrder(null);
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Order Processing" />
      <OrderProcessingFilterBar {...list} />

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800 font-display">New Orders</h2>
            <OrderDateRangePicker
              datePreset={datePreset}
              setDatePreset={setDatePreset}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </div>

          {showActionButton && (
            <div className="mb-3">
              <button
                onClick={() => list.runAction(actionName)}
                disabled={list.actionLoading}
                className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-60"
              >
                {actionLabel}
              </button>
            </div>
          )}

          <div className="flex items-center gap-5 border-b border-surface-border">
            {SUB_TABS.map((tab) => {
              const isActive = activeTab === tab;
              const displayCount = isActive ? activeTabCount : tabCounts[tab];
              const isCountLoading = !isActive && (tabCountsLoading || tabCountsFetching);
              const hasWarningOrders = isWarningTab(tab) && Number(displayCount || 0) > 0;

              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                    isActive
                      ? `${hasWarningOrders ? "text-amber-600 after:bg-amber-500" : "text-primary after:bg-primary"} font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5`
                      : hasWarningOrders
                        ? "text-amber-600 hover:text-amber-700"
                        : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab} ({formatCount(displayCount, isCountLoading)})
                </button>
              );
            })}
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
          showActionsCol={showActionButton}
          showSkuAdjustmentColumn={list.showSkuAdjustmentColumn}
          actionLabel={actionLabel}
          rowActions={rowActions}
          actionMenuPlacement="up"
          compact
          onAction={showActionButton ? (order) => list.runAction(actionName, [order]) : undefined}
          onDetails={handleDetails}
        />

        <OrderFooter selectedRows={list.selectedRows} />
      </div>

      <OrderActionModals list={list} />

      <ConfirmActionModal
        open={!!withdrawOrder}
        title="Confirm Withdraw"
        message={
          <div className="space-y-2">
            <p>Are you sure you want to withdraw this order?</p>
            <p className="font-semibold text-slate-800">
              Order Number: {withdrawOrder?.orderNo || withdrawOrder?.id || "-"}
            </p>
          </div>
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        danger
        loading={withdrawLoading}
        onCancel={() => setWithdrawOrder(null)}
        onConfirm={handleConfirmWithdraw}
      />
    </div>
  );
}

function formatCount(value, isLoading = false) {
  if (isLoading) return "_ _";

  const count = Number(value || 0);
  return String(Number.isFinite(count) ? count : 0).padStart(2, "0");
}

function isWarningTab(tab) {
  return tab === "Pack Failed" || tab === "Out Of Stock" || tab === "Exchange/Add";
}
