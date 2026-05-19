import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Topbar from "../../../../components/layout/Topbar";
import OrderProcessingFilterBar from "../../shared/components/OrderProcessingFilterBar";
import OrderTable from "../../shared/components/OrderTable";
import OrderFooter from "../../shared/components/OrderFooter";
import OrderActionModals from "../../shared/components/OrderActionModals";
import { useOrderList } from "../../shared/hooks/useOrderList";

const SUB_TABS = ["To Pack", "Packed Successfully", "Pack Failed", "Out Of Stock", "Platform Processing"];
const SHOPEE_READY_TO_SHIP_TABS = ["To Pack", "Pack Failed", "Out Of Stock"];

export default function NewOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("To Pack");
  const list = useOrderList({ pageType: "new", activeTab });
  const actionName = activeTab === "Packed Successfully" ? "push" : "pack";
  const actionLabel = activeTab === "Packed Successfully" ? "Push" : "Pack";
  const isShopee = String(list.storeContext?.platform || "").toLowerCase().includes("shopee");
  const showActionButton = !isShopee || actionName !== "pack" || SHOPEE_READY_TO_SHIP_TABS.includes(activeTab);

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
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-xl font-bold text-slate-800 font-display mb-4">New Orders</h2>

          {showActionButton && (
            <div className="mb-3">
              <button
                onClick={() => list.runAction(actionName)}
                disabled={list.actionLoading}
                className="px-4 py-1.5 text-sm font-semibold border border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-60"
              >
                {actionLabel}
              </button>
            </div>
          )}

          <div className="flex items-center gap-5 border-b border-surface-border">
            {SUB_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
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
          showActionsCol={showActionButton}
          actionLabel={actionLabel}
          compact
          onAction={(order) => list.runAction(actionName, [order])}
          onDetails={handleDetails}
        />

        <OrderFooter selectedRows={list.selectedRows} />
      </div>

      <OrderActionModals list={list} />
    </div>
  );
}

function OrderStateMessage({ list }) {
  if (list.isError) return <div className="px-5 py-2 text-xs text-red-500">{list.error?.message || "Failed to load orders"}</div>;
  return null;
}
