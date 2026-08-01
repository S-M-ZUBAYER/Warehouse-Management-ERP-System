import { useState } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import Topbar from "../../../../components/layout/Topbar";
import OrderProcessingFilterBar from "../../shared/components/OrderProcessingFilterBar";
import OrderTable from "../../shared/components/OrderTable";
import OrderFooter from "../../shared/components/OrderFooter";
import OrderDateRangePicker, { getPresetRange } from "../../shared/components/OrderDateRangePicker";
import { useOrderList } from "../../shared/hooks/useOrderList";
import { getStoredOrderListReturnState, setOrderDetailReturnContext } from "../../shared/utils/orderApi";

export default function PickUpOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const restoredPageState = getStoredOrderListReturnState({ pathname: location.pathname, navigationType, pageType: "pickup" });
  const [datePreset, setDatePreset] = useState(() => restoredPageState.datePreset || "last_7_days");
  const [dateRange, setDateRange] = useState(() => restoredPageState.dateRange || getPresetRange("last_7_days"));
  const list = useOrderList({ pageType: "pickup", datePreset, dateRange });

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
        <div className="px-5 pt-5 pb-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800 font-display">Pickup Orders</h2>
            <OrderDateRangePicker
              datePreset={datePreset}
              setDatePreset={setDatePreset}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </div>

          <button
            onClick={() => list.runAction("move-to-shipped")}
            disabled={list.actionLoading}
            className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-60"
          >
            Move to Shipped
          </button>
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
