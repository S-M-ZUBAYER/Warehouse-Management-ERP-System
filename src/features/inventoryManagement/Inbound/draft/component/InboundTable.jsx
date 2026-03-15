import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// InboundTable — shared table for Draft and OnTheWay
// actionItems: array of { label, onClick, danger? } for the 3-dot menu
// ─────────────────────────────────────────────────────────────────────────────

export default function InboundTable({
  items,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  actionItems,
}) {
  const [openActionId, setOpenActionId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const actionRefs = useRef({});

  const allSelected =
    items.length > 0 && items.every((i) => selectedIds.includes(i.id));
  const someSelected =
    items.some((i) => selectedIds.includes(i.id)) && !allSelected;

  useEffect(() => {
    const handler = (e) => {
      if (openActionId !== null) {
        const ref = actionRefs.current[openActionId];
        if (ref && !ref.contains(e.target)) setOpenActionId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openActionId]);

  return (
    <div className="overflow-x-auto font-body">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="py-3 pl-5 w-12 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={onToggleAll}
                className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
              />
            </th>
            {[
              "Inbound ID",
              "Image",
              "Warehouse Name",
              "Estimated Arrival Time",
              "Details",
              "Actions",
            ].map((h) => (
              <th
                key={h}
                className="py-3 pr-4 text-left text-sm font-semibold text-slate-700"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-surface-border">
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="py-14 text-center text-sm text-slate-400"
              >
                No items found
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <>
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-surface/50 ${isSelected ? "bg-blue-50/40" : ""}`}
                  >
                    {/* Checkbox */}
                    <td className="pl-5 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                      />
                    </td>

                    {/* Inbound ID */}
                    <td className="py-3 pr-4 font-mono text-xs text-slate-700 font-medium">
                      {item.inboundId}
                    </td>

                    {/* Image */}
                    <td className="py-3 pr-4">
                      <img
                        src={item.image}
                        alt={item.inboundId}
                        className="w-9 h-9 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/36x36/E6ECF0/004368?text=?";
                        }}
                      />
                    </td>

                    {/* Warehouse Name */}
                    <td className="py-3 pr-4 text-slate-700">
                      {item.warehouseName}
                    </td>

                    {/* Estimated Arrival Time */}
                    <td className="py-3 pr-4 text-slate-500 text-xs">
                      {item.estimatedArrival}
                    </td>

                    {/* Details — expand chevron */}
                    <td className="py-3 pr-4">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === item.id ? null : item.id)
                        }
                        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${expandedId === item.id ? "rotate-180" : ""}`}
                        />
                      </button>
                    </td>

                    {/* Actions — 3-dot menu */}
                    <td className="py-3 pr-5">
                      <div
                        className="relative"
                        ref={(el) => (actionRefs.current[item.id] = el)}
                      >
                        <button
                          onClick={() =>
                            setOpenActionId(
                              openActionId === item.id ? null : item.id,
                            )
                          }
                          className="flex items-center gap-0.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-surface-card transition-colors"
                        >
                          {[1, 2, 3].map((d) => (
                            <span
                              key={d}
                              className="w-1 h-1 rounded-full bg-current mx-px"
                            />
                          ))}
                        </button>

                        {openActionId === item.id && actionItems && (
                          <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1.5 w-36">
                            {actionItems.map(
                              ({ label, onClick, danger, icon: Icon }) => (
                                <button
                                  key={label}
                                  onClick={() => {
                                    onClick?.(item);
                                    setOpenActionId(null);
                                  }}
                                  className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs transition-colors
                                  ${danger ? "text-red-500 hover:bg-red-50" : "text-slate-700 hover:bg-surface-card"}`}
                                >
                                  {Icon && (
                                    <Icon
                                      size={13}
                                      className="text-slate-400"
                                    />
                                  )}
                                  {label}
                                </button>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expandedId === item.id && (
                    <tr key={`${item.id}-exp`} className="bg-surface/50">
                      <td colSpan={8} className="px-10 py-3">
                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-slate-400 mb-0.5">Inbound ID</p>
                            <p className="font-semibold text-slate-700">
                              {item.inboundId}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-0.5">Warehouse</p>
                            <p className="font-semibold text-slate-700">
                              {item.warehouseName}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-0.5">
                              Estimated Arrival
                            </p>
                            <p className="font-semibold text-slate-700">
                              {item.estimatedArrival}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-0.5">Status</p>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Draft
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
