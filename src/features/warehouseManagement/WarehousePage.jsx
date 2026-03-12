import { Plus, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useWarehouse } from "./hooks/useWarehouse";
import WarehouseTable from "./components/WarehouseTable";
import AddWarehouseModal from "./components/AddWarehouseModal";
import Topbar from "../../components/layout/Topbar";

// ─────────────────────────────────────────────────────────────────────────────
// WarehousePage — matches Figma image 1 exactly:
//
//   ┌─────────────────────────────────────────────────────────────┐
//   │  [Select Platform ▼] ........................ [+ Add New Warehouse] │  ← dashed blue border card
//   └─────────────────────────────────────────────────────────────┘
//   ┌─────────────────────────────────────────────────────────────┐
//   │  Warehouses List                                             │
//   │  Warehouse Name | Warehouse Attribute | Location | SKU | Default │
//   │  rows...                                                     │
//   └─────────────────────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────────────────

export default function WarehousePage() {
  const [platformOpen, setPlatformOpen] = useState(false);

  const {
    warehouses,
    platform,
    setPlatform,
    platforms,
    showModal,
    openModal,
    closeModal,
    form,
    handleFormChange,
    handleAttributeChange,
    errors,
    saving,
    handleAdd,
    toggleDefault,
  } = useWarehouse();

  return (
    <div className="space-y-5 font-body">
      {/* ── Page Title ── */}
      <Topbar PageTitle="Warehouse Management"></Topbar>
      {/* ── Top filter bar — dashed blue border matching Figma ── */}
      <div className="bg-white rounded-xl px-5 py-4 flex items-end justify-between gap-4">
        {/* Select Platform dropdown */}
        <div className="w-64">
          <p className="text-xs font-semibold text-slate-600 mb-1.5">
            Select Platform
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setPlatformOpen((p) => !p)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white
                         border border-surface-border rounded-lg text-sm text-left
                         hover:border-primary/40 transition-colors focus:outline-none
                         focus:border-primary"
            >
              <span
                className={
                  platform === "Platform Name Here"
                    ? "text-slate-400"
                    : "text-slate-700"
                }
              >
                {platform}
              </span>
              <ChevronDown
                size={14}
                className={`text-slate-400 flex-shrink-0 transition-transform ${platformOpen ? "rotate-180" : ""}`}
              />
            </button>

            {platformOpen && (
              <div
                className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl
                           border border-surface-border shadow-lg py-1 min-w-full"
              >
                {platforms.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPlatform(p);
                      setPlatformOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors
                      ${
                        platform === p
                          ? "text-primary font-semibold bg-blue-50"
                          : "text-slate-700 hover:bg-surface-card"
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add New Warehouse button */}
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                     bg-primary hover:bg-primary-dark text-white rounded-lg
                     transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
        >
          <Plus size={15} />
          Add New Warehouse
        </button>
      </div>

      {/* ── Warehouses List card ── */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        {/* Card header */}
        <div className="px-5 py-4 border-b border-surface-border">
          <h2 className="text-xl font-bold text-primary-text font-display">
            Warehouses List
          </h2>
        </div>

        {/* Table */}
        <div className="px-5">
          <WarehouseTable
            warehouses={warehouses}
            onToggleDefault={toggleDefault}
          />
        </div>
      </div>

      {/* ── Add Warehouse Modal ── */}
      <AddWarehouseModal
        isOpen={showModal}
        form={form}
        errors={errors}
        saving={saving}
        onFormChange={handleFormChange}
        onAttributeChange={handleAttributeChange}
        onAdd={handleAdd}
        onClose={closeModal}
      />
    </div>
  );
}
