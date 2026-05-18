import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { ChevronDown } from "lucide-react";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const labelForPlatform = (value) => {
  if (!value || value === "all") return "All";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const CustomTooltip = ({ active, payload, label, coordinate }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  const x = (coordinate?.x || 0) + 12;
  const y = Math.max((coordinate?.y || 0) - 48, 0);

  return (
    <>
    <div
      className="rounded-xl px-4 py-3 text-sm font-body"
      style={{
        "--tooltip-x": `${x}px`,
        "--tooltip-y": `${y}px`,
        background: "#1E293B",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        minWidth: "170px",
        pointerEvents: "none",
        position: "absolute",
        transform: "translate(var(--tooltip-x), var(--tooltip-y)) scale(1)",
        transformOrigin: "top left",
        animation: "salesTooltipZoomIn 140ms ease-out",
      }}
    >
      <p className="font-semibold text-white mb-1">Day {label}</p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span style={{ color: "#94A3B8" }}>Sales:</span>
        </div>
        <span className="text-white font-medium">{Number(row.sales || 0).toLocaleString()}</span>
      </div>
      <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
        Orders: {Number(row.orders || 0).toLocaleString()} · Qty: {Number(row.quantity || 0).toLocaleString()}
      </p>
      {Number(row.sales || 0) <= 0 && Number(row.chartValue || 0) > 0 && (
        <p className="text-xs mt-1" style={{ color: "#CBD5E1" }}>
          Graph: {row.chartMetric} {Number(row.chartValue || 0).toLocaleString()}
        </p>
      )}
    </div>
    <style>{`
      @keyframes salesTooltipZoomIn {
        from {
          opacity: 0;
          transform: translate(var(--tooltip-x), var(--tooltip-y)) scale(0.94);
        }
        to {
          opacity: 1;
          transform: translate(var(--tooltip-x), var(--tooltip-y)) scale(1);
        }
      }
    `}</style>
    </>
  );
};

function SelectBox({ value, onChange, children, minWidth = 110, numeric = false }) {
  return (
    <div className="relative" style={{ minWidth }}>
      <select
        value={value}
        onChange={(e) => onChange(numeric ? Number(e.target.value) : e.target.value)}
        className="w-full appearance-none text-xs border border-surface-border rounded-lg bg-white pl-3 pr-9 py-1.5 text-slate-600 outline-none focus:border-primary cursor-pointer font-medium capitalize"
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

export default function SalesTrendsChart({
  data,
  platforms = ["all"],
  loading,
  years = [],
  selectedYear,
  selectedMonth,
  selectedPlatform,
  onYearChange,
  onMonthChange,
  onPlatformChange,
}) {
  const chartData = (data || []).map((row) => {
    const sales = Number(row.sales || 0);
    const quantity = Number(row.quantity || 0);
    const orders = Number(row.orders || 0);

    // Some marketplace/order rows may not have sale_price yet. In that case
    // sales is 0 while quantity/orders are present, so draw the graph with
    // quantity/orders instead of leaving the line flat at zero.
    const chartValue = sales > 0 ? sales : quantity > 0 ? quantity : orders;
    const chartMetric = sales > 0 ? "Sales" : quantity > 0 ? "Qty" : orders > 0 ? "Orders" : "Sales";

    return {
      ...row,
      sales,
      quantity,
      orders,
      chartValue,
      chartMetric,
    };
  });

  const peak = chartData.reduce(
    (max, d) => (Number(d.chartValue || 0) > Number(max?.chartValue || 0) ? d : max),
    chartData[0] || null
  );

  if (loading) {
    return (
      <div
        className="bg-white rounded-2xl p-6 animate-pulse"
        style={{ border: "1px solid #F1F5F9", height: "260px" }}
      >
        <div className="h-4 w-28 bg-slate-100 rounded mb-6" />
        <div className="h-40 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl p-6"
      style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg text-primary-text font-semibold font-display">Sales Trends</h3>
          <p className="text-xs text-slate-400 mt-1">Daily sales for selected month</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-primary-text font-body">Select Platform</span>
          <SelectBox value={selectedPlatform} onChange={onPlatformChange} minWidth={105}>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>{labelForPlatform(platform)}</option>
            ))}
          </SelectBox>
          <SelectBox value={selectedYear} onChange={onYearChange} minWidth={90} numeric>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </SelectBox>
          <SelectBox value={selectedMonth} onChange={onMonthChange} minWidth={125} numeric>
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </SelectBox>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818CF8" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#818CF8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "'Inter Tight', sans-serif" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "'Inter Tight', sans-serif" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, "dataMax"]}
          />
          <Tooltip
            content={<CustomTooltip />}
            allowEscapeViewBox={{ x: true, y: true }}
            offset={12}
            position={{ x: 0, y: 0 }}
          />
          <Area
            type="monotone"
            dataKey="chartValue"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#salesGradient)"
            activeDot={{ r: 5, fill: "#6366F1" }}
          />
          {peak && Number(peak.chartValue || 0) > 0 && (
            <ReferenceDot x={peak.label} y={peak.chartValue} r={5} fill="#EF4444" stroke="#fff" strokeWidth={2} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
