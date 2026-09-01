import { Gift, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDashboardData } from "./hooks/useDashboardData";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import KPICard from "./components/KPICard";
import InventoryChart from "./components/InventoryChart";
import OrderStatusChart from "./components/OrderStatusChart";
import SalesTrendsChart from "./components/SalesTrendsChart";
import Topbar from "../../components/layout/Topbar";
import api from "../../lib/api";
import { getStoredWarehouseUser } from "../../utils/permissions";
import { buildDashboardOrderStatusNavigation } from "../orderManagement/orderProcessing/utils/dashboardOrderStatusFilter";

const getStoreRows = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const isExpiredStore = (store) => {
  const subscription = store?.subscription || {};
  const hasSubscriptionInfo =
    subscription.status !== undefined ||
    subscription.remainingDays !== undefined ||
    subscription.expiresAt !== undefined ||
    subscription.expires_at !== undefined;
  if (!hasSubscriptionInfo) return false;
  const status = String(subscription.status || "").toLowerCase();
  const remainingDays = Math.max(0, Number(subscription.remainingDays || 0));
  return status === "expired" || remainingDays === 0;
};

const isExpiringSoonStore = (store) => {
  const subscription = store?.subscription || {};
  const hasSubscriptionInfo =
    subscription.status !== undefined ||
    subscription.remainingDays !== undefined ||
    subscription.expiresAt !== undefined ||
    subscription.expires_at !== undefined;
  if (!hasSubscriptionInfo) return false;
  const status = String(subscription.status || "").toLowerCase();
  const remainingDays = Math.max(0, Number(subscription.remainingDays || 0));
  return status !== "expired" && remainingDays > 0 && remainingDays < 7;
};

const getRemainingDays = (store) =>
  Math.max(0, Number(store?.subscription?.remainingDays || 0));

const getStoreName = (store) =>
  store?.store_name || store?.external_store_name || `Store #${store?.id || "-"}`;

const getSubscriptionExpirySignature = (store) => {
  const subscription = store?.subscription || {};
  const expiresAt = subscription.expiresAt || subscription.expires_at || "";
  const remainingDays = subscription.remainingDays ?? "";
  return `${store?.id || "-"}:${expiresAt || remainingDays}`;
};

