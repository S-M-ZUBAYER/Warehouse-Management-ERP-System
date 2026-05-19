import { useLocation, useNavigate } from "react-router-dom";
import Topbar from "../../../../components/layout/Topbar";
import OrderProcessingFilterBar from "../../shared/components/OrderProcessingFilterBar";
import OrderTable from "../../shared/components/OrderTable";
import OrderFooter from "../../shared/components/OrderFooter";
import { useOrderList } from "../../shared/hooks/useOrderList";

export default function PickUpOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const list = useOrderList({ pageType: "pickup" });

  const handleDetails = (order) => {
    list.cacheOrderForDetail(order);
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
          <h2 className="text-xl font-bold text-slate-800 font-display mb-4">Pickup Orders</h2>

          <button
            onClick={() => list.runAction("move-to-shipped")}
            disabled={list.actionLoading}
            className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-60"
          >
            Move to Shipped
          </button>
        </div>

        <OrderStateMessage list={list} />

        <OrderTable
          orders={list.orders}
          loading={list.isLoading || list.isFetching}
          isError={list.isError}
          errorMessage={list.error?.message || "Failed to load orders"}
          selectedIds={list.selectedIds}
          onToggleSelect={list.toggleSelect}
          onToggleAll={list.toggleAll}
          allSelected={list.allSelected}
          pagination={list.pagination}
          page={list.page}
          setPage={list.setPage}
          showActionsCol={false}
          compact
          onDetails={handleDetails}
        />

        <OrderFooter selectedRows={list.selectedRows} />
      </div>
    </div>
  );
}

function OrderStateMessage({ list }) {
  if (list.isError) return <div className="px-5 py-2 text-xs text-red-500">{list.error?.message || "Failed to load orders"}</div>;
  return null;
}
