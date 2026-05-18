import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

const CustomTooltip = ({ active, payload, label, coordinate }) => {
  if (!active || !payload?.length) return null;
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
          border: "none",
          minWidth: "150px",
          pointerEvents: "none",
          position: "absolute",
          transform: "translate(var(--tooltip-x), var(--tooltip-y)) scale(1)",
          transformOrigin: "top left",
          animation: "inventoryTooltipZoomIn 140ms ease-out",
        }}
      >
        <p className="font-semibold text-white mb-2">Day {label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
              <span className="whitespace-nowrap" style={{ color: "#94A3B8" }}>{entry.name}:</span>
            </div>
            <span className="text-white font-medium">{Number(entry.value || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes inventoryTooltipZoomIn {
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

function SelectBox({ value, onChange, children, minWidth = 110 }) {
  return (
    <div className="relative" style={{ minWidth }}>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none text-xs border border-surface-border rounded-lg bg-white pl-3 pr-9 py-1.5 text-slate-600 outline-none focus:border-primary cursor-pointer font-medium"
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

export default function InventoryChart({
  data,
  loading,
  years = [],
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
}) {
  if (loading) {
    return (
      <div
        className="bg-white rounded-2xl p-6 animate-pulse"
        style={{ border: "1px solid #F1F5F9", height: "320px" }}
      >
        <div className="h-4 w-36 bg-slate-100 rounded mb-6" />
        <div className="h-52 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl p-6"
      style={{
        border: "1px solid #F1F5F9",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-semibold font-display">Inventory Status</h3>
          <p className="text-xs text-slate-400 mt-1">Daily stock-in and stock-out for selected month</p>
        </div>
        <div className="flex items-center gap-2">
          <SelectBox value={selectedYear} onChange={onYearChange} minWidth={90}>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </SelectBox>
          <SelectBox value={selectedMonth} onChange={onMonthChange} minWidth={125}>
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </SelectBox>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "'Inter Tight', sans-serif" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "'Inter Tight', sans-serif" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
          />
          <Tooltip
            content={<CustomTooltip />}
            allowEscapeViewBox={{ x: true, y: true }}
            offset={12}
            position={{ x: 0, y: 0 }}
          />
          <Line
            type="monotone"
            dataKey="stockIn"
            name="Stock In"
            stroke="#6366F1"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#6366F1" }}
          />
          <Line
            type="monotone"
            dataKey="stockOut"
            name="Stock Out"
            stroke="#EC4899"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: "#EC4899" }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-5 mt-3 justify-center">
        {[
          { label: "Stock-In", color: "#6366F1" },
          { label: "Stock-Out", color: "#EC4899" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-xs font-body" style={{ color: "#64748B" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
