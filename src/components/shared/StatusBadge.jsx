// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge — active / inactive / archived pill
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  inactive: {
    label: "Inactive",
    dot: "bg-slate-400",
    text: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
  archived: {
    label: "Archived",
    dot: "bg-orange-400",
    text: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status?.toLowerCase()] || CONFIG.inactive;
  return (
    <span
      className={`inline-flex items-center font-body gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                  ${cfg.text} ${cfg.bg} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
