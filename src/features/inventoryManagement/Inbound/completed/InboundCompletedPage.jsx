import { useState, useRef, useEffect } from "react";
import { ChevronDown, Calendar, Search, Pencil, Trash2 } from "lucide-react";
import Topbar from "../../../../components/layout/Topbar";
import InvFooter from "../../shared/components/InvFooter";
import { MOCK_INBOUND_LIST, WAREHOUSES } from "../../shared/mockData";

// ─────────────────────────────────────────────────────────────────────────────
// InboundCompletedPage — Images 11 & 12
// Filter: Select Warehouse | Select Time | All dropdown | Date range | Inbound No | Search
// Table: Select | Inbound ID | Image | Warehouse Name | Estimated Arrival Time | Details (chevron) | Actions (3-dot: Edit/Delete)
// ─────────────────────────────────────────────────────────────────────────────

export default function InboundCompletedPage() {
  const [warehouse, setWarehouse] = useState("Warehouse name here");
  const [timeType, setTimeType] = useState("Created Time");
  const [statusAll, setStatusAll] = useState("All");
  const [inboundNo, setInboundNo] = useState("Inbound No.");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [openActionId, setOpenActionId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const actionRefs = useRef({});

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

  const filtered = MOCK_INBOUND_LIST.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.inboundId.toLowerCase().includes(q) ||
      l.warehouseName.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const toggleAll = () => {
    const ids = filtered.map((l) => l.id);
    setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids);
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Inbound" />

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-surface-border p-4">
        <div className="flex items-end gap-2.5 flex-wrap">
          {/* Select Warehouse */}
          <div className="flex-1 min-w-36">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Warehouse
            </p>
            <div className="relative">
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
              >
                {WAREHOUSES.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Select Time */}
          <div className="w-32">
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Time
            </p>
            <div className="relative">
              <select
                value={timeType}
                onChange={(e) => setTimeType(e.target.value)}
                className="w-full appearance-none pl-3 pr-7 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
              >
                <option>Created Time</option>
                <option>Updated Time</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* All status */}
          <div className="w-24">
            <div className="relative">
              <select
                value={statusAll}
                onChange={(e) => setStatusAll(e.target.value)}
                className="w-full appearance-none pl-3 pr-7 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer mt-5"
              >
                <option>All</option>
                <option>Draft</option>
                <option>On The Way</option>
                <option>Completed</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Date range */}
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-500 hover:border-primary/40 transition-colors mt-5">
            <Calendar size={13} className="text-slate-400" />
            01 Oct 2025 - 31 Oct 2025
          </button>

          {/* Inbound No */}
          <div className="w-28">
            <div className="relative">
              <select
                value={inboundNo}
                onChange={(e) => setInboundNo(e.target.value)}
                className="w-full appearance-none pl-3 pr-7 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer mt-5"
              >
                <option>Inbound No.</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-32 relative mt-5">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Search button */}
          <button className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors mt-5">
            Search
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-slate-800 font-display">
            Completed Inbound List
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="py-3 pl-5 w-12 text-left">
                  <input
                    type="checkbox"
                    checked={
                      filtered.length > 0 &&
                      filtered.every((l) => selectedIds.includes(l.id))
                    }
                    onChange={toggleAll}
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
              {filtered.map((inbound) => (
                <>
                  <tr
                    key={inbound.id}
                    className={`hover:bg-surface/50 transition-colors ${selectedIds.includes(inbound.id) ? "bg-blue-50/40" : ""}`}
                  >
                    <td className="pl-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inbound.id)}
                        onChange={() => toggleSelect(inbound.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                      />
                    </td>
                    <td className="py-3 pr-4 font-mono text-slate-700">
                      {inbound.inboundId}
                    </td>
                    <td className="py-3 pr-4">
                      <img
                        src={inbound.image}
                        alt={inbound.inboundId}
                        className="w-9 h-9 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/36x36/E6ECF0/004368?text=?";
                        }}
                      />
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {inbound.warehouseName}
                    </td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">
                      {inbound.estimatedArrival}
                    </td>
                    {/* Details expand */}
                    <td className="py-3 pr-4">
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === inbound.id ? null : inbound.id,
                          )
                        }
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${expandedId === inbound.id ? "rotate-180" : ""}`}
                        />
                      </button>
                    </td>
                    {/* Actions 3-dot (Image 12) */}
                    <td className="py-3 pr-5">
                      <div
                        className="relative"
                        ref={(el) => (actionRefs.current[inbound.id] = el)}
                      >
                        <button
                          onClick={() =>
                            setOpenActionId(
                              openActionId === inbound.id ? null : inbound.id,
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
                        {openActionId === inbound.id && (
                          <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-28">
                            <button
                              onClick={() => setOpenActionId(null)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-surface-card transition-colors"
                            >
                              <Pencil size={12} className="text-slate-400" />{" "}
                              Edit
                            </button>
                            <button
                              onClick={() => setOpenActionId(null)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* Expanded detail row */}
                  {expandedId === inbound.id && (
                    <tr className="bg-surface/50">
                      <td colSpan={8} className="px-8 py-3">
                        <div className="grid grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-slate-400 mb-0.5">Inbound ID</p>
                            <p className="font-semibold text-slate-700">
                              {inbound.inboundId}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-0.5">Warehouse</p>
                            <p className="font-semibold text-slate-700">
                              {inbound.warehouseName}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-0.5">
                              Estimated Arrival
                            </p>
                            <p className="font-semibold text-slate-700">
                              {inbound.estimatedArrival}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 mb-0.5">Status</p>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Completed
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <InvFooter />
      </div>
    </div>
  );
}
