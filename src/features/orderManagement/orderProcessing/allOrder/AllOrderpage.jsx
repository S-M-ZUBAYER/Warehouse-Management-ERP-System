import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import Topbar from "../../../../components/layout/Topbar";
import OrderFilterBar from "../../shared/components/OrderFilterBar";
import OrderTable from "../../shared/components/OrderTable";
import OrderFooter from "../../shared/components/OrderFooter";
import { useOrderList } from "../../shared/hooks/useOrderList";
import { MOCK_ALL_ORDERS } from "../../shared/mockData";

// ─────────────────────────────────────────────────────────────────────────────
// AllOrder — Image 8
// Has dashed blue border on the entire card
// "All Orders" title with date range picker top-right
// Mixed statuses: Shipping / Completed / Processed
// No action buttons, no Actions column — only Details link
// ─────────────────────────────────────────────────────────────────────────────

export default function AllOrderPage() {
  const navigate = useNavigate();
  const list = useOrderList(MOCK_ALL_ORDERS);

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Order Processing" />
      <OrderFilterBar {...list} />

      {/* Dashed blue border card matching Figma image 8 */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ border: "1.5px dashed #004368" }}
      >
        {/* Card header with date range */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-border/60">
          <h2 className="text-xl font-bold text-slate-800 font-display">
            All Orders
          </h2>
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-xs border border-surface-border
                       rounded-lg text-slate-600 bg-white hover:bg-surface-card transition-colors"
          >
            <Calendar size={13} className="text-slate-400" />
            01 Oct 2025 - 31 Oct 2025
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
