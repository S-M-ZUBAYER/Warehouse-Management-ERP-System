import { useDashboardData } from "./hooks/useDashboardData";
import KPICard from "./components/KPICard";
import InventoryChart from "./components/InventoryChart";
import OrderStatusChart from "./components/OrderStatusChart";
import SalesTrendsChart from "./components/SalesTrendsChart";

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
  } = useDashboardData();

  return (
    <div className="space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Page Title ── */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Sora', sans-serif", color: "#0F172A" }}
        >
          Dashboard
        </h1>
      </div>

      {/* ── Overview Section ── */}
      <section>
        <h2
          className="text-sm font-semibold mb-4"
          style={{
            color: "#64748B",
            textTransform: "uppercase",
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
        <InventoryChart data={inventoryData} loading={loading} />
        <OrderStatusChart data={orderStatusData} loading={loading} />
      </div>

      {/* ── Sales Trends (full width) ── */}
      <SalesTrendsChart
        data={salesTrendsData}
        platforms={platforms}
        loading={loading}
      />
    </div>
  );
}
