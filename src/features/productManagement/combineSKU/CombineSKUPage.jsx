import { Search, Plus, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCombineSKUList } from "../hooks/useCombineSKUList";
import Topbar from "../../../components/layout/Topbar";

// ─────────────────────────────────────────────────────────────────────────────
// CombineSKUPage — Matches Figma Image 2 exactly:
//   • Search bar at top with "Search" button
//   • "Combine SKUs" section + "+ Add Combine SKU" button (right)
//   • Table: Select | Image | SKU | Bundle SKU Name | Details | Actions
//   • Footer: Export (dropdown) | Print
// ─────────────────────────────────────────────────────────────────────────────

export default function CombineSKUPage() {
  const navigate = useNavigate();

  const {
    search,
    setSearch,
    bundles,
    selectedIds,
    toggleSelect,
    toggleAll,
    allSelected,
    someSelected,
  } = useCombineSKUList();

  return (
    <div className="space-y-4 font-body">
      {/* ── Page Title ── */}
      <Topbar PageTitle="Product Management"></Topbar>
      {/* ── Top Search Bar ── */}
      <div className="bg-white rounded-xl border border-surface-border p-4">
        <div className="flex items-center gap-3 max-w-sm">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-96 pl-9 pr-3 py-2 text-sm bg-white border border-surface-border rounded-lg
                         text-slate-700 placeholder-slate-400 outline-none
                         focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <button
            className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark
                       text-white rounded-lg transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* ── Combine SKUs card ── */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-xl font-bold text-slate-800 font-display">
            Combine SKUs
          </h2>
          <button
            onClick={() =>
              navigate("/warehouse_management/products/combine_sku/add")
            }
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                       bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <Plus size={14} />
            Add Combine SKU
          </button>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-surface-border bg-white">
                <th className="py-3 pl-5 text-left w-32">
                  {" "}
                  {/* ✅ fixed width instead of max-w */}
                  <div className="flex items-center">
                    {" "}
                    {/* ✅ move flex to inner div, not th */}
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = someSelected && !allSelected;
                        }
                      }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                    <span className="pl-2 text-base font-semibold text-primary-text whitespace-nowrap">
                      Select All
                    </span>
                  </div>
                </th>
                <th className="w-16 py-3 text-left">
                  <span className="font-semibold text-base text-primary-text  tracking-wide">
                    Image
                  </span>
                </th>
                <th className="w-28 py-3 text-left pr-4">
                  <span className="font-semibold text-base text-primary-text  tracking-wide">
                    SKU
                  </span>
                </th>
                <th className="py-3 text-left pr-4">
                  <span className="font-semibold text-base text-primary-text  tracking-wide">
                    Bundle SKU Name
                  </span>
                </th>
                <th className="w-24 py-3 text-left pr-4">
                  <span className="font-semibold text-base text-primary-text  tracking-wide">
                    Details
                  </span>
                </th>
                <th className="w-24 py-3 text-left pr-5">
                  <span className="font-semibold text-base text-primary-text  tracking-wide">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-border">
              {bundles.map((bundle) => {
                const isChecked = selectedIds.includes(bundle.id);
                return (
                  <tr
                    key={bundle.id}
                    className={`transition-colors hover:bg-surface/60 ${isChecked ? "bg-blue-50/40" : ""}`}
                  >
                    {/* Checkbox */}
                    <td className="pl-5 py-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(bundle.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                      />
                    </td>

                    {/* Image */}
                    <td className="py-2">
                      <img
                        src={bundle.image}
                        alt={bundle.name}
                        className="w-9 h-9 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/36x36/E6ECF0/004368?text=?";
                        }}
                      />
                    </td>

                    {/* SKU */}
                    <td className="py-2 pr-4">
                      <span className="text-sm font-medium text-slate-700">
                        {bundle.sku}
                      </span>
                    </td>

                    {/* Bundle SKU Name */}
                    <td className="py-2 pr-4">
                      <span className="text-sm text-slate-700">
                        {bundle.name}
                      </span>
                    </td>

                    {/* Details link */}
                    <td className="py-2 pr-4">
                      <button className="text-sm font-medium text-primary hover:underline">
                        Details
                      </button>
                    </td>

                    {/* Actions — 3-dot */}
                    <td className="py-2 pr-5">
                      <button className="flex items-center gap-0.5 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-surface-card transition-colors">
                        <span className="w-1 h-1 rounded-full bg-current" />
                        <span className="w-1 h-1 rounded-full bg-current mx-0.5" />
                        <span className="w-1 h-1 rounded-full bg-current" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Footer: Export + Print ── */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
          <button
            className="flex items-center gap-2 px-14 py-2.5 text-base font-semibold
                       border border-surface-border rounded-lg text-slate-700 bg-white
                       hover:bg-surface-card transition-colors"
          >
            Export
            <ChevronDown size={13} className="text-slate-400" />
          </button>
          <button
            className="px-16 py-2.5 text-base font-semibold rounded-lg bg-primary
                       hover:bg-primary-dark text-white transition-colors"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
