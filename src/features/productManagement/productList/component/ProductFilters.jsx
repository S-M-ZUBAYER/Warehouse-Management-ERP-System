import { Search, Filter, X, ChevronDown } from "lucide-react";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// ProductFilters — search bar + category dropdown filter row
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductFilters({
  search,
  onSearch,
  filterCategory,
  onCategory,
  categories,
}) {
  const [catOpen, setCatOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-surface-border font-body">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search by product name, SKU, brand…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 text-sm bg-surface rounded-xl border border-surface-border
                     text-slate-700 placeholder-slate-400 outline-none transition-all
                     focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
        {search && (
          <button
            onClick={() => onSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="relative">
        <button
          onClick={() => setCatOpen((p) => !p)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-surface-border
                     bg-white text-slate-600 hover:bg-surface-card transition-colors min-w-36"
        >
          <Filter size={14} className="text-slate-400" />
          <span className="flex-1 text-left">
            {filterCategory === "All" ? "All Categories" : filterCategory}
          </span>
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform ${catOpen ? "rotate-180" : ""}`}
          />
        </button>

        {catOpen && (
          <div
            className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-surface-border
                       shadow-lg z-20 py-1 min-w-44"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  onCategory(cat);
                  setCatOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors
                  ${
                    filterCategory === cat
                      ? "text-primary font-semibold bg-blue-50"
                      : "text-slate-600 hover:bg-surface-card"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
