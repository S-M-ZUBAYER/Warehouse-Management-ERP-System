import { useState } from "react";
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
import { Calendar, ChevronDown } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// SalesTrendsChart — Area chart matching Figma "Sales Trends" section
// ─────────────────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        background: "#1E293B",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <p className="font-semibold text-white mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-indigo-400" />
        <span style={{ color: "#94A3B8" }}>Sales:</span>
        <span className="text-white font-medium">
          {payload[0].value.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default function SalesTrendsChart({ data, platforms, loading }) {
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dateRange] = useState("03 Oct 2025 - 31 Oct 2025");

  // Find peak value for reference dot
  const peak = data?.reduce(
    (max, d) => (d.sales > max.sales ? d : max),
    data?.[0] || {},
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
          Sales Trends
        </h3>

        <div className="flex items-center gap-3">
          {/* Platform selector */}
          <div className="relative">
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: "#64748B", fontFamily: "'DM Sans', sans-serif" }}
            >
              <span>Select Platform</span>
              <button
                onClick={() => setShowDropdown((p) => !p)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "12px",
                  color: "#374151",
                  minWidth: "80px",
                }}
              >
                {selectedPlatform}
                <ChevronDown size={12} />
              </button>
            </div>

            {showDropdown && (
              <div
                className="absolute right-0 top-full mt-1 rounded-xl py-1 z-20"
                style={{
                  background: "#fff",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  border: "1px solid #E2E8F0",
                  minWidth: "120px",
                }}
              >
                {platforms.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setSelectedPlatform(p);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs transition-colors"
                    style={{
                      background: selectedPlatform === p ? "#F8FAFC" : "none",
                      border: "none",
                      cursor: "pointer",
                      color: selectedPlatform === p ? "#6366F1" : "#374151",
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: selectedPlatform === p ? 600 : 400,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F8FAFC")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        selectedPlatform === p ? "#F8FAFC" : "none")
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date range */}
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
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818CF8" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#818CF8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F1F5F9"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{
              fontSize: 10,
              fill: "#94A3B8",
              fontFamily: "'DM Sans', sans-serif",
            }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{
              fontSize: 10,
              fill: "#94A3B8",
              fontFamily: "'DM Sans', sans-serif",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#salesGradient)"
            activeDot={{ r: 5, fill: "#6366F1" }}
          />
          {/* Peak dot */}
          {peak && (
            <ReferenceDot
              x={peak.date}
              y={peak.sales}
              r={5}
              fill="#EF4444"
              stroke="#fff"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
