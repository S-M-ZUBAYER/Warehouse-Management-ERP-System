import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// OrderStatusChart — Donut chart matching Figma "Order Status" section
// ─────────────────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  const total = p.total;
  const pct = total ? ((value / total) * 100).toFixed(1) : 0;
  return (
    <div
      className="rounded-xl font-body px-4 py-3 text-sm"
      style={{
        background: "#1E293B",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: payload[0].payload.color }}
        />
        <span className="text-white font-medium">{name}</span>
      </div>
      <p style={{ color: "#94A3B8" }}>
        {value} orders ({pct}%)
      </p>
    </div>
  );
};

export default function OrderStatusChart({ data, loading }) {
  const [dateRange] = useState("01 Oct 2025 - 31 Oct 2025");
  const total = data?.reduce((sum, d) => sum + d.value, 0) || 0;

  // Inject total into each data point for tooltip
  const enriched = (data || []).map((d) => ({ ...d, total }));

  if (loading) {
    return (
      <div
        className="bg-white rounded-2xl p-6 animate-pulse"
        style={{ border: "1px solid #F1F5F9", height: "320px" }}
      >
        <div className="h-4 w-32 bg-slate-100 rounded mb-6" />
        <div className="flex gap-6">
          <div className="w-44 h-44 rounded-full bg-slate-100 mx-auto" />
          <div className="flex-1 space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-3 bg-slate-100 rounded w-full" />
            ))}
          </div>
        </div>
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
        <h3 className="text-lg font-semibold font-display text-primary-text">
          Order Status
        </h3>
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-body"
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            color: "#64748B",
          }}
        >
          <Calendar size={12} color="#94A3B8" />
          {dateRange}
        </div>
      </div>

      {/* Chart + Legend row */}
      <div className="flex items-center gap-4">
        {/* Donut */}
        <div
          className="relative flex-shrink-0"
          style={{ width: "180px", height: "180px" }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={enriched}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {enriched.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className="text-xl font-bold font-display"
              style={{ color: "#0F172A" }}
            >
              {total.toLocaleString()}
            </span>
            <span className="text-xs font-body" style={{ color: "#94A3B8" }}>
              Total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 flex-1">
          {data.map(({ name, value, color }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span
                  className="text-xs font-body"
                  style={{
                    color: "#333333",
                  }}
                >
                  {name}
                </span>
              </div>
              <span
                className="text-xs font-semibold ml-2 font-body"
                style={{
                  color: "#333333",
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
