// ─────────────────────────────────────────────────────────────────────────────
// WarehouseTable — matches Figma image 1 table exactly
// Columns: Warehouse Name | Warehouse Attribute | Warehouse Location |
//          Total SKU | Set As Default (toggle)
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import PortalActionMenu from "../../../components/shared/PortalActionMenu";

export default function WarehouseTable({ warehouses, onToggleDefault, onDetails, onEdit, onDelete }) {
  const [openActionId, setOpenActionId] = useState(null);
  const actionRefs = useRef({});
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base font-body">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="py-3 text-left font-semibold text-primary-text pr-6 pl-1 w-[22%]">
              Warehouse Name
            </th>
            <th className="py-3 text-left font-semibold text-primary-text pr-6 w-[24%]">
              Warehouse Attribute
            </th>
            <th className="py-3 text-left font-semibold text-primary-text pr-6 w-[32%]">
              Warehouse Location
            </th>
            <th className="py-3 text-left font-semibold text-primary-text pr-6 w-[12%]">
              Total SKU
            </th>
            <th className="py-3 text-left font-semibold text-primary-text w-[10%]">
              Set As Default
            </th>
            <th className="py-3 text-left font-semibold text-primary-text w-[8%]">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y text-sm divide-surface-border">
          {warehouses.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="py-14 text-center text-sm text-slate-400 font-body"
              >
                No warehouses found
              </td>
            </tr>
          ) : (
            warehouses.map((wh) => (
              <tr key={wh.id} className="hover:bg-surface/60 transition-colors">
                {/* Warehouse Name */}
                <td className="py-3.5 pr-6 pl-1">
                  <span className="text-slate-800 font-medium">{wh.name}</span>
                </td>

                {/* Warehouse Attribute */}
                <td className="py-3.5 pr-6">
                  <span className="text-slate-600">{wh.attribute}</span>
                </td>

                {/* Warehouse Location */}
                <td className="py-3.5 pr-6">
                  <span className="text-slate-600">{wh.location}</span>
                </td>

                {/* Total SKU */}
                <td className="py-3.5 pr-6">
                  <span
                    className={`font-medium ${wh.totalSku === 0 ? "text-slate-400" : "text-slate-800"}`}
                  >
                    {wh.totalSku.toLocaleString()}
                  </span>
                </td>

                {/* Set As Default — toggle switch */}
                <td className="py-3.5">
                  <ToggleSwitch
                    checked={wh.isDefault}
                    onChange={() => onToggleDefault(wh.id)}
                  />
                </td>
                <td className="py-3.5">
                  <div className="relative" ref={(el) => (actionRefs.current[wh.id] = el)}>
                    <button
                      onClick={() => setOpenActionId(openActionId === wh.id ? null : wh.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    <PortalActionMenu
                      open={openActionId === wh.id}
                      anchorRef={{ current: actionRefs.current[wh.id] }}
                      onClose={() => setOpenActionId(null)}
                      width={140}
                    >
                      <button onClick={() => { setOpenActionId(null); onDetails?.(wh); }} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">
                        <Eye size={12} /> Details
                      </button>
                      <button onClick={() => { setOpenActionId(null); onEdit?.(wh); }} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => { setOpenActionId(null); onDelete?.(wh); }} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-500 hover:bg-red-50">
                        <Trash2 size={12} /> Delete
                      </button>
                    </PortalActionMenu>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Pill toggle switch matching Figma grey pill style ──────────────────────
function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0
        ${checked ? "bg-primary" : "bg-slate-300"}`}
    >
      <span
        className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200
          ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`}
      />
    </button>
  );
}
