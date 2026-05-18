import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Gift } from "lucide-react";
import Topbar from "../../../components/layout/Topbar";
import OrderProcessingFilterBar from "../shared/components/OrderProcessingFilterBar";
import OrderTable from "../shared/components/OrderTable";
import OrderFooter from "../shared/components/OrderFooter";
import { useOrderList } from "../shared/hooks/useOrderList";
import AddManualOrderPage from "./component/AddManualOrderPage";

const SUB_TABS = [
  { label: "All", count: "--" },
  { label: "Cancellation Request", count: "--" },
  { label: "Cancelled", count: "--" },
];

export default function ManualOrderPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
  const [showAddPage, setShowAddPage] = useState(false);
  const [addMode, setAddMode] = useState("order");
  const list = useOrderList({ pageType: "manual", activeTab });

  if (showAddPage) {
    return <AddManualOrderPage mode={addMode} onBack={() => setShowAddPage(false)} />;
  }

  const handleDetails = (order) => {
    list.cacheOrderForDetail(order);
    navigate(`/warehouse_management/orders/detail/${encodeURIComponent(order.id)}`, { state: { order } });
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Manual Order" />
      <OrderProcessingFilterBar {...list} />

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 font-display">Manual Orders</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAddMode("gift");
                  setShowAddPage(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                <Gift size={14} className="text-slate-500" />
                Add Gift
              </button>
              <button
                onClick={() => {
                  setAddMode("order");
                  setShowAddPage(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
              >
                <Plus size={14} />
                Add Manual Order
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5 border-b border-surface-border">
            {SUB_TABS.map(({ label, count }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === label
                    ? "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label} ({activeTab === label ? list.orders.length : count})
              </button>
            ))}
          </div>
        </div>

        {list.isError && <div className="px-5 py-2 text-xs text-red-500">{list.error?.message || "Failed to load manual orders"}</div>}
        {list.isFetching && <div className="px-5 py-2 text-xs text-slate-500">Loading manual orders...</div>}

        <OrderTable
          orders={list.orders}
          selectedIds={list.selectedIds}
          onToggleSelect={list.toggleSelect}
          onToggleAll={list.toggleAll}
          allSelected={list.allSelected}
          actionLabel="Push"
          compact
          onAction={(order) => list.runAction("push", [order])}
          onDetails={handleDetails}
        />

        <OrderFooter selectedRows={list.selectedRows} />
      </div>
    </div>
  );
}
