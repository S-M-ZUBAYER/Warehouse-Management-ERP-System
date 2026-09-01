import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWorkspaceTabsStore } from "@/stores/workspaceTabsStore";

const routeTitleRules = [
  { path: "/warehouse_management", key: "page.dashboard", title: "Dashboard", exact: true },
  { path: "/warehouse_management/contact", key: "page.contact", title: "Contact" },
  { path: "/warehouse_management/chat", key: "page.chat", title: "Chat" },
  { path: "/warehouse_management/products/list", key: "nav.productList", title: "Product List" },
  { path: "/warehouse_management/products/combine_sku/add", key: "nav.combineSku", title: "Add Combine SKU" },
  { path: "/warehouse_management/products/combine_sku", key: "nav.combineSku", title: "Combine SKU" },
  { path: "/warehouse_management/inventory/merchant_SKU", key: "nav.merchantSku", title: "Merchant SKU" },
  { path: "/warehouse_management/inventory/SKU_mapping/byProduct", key: "nav.byProduct", title: "By Product" },
  { path: "/warehouse_management/inventory/SKU_mapping/byMerchant", key: "nav.byMerchant", title: "By Merchant" },
  { path: "/warehouse_management/inventory/list", key: "page.inventoryList", title: "Inventory List" },
  { path: "/warehouse_management/inventory/manual_inbound", key: "page.manualInbound", title: "Manual Inbound" },
  { path: "/warehouse_management/inventory/inbound/draft", key: "nav.draft", title: "Inbound Draft" },
  { path: "/warehouse_management/inventory/inbound/onTheWay", key: "nav.onTheWay", title: "Inbound On The Way" },
  { path: "/warehouse_management/inventory/inbound/completed", key: "nav.complete", title: "Inbound Completed" },
  { path: "/warehouse_management/inventory/outbound/draft", key: "nav.draft", title: "Outbound Draft" },
  { path: "/warehouse_management/inventory/outbound/onTheWay", key: "nav.onTheWay", title: "Outbound On The Way" },
  { path: "/warehouse_management/inventory/outbound/completed", key: "nav.complete", title: "Outbound Completed" },
  { path: "/warehouse_management/inventory/outbound_order", key: "page.outboundOrder", title: "Outbound Order" },
  { path: "/warehouse_management/inventory/log", key: "page.inventoryLog", title: "Inventory Log" },
  { path: "/warehouse_management/orders/processing/new_order", key: "nav.newOrder", title: "New Order" },
  { path: "/warehouse_management/orders/processing/processed", key: "nav.processedOrder", title: "Processed Order" },
  { path: "/warehouse_management/orders/processing/pick_up", key: "nav.toPickupOrder", title: "To Pickup Order" },
  { path: "/warehouse_management/orders/processing/shipped", key: "nav.shippedOrder", title: "Shipped Order" },
  { path: "/warehouse_management/orders/processing/completed", key: "nav.completed", title: "Completed" },
  { path: "/warehouse_management/orders/processing/all_order", key: "nav.allOrder", title: "All Order" },
  { path: "/warehouse_management/orders/processing/return_order", key: "nav.returnOrder", title: "Return Order" },
  { path: "/warehouse_management/orders/processing/canceled", key: "nav.canceledOrder", title: "Canceled Order" },
  { path: "/warehouse_management/orders/aftership_manual_order", key: "page.manualOrderByAfterShip", title: "Manual Order by AfterShip" },
  { path: "/warehouse_management/orders/platform_manual_order", key: "page.platformManualOrder", title: "Platform Manual Order" },
  { path: "/warehouse_management/orders/manual_order", key: "page.manualOrder", title: "Manual Order" },
  { path: "/warehouse_management/orders/detail/", key: "page.orderDetail", title: "Order Detail" },
  { path: "/warehouse_management/warehouse", key: "page.warehouseManagement", title: "Warehouse Management" },
  { path: "/warehouse_management/config/store_authorization", key: "page.storeAuthorization", title: "Store Authorization" },
  { path: "/warehouse_management/config/account_management/sub_account", key: "page.subAccount", title: "Sub Account" },
  { path: "/warehouse_management/config/account_management/role_management", key: "page.roleManagement", title: "Role Management" },
];

