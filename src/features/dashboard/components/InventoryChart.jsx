import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Calendar } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// InventoryChart — Line chart matching Figma "Inventory Status" section
// ─────────────────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        background: "#1E293B",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        border: "none",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span style={{ color: "#94A3B8" }}>{entry.name}:</span>
          <span className="text-white font-medium">
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function InventoryChart({ data, loading }) {
  const [dateRange] = useState("01 Oct 2025 - 31 Oct 2025");

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-base font-semibold"
          style={{ fontFamily: "'Sora', sans-serif", color: "#0F172A" }}
        >
          Inventory Status
        </h3>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            color: "#64748B",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <Calendar size={12} color="#94A3B8" />
          {dateRange}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F1F5F9"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{
              fontSize: 11,
              fill: "#94A3B8",
              fontFamily: "'DM Sans', sans-serif",
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{
              fontSize: 11,
              fill: "#94A3B8",
              fontFamily: "'DM Sans', sans-serif",
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
          />
          <Tooltip content={<CustomTooltip />} />
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
            strokeDasharray="0"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 justify-center">
        {[
          { label: "Stock-In", color: "#6366F1" },
          { label: "Stock-Out", color: "#EC4899" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: color }}
            />
            <span
              className="text-xs"
              style={{ color: "#64748B", fontFamily: "'DM Sans', sans-serif" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
