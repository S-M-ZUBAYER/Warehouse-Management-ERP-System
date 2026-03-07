import { Package, Boxes, AlertTriangle, XCircle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// KPICard — matches the 4 overview cards in the Figma design
// ─────────────────────────────────────────────────────────────────────────────

const ICONS = {
  package: Package,
  boxes: Boxes,
  alert: AlertTriangle,
  "x-circle": XCircle,
};

export default function KPICard({ label, value, icon, color, bg, loading }) {
  const Icon = ICONS[icon] || Package;

  if (loading) {
    return (
      <div
        className="rounded-2xl p-5 bg-white animate-pulse"
        style={{ border: "1px solid #F1F5F9", minHeight: "110px" }}
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 mb-4" />
        <div className="h-7 w-24 bg-slate-100 rounded mb-2" />
        <div className="h-3 w-20 bg-slate-100 rounded" />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 bg-white transition-all duration-200 cursor-default group"
      style={{
        border: "1px solid #F1F5F9",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "";
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: bg }}
      >
        <Icon size={20} color={color} strokeWidth={1.8} />
      </div>

      {/* Value */}
      <p
        className="text-2xl font-display font-bold mb-1 leading-none"
        style={{
          color: "#0F172A",
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </p>

      {/* Label */}
      <p className="text-xs font-medium font-body" style={{ color: "#94A3B8" }}>
        {label}
      </p>
    </div>
  );
}