const cleanPathTitle = (pathname) => {
  const leaf = pathname.split("/").filter(Boolean).at(-1) || "Dashboard";
  return leaf
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export function getWorkspaceTabTitle(pathname, t) {
  const rule = routeTitleRules.find((item) =>
    item.exact ? pathname === item.path || pathname === `${item.path}/` : pathname.startsWith(item.path)
  );

  if (!rule) return cleanPathTitle(pathname);
  return t(rule.key, { defaultValue: rule.title });
}

function isKnownWorkspacePath(pathname) {
  return routeTitleRules.some((item) =>
    item.exact ? pathname === item.path || pathname === `${item.path}/` : pathname.startsWith(item.path)
  );
}

function buildTabFromLocation(location) {
  const path = location.pathname === "/warehouse_management/"
    ? "/warehouse_management"
    : location.pathname;
  const search = location.search || "";

  return {
    id: `${path}${search}`,
    path,
    search,
    pinned: path === "/warehouse_management",
  };
}

export default function WorkspaceTabs() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = useWorkspaceTabsStore((state) => state.tabs);
  const openTab = useWorkspaceTabsStore((state) => state.openTab);
  const closeTab = useWorkspaceTabsStore((state) => state.closeTab);
  const reloadTab = useWorkspaceTabsStore((state) => state.reloadTab);

  useEffect(() => {
    if (!location.pathname.startsWith("/warehouse_management")) return;
    if (!isKnownWorkspacePath(location.pathname)) return;
    openTab(buildTabFromLocation(location));
  }, [location.pathname, location.search, openTab]);

  const activeRouteId = `${location.pathname === "/warehouse_management/" ? "/warehouse_management" : location.pathname}${location.search || ""}`;

  const visibleTabs = useMemo(
    () => tabs.filter((tab) => tab.path?.startsWith("/warehouse_management") && isKnownWorkspacePath(tab.path)),
    [tabs]
  );

  const handleClose = (event, tab) => {
    event.preventDefault();
    event.stopPropagation();

    const result = closeTab(tab.id);
    if (result?.closedActive && result.nextTab) {
      navigate(`${result.nextTab.path}${result.nextTab.search || ""}`);
    }
  };

  const handleReload = (event, tab) => {
    event.preventDefault();
    event.stopPropagation();
    reloadTab(tab.id);
  };

  const handleTabKeyDown = (event, tab) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    navigate(`${tab.path}${tab.search || ""}`);
  };

  return (
    <div className="mb-4 rounded-xl border border-surface-border bg-white px-2 py-2 shadow-sm">
      <div className="flex items-center gap-2 overflow-x-auto">
        {visibleTabs.map((tab) => {
          const isActive = tab.id === activeRouteId;
          const title = getWorkspaceTabTitle(tab.path, t);

          return (
            <div
              key={tab.id}
              role="tab"
              tabIndex={0}
              aria-selected={isActive}
              onClick={() => navigate(`${tab.path}${tab.search || ""}`)}
              onKeyDown={(event) => handleTabKeyDown(event, tab)}
              className={`group flex h-9 max-w-[230px] shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-colors ${
                isActive
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-surface-border bg-slate-50 text-[#4A6380] hover:border-primary/40 hover:bg-white hover:text-primary"
              }`}
              title={title}
            >
              <span className="truncate font-semibold">{title}</span>
              <button
                type="button"
                onClick={(event) => handleReload(event, tab)}
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-md transition ${
                  isActive ? "text-white hover:bg-white/15" : "text-slate-400 hover:bg-slate-100 hover:text-primary"
                }`}
                aria-label={t("workspaceTabs.reloadTab", { defaultValue: "Reload tab" })}
                title={t("workspaceTabs.reload", { defaultValue: "Reload" })}
              >
                <RefreshCw size={13} />
              </button>
              {!tab.pinned && (
                <button
                  type="button"
                  onClick={(event) => handleClose(event, tab)}
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md transition ${
                    isActive ? "text-white hover:bg-white/15" : "text-slate-400 hover:bg-slate-100 hover:text-red-500"
                  }`}
                  aria-label={t("workspaceTabs.closeTab", { defaultValue: "Close tab" })}
                  title={t("workspaceTabs.close", { defaultValue: "Close" })}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
