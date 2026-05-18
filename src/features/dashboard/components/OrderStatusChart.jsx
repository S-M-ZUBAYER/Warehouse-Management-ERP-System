import { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, ChevronDown } from "lucide-react";

const formatDate = (date) => date.toISOString().split("T")[0];

const defaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { startDate: formatDate(start), endDate: formatDate(end) };
};

function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const applyPreset = (days) => {
    const end = new Date();
    const start = new Date();
    if (days > 0) start.setDate(start.getDate() - days);
    const range = { startDate: formatDate(start), endDate: formatDate(end) };
    onChange(range);
    setOpen(false);
  };

  const applyCustom = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-body bg-[#F8FAFC] border border-[#E2E8F0] text-slate-500 hover:border-primary/50 transition-colors"
      >
        <Calendar size={12} color="#94A3B8" />
        {value.startDate} → {value.endDate}
        <ChevronDown size={12} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-[280px] rounded-2xl bg-white border border-surface-border shadow-xl p-4">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: "Today", days: 0 },
              { label: "Last 7 days", days: 7 },
              { label: "Last 30 days", days: 30 },
              { label: "Last 90 days", days: 90 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.days)}
                className="text-xs py-1.5 px-3 rounded-lg border border-surface-border text-slate-600 hover:bg-surface-card hover:border-primary/40 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 mb-4">
            <label className="block">
              <span className="text-xs text-slate-500 mb-1 block">Start date</span>
              <input
                type="date"
                value={draft.startDate}
                onChange={(e) => setDraft((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full text-xs border border-surface-border rounded-lg px-3 py-1.5 outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 mb-1 block">End date</span>
              <input
                type="date"
                value={draft.endDate}
                onChange={(e) => setDraft((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full text-xs border border-surface-border rounded-lg px-3 py-1.5 outline-none focus:border-primary"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={applyCustom}
            className="w-full py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <>
      <div
        className="rounded-xl font-body px-4 py-3 text-sm"
        style={{
          background: "#1E293B",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          minWidth: "165px",
          transformOrigin: "center",
          animation: "orderTooltipZoomIn 140ms ease-out",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: payload[0].payload.color }} />
          <span className="text-white font-medium">{name}</span>
        </div>
        <p style={{ color: "#94A3B8" }}>{value} orders</p>
      </div>
      <style>{`
        @keyframes orderTooltipZoomIn {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default function OrderStatusChart({ data, loading }) {
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const total = data?.reduce((sum, d) => sum + d.value, 0) || 0;
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
      style={{ border: "1px solid #F1F5F9", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <h3 className="text-lg font-semibold font-display text-primary-text">Order Status</h3>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0" style={{ width: "180px", height: "180px" }}>
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
              <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 20 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold font-display" style={{ color: "#0F172A" }}>
              {total.toLocaleString()}
            </span>
            <span className="text-xs font-body" style={{ color: "#94A3B8" }}>Total</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 flex-1">
          {data.map(({ name, value, color }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-xs font-body" style={{ color: "#333333" }}>{name}</span>
              </div>
              <span className="text-xs font-semibold ml-2 font-body" style={{ color: "#333333" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
