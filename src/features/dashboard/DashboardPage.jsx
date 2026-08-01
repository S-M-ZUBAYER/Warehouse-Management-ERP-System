import { useDashboardData } from "./hooks/useDashboardData";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import KPICard from "./components/KPICard";
import InventoryChart from "./components/InventoryChart";
import OrderStatusChart from "./components/OrderStatusChart";
import SalesTrendsChart from "./components/SalesTrendsChart";
import Topbar from "../../components/layout/Topbar";
import { buildDashboardOrderStatusNavigation } from "../orderManagement/orderProcessing/utils/dashboardOrderStatusFilter";

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

  return (
    <div className="space-y-6 font-body">
      {/* ── Page Title ── */}
      <Topbar PageTitle="Dashboard"></Topbar>

      {/* ── Overview Section ── */}
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
