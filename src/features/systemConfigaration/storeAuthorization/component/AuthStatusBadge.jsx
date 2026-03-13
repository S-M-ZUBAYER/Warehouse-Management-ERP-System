const CONFIG = {
  Authorized: {
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  Pending: {
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  Rejected: { text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  "In Review": {
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  Completed: {
    text: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
};

export default function AuthStatusBadge({ status }) {
  const cfg = CONFIG[status] || CONFIG["Pending"];
  return (
    <span className={`text-xs font-medium px-0 font-body ${cfg.text}`}>
      {status}
    </span>
  );
}