const getWarningScope = () => {
  const user = getStoredWarehouseUser();
  return String(
    user?.company_id ||
      user?.companyId ||
      user?.company?.id ||
      user?.owner_id ||
      user?.ownerId ||
      user?.id ||
      "default",
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DashboardPage — matches Figma "Dashboard 2" layout exactly:
//
//  ┌─────────────────────────────────────────────────────────┐
//  │  Dashboard                                              │
//  ├─────────────────────────────────────────────────────────┤
//  │  Overview                                               │
//  │  [KPI] [KPI] [KPI] [KPI]                                │
//  ├────────────────────────┬────────────────────────────────┤
//  │  Inventory Status      │  Order Status                  │
//  │  (Line chart)          │  (Donut chart)                 │
//  ├────────────────────────┴────────────────────────────────┤
//  │  Sales Trends (Area chart, full width)                  │
//  └─────────────────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expiredStores, setExpiredStores] = useState([]);
  const [expiringSoonStores, setExpiringSoonStores] = useState([]);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [showExpiringSoonModal, setShowExpiringSoonModal] = useState(false);
  const [unseenGifts, setUnseenGifts] = useState([]);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const {
    loading,
    kpiCards,
    inventoryData,
    orderStatusData,
    orderStatusLoading,
    orderStatusDateRange,
    salesTrendsData,
    platforms,
    years,
    inventoryLoading,
    salesLoading,
    inventoryYear,
    inventoryMonth,
    setInventoryYear,
    setInventoryMonth,
    salesYear,
    salesMonth,
    salesPlatform,
    setSalesYear,
    setSalesMonth,
    setSalesPlatform,
    setOrderStatusDateRange,
  } = useDashboardData();

  const handleKpiClick = (cardId) => {
    if (cardId === "total_products") {
      navigate("/warehouse_management/inventory/SKU_mapping/byProduct");
      return;
    }

    if (cardId === "today_orders") {
      navigate("/warehouse_management/orders/processing/all_order", {
        state: { datePreset: "today" },
      });
      return;
    }

    if (cardId === "low_stock") {
      navigate("/warehouse_management/inventory/list", {
        state: { stockAlertStatus: "low_stock" },
      });
      return;
    }

    if (cardId === "out_of_stock") {
      navigate("/warehouse_management/inventory/list", {
        state: { stockAlertStatus: "out_of_stock" },
      });
    }
  };

  const handleOrderStatusClick = (status) => {
    const target = buildDashboardOrderStatusNavigation(status?.key, orderStatusDateRange);
    if (target) navigate(target);
  };

  const expiredSignature = useMemo(
    () => expiredStores.map(getSubscriptionExpirySignature).sort().join(","),
    [expiredStores]
  );
  const expiringSoonSignature = useMemo(
    () => expiringSoonStores.map(getSubscriptionExpirySignature).sort().join(","),
    [expiringSoonStores]
  );

  useEffect(() => {
    let ignore = false;
    api
      .get("/platform-stores", { params: { page: 1, limit: 1000 } })
      .then((response) => {
        if (ignore) return;
        const allRows = getStoreRows(response);
        const expiredRows = allRows.filter(isExpiredStore);
        const expiringRows = allRows.filter(isExpiringSoonStore);
        setExpiredStores(expiredRows);
        setExpiringSoonStores(expiringRows);

        const expiredSignatureValue = expiredRows.map(getSubscriptionExpirySignature).sort().join(",");
        const scope = getWarningScope();
        if (expiredRows.length && localStorage.getItem(`expired-store-warning:${scope}:${expiredSignatureValue}`) !== "seen") {
          setShowExpiredModal(true);
          return;
        }

        const expiringSignatureValue = expiringRows.map(getSubscriptionExpirySignature).sort().join(",");
        if (
          expiringRows.length &&
          localStorage.getItem(`subscription-expiring-soon-warning:${scope}:${expiringSignatureValue}`) !== "seen"
        ) {
          setShowExpiringSoonModal(true);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    if (!localStorage.getItem("whmAccessToken")) return undefined;

    api
      .get("/subscription/gifts")
      .then((response) => {
        if (ignore) return;
        const giftRows = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        const notViewedGifts = giftRows.filter(
          (gift) =>
            !gift.modal_seen_at &&
            !gift.modalSeenAt &&
            !["DECLINED", "CANCELLED", "RECEIVED"].includes(String(gift.status || "").toUpperCase()),
        );
        setUnseenGifts(notViewedGifts);
        if (notViewedGifts.length) setShowGiftModal(true);
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const closeExpiredModal = () => {
    if (expiredSignature) {
      localStorage.setItem(`expired-store-warning:${getWarningScope()}:${expiredSignature}`, "seen");
    }
    setShowExpiredModal(false);
  };

  const closeExpiringSoonModal = () => {
    if (expiringSoonSignature) {
      localStorage.setItem(`subscription-expiring-soon-warning:${getWarningScope()}:${expiringSoonSignature}`, "seen");
    }
    setShowExpiringSoonModal(false);
  };

  const upgradeExpiredStore = () => {
    const store = expiredStores[0];
    closeExpiredModal();
    navigate("/warehouse_management/pricing", {
      state: store
        ? {
            preselectStore: {
              id: store.id,
              platform: store.platform,
              label: store.store_name || store.external_store_name || `Store #${store.id}`,
            },
          }
        : undefined,
    });
  };

  const upgradeExpiringSoonStore = () => {
    const store = expiringSoonStores[0];
    closeExpiringSoonModal();
    navigate("/warehouse_management/pricing", {
      state: store
        ? {
            preselectStore: {
              id: store.id,
              platform: store.platform,
              label: getStoreName(store),
            },
          }
        : undefined,
    });
  };

  const markUnseenGiftsSeen = async () => {
    const giftsToMark = unseenGifts.filter((gift) => gift?.id);
    if (giftsToMark.length) {
      await Promise.allSettled(giftsToMark.map((gift) => api.patch(`/subscription/gifts/${gift.id}/seen`)));
      window.dispatchEvent(new Event("refresh-gift-count"));
    }
    setShowGiftModal(false);
  };

  const viewUnseenGifts = () => {
    setShowGiftModal(false);
    window.dispatchEvent(new Event("open-gift-notifications"));
  };

  return (
    <div className="space-y-6 font-body">
      {/* ── Page Title ── */}
      <Topbar PageTitle="Dashboard"></Topbar>

      {showExpiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t("subscription.expiredWarningTitle", { defaultValue: "Subscription Expired" })}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("subscription.expiredWarningMessage", {
                    defaultValue: "Your subscription has expired for one or more stores. Please renew to continue marketplace operations.",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={closeExpiredModal}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                x
              </button>
            </div>
            <div className="mt-4 max-h-32 overflow-y-auto rounded-lg border border-red-100 bg-red-50/70 p-3">
              {expiredStores.map((store) => (
                <div key={store.id} className="flex items-center justify-between gap-3 py-1 text-sm">
                  <span className="font-semibold text-slate-800">
                    {store.store_name || store.external_store_name || `Store #${store.id}`}
                  </span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                    {t("subscription.expired", { defaultValue: "Expired" })}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeExpiredModal}
                className="h-10 min-w-[110px] rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t("subscription.cancel", { defaultValue: "Cancel" })}
              </button>
              <button
                type="button"
                onClick={upgradeExpiredStore}
                className="h-10 min-w-[130px] rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
              >
                {t("subscription.upgradePlan", { defaultValue: "Upgrade Plan" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExpiringSoonModal && !showExpiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t("subscription.renewalReminderTitle", { defaultValue: "Subscription Renewal Reminder" })}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("subscription.renewalReminderMessage", {
                    defaultValue: "One or more store subscriptions will expire in less than 7 days. Please renew to avoid marketplace operation interruption.",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={closeExpiringSoonModal}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                x
              </button>
            </div>
            <div className="mt-4 max-h-32 overflow-y-auto rounded-lg border border-amber-100 bg-amber-50/80 p-3">
              {expiringSoonStores.map((store) => {
                const days = getRemainingDays(store);
                return (
                  <div key={store.id} className="flex items-center justify-between gap-3 py-1 text-sm">
                    <span className="font-semibold text-slate-800">
                      {getStoreName(store)}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                      {t(days === 1 ? "subscription.oneDayLeft" : "subscription.daysLeft", {
                        count: days,
                        defaultValue: `${days} ${days === 1 ? "day" : "days"} left`,
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeExpiringSoonModal}
                className="h-10 min-w-[110px] rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t("subscription.cancel", { defaultValue: "Cancel" })}
              </button>
              <button
                type="button"
                onClick={upgradeExpiringSoonStore}
                className="h-10 min-w-[130px] rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
              >
                {t("subscription.upgradePlan", { defaultValue: "Upgrade Plan" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Overview Section ── */}
      {showGiftModal && !showExpiredModal && !showExpiringSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-[460px] overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl">
            <button
              type="button"
              onClick={markUnseenGiftsSeen}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X size={17} />
            </button>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-600">
              <Gift size={30} />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-900">
              {t("gift.congratulations", { defaultValue: "Congratulations" })}
            </h2>
            <p className="mx-auto mt-2 max-w-[340px] text-sm leading-6 text-slate-600">
              {t("gift.dashboardGiftNotice", {
                count: unseenGifts.length,
                defaultValue:
                  unseenGifts.length > 1
                    ? `You received ${unseenGifts.length} gifts. Enjoy your reward.`
                    : "You received a gift. Enjoy your reward.",
              })}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={markUnseenGiftsSeen}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t("gift.cancel", { defaultValue: "Cancel" })}
              </button>
              <button
                type="button"
                onClick={viewUnseenGifts}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
              >
                {t("gift.viewGift", { defaultValue: "View Gift" })}
              </button>
            </div>
          </div>
        </div>
      )}

      <section>
        <h2
          className="text-lg font-semibold mb-4 text-primary-text"
          style={{
            letterSpacing: "0.5px",
          }}
        >
          {t("common.overview")}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <KPICard key={card.id} {...card} loading={loading} onClick={() => handleKpiClick(card.id)} />
          ))}
        </div>
      </section>

      {/* ── Charts Row: Inventory + Order Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InventoryChart
          data={inventoryData}
          loading={inventoryLoading}
          years={years}
          selectedYear={inventoryYear}
          selectedMonth={inventoryMonth}
          onYearChange={setInventoryYear}
          onMonthChange={setInventoryMonth}
        />
        <OrderStatusChart
          data={orderStatusData}
          loading={orderStatusLoading}
          dateRange={orderStatusDateRange}
          onDateRangeChange={setOrderStatusDateRange}
          onStatusClick={handleOrderStatusClick}
        />
      </div>

      {/* ── Sales Trends (full width) ── */}
      <SalesTrendsChart
        data={salesTrendsData}
        platforms={platforms}
        loading={salesLoading}
        years={years}
        selectedYear={salesYear}
        selectedMonth={salesMonth}
        selectedPlatform={salesPlatform}
        onYearChange={setSalesYear}
        onMonthChange={setSalesMonth}
        onPlatformChange={setSalesPlatform}
      />
    </div>
  );
}
