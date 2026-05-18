import { useDashboardData } from "./hooks/useDashboardData";
import KPICard from "./components/KPICard";
import InventoryChart from "./components/InventoryChart";
import OrderStatusChart from "./components/OrderStatusChart";
import SalesTrendsChart from "./components/SalesTrendsChart";
import Topbar from "../../components/layout/Topbar";

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
  const {
    loading,
    kpiCards,
    inventoryData,
    orderStatusData,
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
  } = useDashboardData();

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
          Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <KPICard key={card.id} {...card} loading={loading} />
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
        <OrderStatusChart data={orderStatusData} loading={loading} />
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
