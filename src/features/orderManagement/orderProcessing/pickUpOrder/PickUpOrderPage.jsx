import { useNavigate } from "react-router-dom";
import Topbar from "../../../../components/layout/Topbar";
import OrderFilterBar from "../../shared/components/OrderFilterBar";
import OrderTable from "../../shared/components/OrderTable";
import OrderFooter from "../../shared/components/OrderFooter";
import { useOrderList } from "../../shared/hooks/useOrderList";
import { MOCK_PICKUP_ORDERS } from "../../shared/mockData";

// ─────────────────────────────────────────────────────────────────────────────
// PickUpOrder — Image 5
// Top action button: Move to Shipped
// No sub-tabs, no Actions column (only Details)
// ─────────────────────────────────────────────────────────────────────────────

export default function PickUpOrder() {
  const navigate = useNavigate();
  const list = useOrderList(MOCK_PICKUP_ORDERS);

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Order Processing" />
      <OrderFilterBar {...list} />

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-xl font-bold text-slate-800 font-display mb-4">
            Pickup Orders
          </h2>

          {/* Move to Shipped */}
          <button
            className="px-4 py-1.5 text-sm font-semibold border border-surface-border
                             rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
          >
            Move to Shipped
          </button>
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
