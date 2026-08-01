// ─────────────────────────────────────────────────────────────────────────────
// WarehouseTable — matches Figma image 1 table exactly
// Columns: Warehouse Name | Warehouse Attribute | Warehouse Location |
//          Total SKU | Set As Default (toggle)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { AlertCircle, MoreHorizontal, Pencil, RefreshCw, Trash2, Eye } from "lucide-react";
import PortalActionMenu from "../../../components/shared/PortalActionMenu";

export default function WarehouseTable({ warehouses, loading = false, isError = false, errorMessage = "Failed to load warehouses", onRetry, onToggleDefault, onDetails, onEdit, onDelete }) {
  const [openActionId, setOpenActionId] = useState(null);
  const [openActionAnchor, setOpenActionAnchor] = useState(null);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base font-body">
        <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
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
          {loading ? (
            <WarehouseTableSkeleton />
          ) : isError ? (
            <tr>
              <td colSpan={6} className="py-20 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <AlertCircle size={36} className="text-red-400 opacity-70" />
                  <p className="text-sm font-medium text-slate-700">{errorMessage}</p>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      <RefreshCw size={12} /> Retry
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ) : warehouses.length === 0 ? (
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
                  <div className="relative">
                    <button
                      onClick={(event) => {
                        setOpenActionAnchor(event.currentTarget);
                        setOpenActionId(openActionId === wh.id ? null : wh.id);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    <PortalActionMenu
                      open={openActionId === wh.id}
                      anchorRef={{ current: openActionAnchor }}
                      onClose={() => {
                        setOpenActionId(null);
                        setOpenActionAnchor(null);
                      }}
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
function WarehouseTableSkeleton() {
  return Array.from({ length: 6 }).map((_, index) => (
    <tr key={index} className="animate-pulse">
      <td className="py-3.5 pr-6 pl-1">
        <div className="h-4 w-36 rounded bg-slate-200" />
      </td>
      <td className="py-3.5 pr-6">
        <div className="h-4 w-28 rounded bg-slate-200" />
      </td>
      <td className="py-3.5 pr-6">
        <div className="h-4 w-52 rounded bg-slate-200" />
      </td>
      <td className="py-3.5 pr-6">
        <div className="h-4 w-14 rounded bg-slate-200" />
      </td>
      <td className="py-3.5">
        <div className="h-5 w-9 rounded-full bg-slate-200" />
      </td>
      <td className="py-3.5">
        <div className="h-8 w-8 rounded-lg bg-slate-200" />
      </td>
    </tr>
  ));
}

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
