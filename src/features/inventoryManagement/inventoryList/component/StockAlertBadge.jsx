// ─────────────────────────────────────────────────────────────────────────────
// StockAlertBadge — matches Figma exactly
// In Stock   → green pill
// Out of Stock → red pill
// Low Stock  → orange/amber pill
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  "In Stock": {
    text: "text-emerald-700",
    bg: "bg-emerald-100",
    border: "border-emerald-200",
  },
  "Out of Stock": {
    text: "text-red-700",
    bg: "bg-red-100",
    border: "border-red-200",
  },
  "Low Stock": {
    text: "text-amber-700",
    bg: "bg-amber-100",
    border: "border-amber-200",
  },
};

export default function StockAlertBadge({ status }) {
  const cfg = CONFIG[status] || CONFIG["In Stock"];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border
                  ${cfg.text} ${cfg.bg} ${cfg.border}`}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        minWidth: "80px",
        justifyContent: "center",
      }}
    >
      {status}
    </span>
  );
}
