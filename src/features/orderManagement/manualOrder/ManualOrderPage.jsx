import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Gift } from "lucide-react";
import Topbar from "../../../components/layout/Topbar";
import OrderFilterBar from "../shared/components/OrderFilterBar";
import OrderTable from "../shared/components/OrderTable";
import OrderFooter from "../shared/components/OrderFooter";
import { useOrderList } from "../shared/hooks/useOrderList";
import { MOCK_ORDERS } from "../shared/mockData";
import AddManualOrderPage from "./component/AddManualOrderPage";

// ─────────────────────────────────────────────────────────────────────────────
// ManualOrderPage — Image 9
// Sub-tabs: All (100) | Cancellation Request (10) | Cancelled (80)
// Buttons: Add Gift | + Add Manual Order
// Table action: Push (blue link)
// ─────────────────────────────────────────────────────────────────────────────

const SUB_TABS = [
  { label: "All", count: 100 },
  { label: "Cancellation Request", count: 10 },
  { label: "Cancelled", count: 80 },
];

export default function ManualOrderPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
  const [showAddPage, setShowAddPage] = useState(false);
  const [addMode, setAddMode] = useState("order"); // "order" | "gift"
  const list = useOrderList(MOCK_ORDERS);

  if (showAddPage) {
    return (
      <AddManualOrderPage mode={addMode} onBack={() => setShowAddPage(false)} />
    );
  }

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Manual Order" />
      <OrderFilterBar {...list} />

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 font-display">
              Manual Orders
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAddMode("gift");
                  setShowAddPage(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                           border border-surface-border rounded-lg text-slate-700 bg-white
                           hover:bg-surface-card transition-colors"
              >
                <Gift size={14} className="text-slate-500" />
                Add Gift
              </button>
              <button
                onClick={() => {
                  setAddMode("order");
                  setShowAddPage(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                           bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
              >
                <Plus size={14} />
                Add Manual Order
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-5 border-b border-surface-border">
            {SUB_TABS.map(({ label, count }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative
                  ${
                    activeTab === label
                      ? "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {label} ({count})
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
          actionLabel="Push"
          onAction={(order) => console.log("Push", order.id)}
          onDetails={(order) =>
            navigate(`/warehouse_management/orders/detail/${order.id}`)
          }
        />

        <OrderFooter />
      </div>
    </div>
  );
}
