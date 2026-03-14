import { useNavigate } from "react-router-dom";
import Topbar from "../../../../components/layout/Topbar";
import OrderFilterBar from "../../shared/components/OrderFilterBar";
import OrderTable from "../../shared/components/OrderTable";
import OrderFooter from "../../shared/components/OrderFooter";
import { useOrderList } from "../../shared/hooks/useOrderList";
import { MOCK_CANCELLED_ORDERS } from "../../shared/mockData";

export default function CanceledOrder() {
  const navigate = useNavigate();
  const list = useOrderList(MOCK_CANCELLED_ORDERS);

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Order Processing" />
      <OrderFilterBar {...list} />

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-surface-border">
          <h2 className="text-xl font-bold text-slate-800 font-display">
            Cancelled Orders
          </h2>
        </div>

        <OrderTable
          orders={list.orders}
          selectedIds={list.selectedIds}
          onToggleSelect={list.toggleSelect}
          onToggleAll={list.toggleAll}
          allSelected={list.allSelected}
          showActionsCol={false}
          onDetails={(order) =>
            navigate(`/warehouse_management/orders/detail/${order.id}`)
          }
        />

        <OrderFooter />
      </div>
    </div>
  );
}
