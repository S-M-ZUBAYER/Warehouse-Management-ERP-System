import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import Topbar from "../../../../components/layout/Topbar";
import OrderProcessingFilterBar from "../../shared/components/OrderProcessingFilterBar";
import OrderTable from "../../shared/components/OrderTable";
import OrderFooter from "../../shared/components/OrderFooter";
import { useOrderList } from "../../shared/hooks/useOrderList";

export default function AllOrderPage() {
  const navigate = useNavigate();
  const list = useOrderList({ pageType: "all" });

  const handleDetails = (order) => {
    list.cacheOrderForDetail(order);
    navigate(`/warehouse_management/orders/detail/${encodeURIComponent(order.id)}`, {
      state: { order },
    });
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Order Processing" />
      <OrderProcessingFilterBar {...list} />

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1.5px dashed #004368" }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-border/60">
          <h2 className="text-xl font-bold text-slate-800 font-display">All Orders</h2>
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600 bg-white hover:bg-surface-card transition-colors">
            <Calendar size={13} className="text-slate-400" />
            Last 30 Days
          </button>
        </div>

        <OrderStateMessage list={list} />

        <OrderTable
          orders={list.orders}
          selectedIds={list.selectedIds}
          onToggleSelect={list.toggleSelect}
          onToggleAll={list.toggleAll}
          allSelected={list.allSelected}
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
  if (list.isError) {
    return <div className="px-5 py-2 text-xs text-red-500">{list.error?.message || "Failed to load orders"}</div>;
  }
  if (list.isFetching) {
    return <div className="px-5 py-2 text-xs text-slate-500">Loading latest orders...</div>;
  }
  return null;
}
