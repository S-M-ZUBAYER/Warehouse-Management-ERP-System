import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import Topbar from "../../../../components/layout/Topbar";
import OrderProcessingFilterBar from "../../shared/components/OrderProcessingFilterBar";
import OrderTable from "../../shared/components/OrderTable";
import OrderFooter from "../../shared/components/OrderFooter";
import OrderDateRangePicker, { getPresetRange } from "../../shared/components/OrderDateRangePicker";
import { useOrderList } from "../../shared/hooks/useOrderList";
import { getStoredOrderListReturnState, setOrderDetailReturnContext } from "../../shared/utils/orderApi";
import { getDashboardOrderStatusFilter } from "../utils/dashboardOrderStatusFilter";

export default function Completed() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const dashboardFilter = useMemo(
    () => getDashboardOrderStatusFilter(location),
    [location.search, location.state]
  );
  const restoredPageState = useMemo(
    () => getStoredOrderListReturnState({ pathname: location.pathname, navigationType, pageType: "completed" }),
    [location.pathname, navigationType]
  );
  const [datePreset, setDatePreset] = useState(() => restoredPageState.datePreset || dashboardFilter.datePreset || "last_7_days");
  const [dateRange, setDateRange] = useState(() => restoredPageState.dateRange || dashboardFilter.dateRange || getPresetRange("last_7_days"));
  const list = useOrderList({ pageType: "completed", datePreset, dateRange });

  useEffect(() => {
    if (!restoredPageState.dateRange && dashboardFilter.dateRange) {
      setDatePreset(dashboardFilter.datePreset || "custom");
      setDateRange(dashboardFilter.dateRange);
    }
  }, [dashboardFilter, restoredPageState.dateRange]);

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
        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4 border-b border-surface-border">
          <h2 className="text-xl font-bold text-slate-800 font-display">Completed Orders</h2>
          <OrderDateRangePicker
            datePreset={datePreset}
            setDatePreset={setDatePreset}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
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
          showSkuAdjustmentColumn={list.showSkuAdjustmentColumn}
          compact
          onDetails={handleDetails}
        />

        <OrderFooter selectedRows={list.selectedRows} />
      </div>
    </div>
  );
}
