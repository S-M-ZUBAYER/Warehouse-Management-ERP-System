import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../../../../components/layout/Topbar";
import OrderFilterBar from "../../shared/components/OrderFilterBar";
import OrderTable from "../../shared/components/OrderTable";
import OrderFooter from "../../shared/components/OrderFooter";
import { useOrderList } from "../../shared/hooks/useOrderList";
import { MOCK_PROCESSED_ORDERS } from "../../shared/mockData";

// ─────────────────────────────────────────────────────────────────────────────
// ProcessedOrder — Image 4
// Sub-tabs: Pushing | Push Successful | Withdraw
// Top action button: Push
// Table action: Withdraw (blue link)
// ─────────────────────────────────────────────────────────────────────────────

const SUB_TABS = ["Pushing", "Push Successful", "Withdraw"];

export default function ProcessedOrderPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Pushing");
  const list = useOrderList(MOCK_PROCESSED_ORDERS);

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Order Processing" />
      <OrderFilterBar {...list} />

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-xl font-bold text-slate-800 font-display mb-4">
            Processed Orders
          </h2>

          {/* Push action button */}
          <div className="mb-3">
            <button
              className="px-4 py-1.5 text-sm font-semibold border border-surface-border
                               rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
            >
              Push
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-5 border-b border-surface-border">
            {SUB_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative
                  ${
                    activeTab === tab
                      ? "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <OrderTable
          orders={list.orders}
          selectedIds={list.selectedIds}
          onToggleSelect={list.toggleSelect}
          onToggleAll={list.toggleAll}
          allSelected={list.allSelected}
          actionLabel="Withdraw"
          onAction={(order) => console.log("Withdraw", order.id)}
          onDetails={(order) =>
            navigate(`/warehouse_management/orders/detail/${order.id}`)
          }
        />

        <OrderFooter />
      </div>
    </div>
  );
}
