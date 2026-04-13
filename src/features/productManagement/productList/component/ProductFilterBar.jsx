import { X } from "lucide-react";
import SelectDropdown from "../../../../components/shared/SelectDropdown";

export default function ProductFilterBar({
  warehouseOptions,
  warehouseFilterName,
  handleWarehouseFilterChange,
  statusOptions,
  productStatus,
  setProductStatus,
  countryOptions,
  country,
  setCountry,
  sku,
  setSku,
  setPage,
  resetFilters,
  hasActiveFilters,
  dropdownsLoading,
}) {
  return (
    <div className="bg-white rounded-xl border border-surface-border p-4">
      <div className="grid grid-cols-4 gap-3">
        <SelectDropdown
          label="Select Warehouse"
          placeholder="Warehouse name here"
          options={warehouseOptions.map((w) => w.label)}
          value={warehouseFilterName}
          onChange={(label) => {
            const opt = warehouseOptions.find((w) => w.label === label);
            handleWarehouseFilterChange(opt?.value ?? "all", label);
          }}
          loading={dropdownsLoading}
        />
        <SelectDropdown
          label="Product Status"
          placeholder="Product Status here"
          options={statusOptions.map((s) => s.label)}
          value={
            statusOptions.find((s) => s.value === productStatus)?.label ??
            "All Status"
          }
          onChange={(label) => {
            const opt = statusOptions.find((s) => s.label === label);
            setProductStatus(opt?.value ?? "all");
            setPage(1);
          }}
        />
        <SelectDropdown
          label="Select Country"
          placeholder="Country name here"
          options={countryOptions.map((c) => c.label)}
          value={
            countryOptions.find((c) => c.value === country)?.label ??
            "All Countries"
          }
          onChange={(label) => {
            const opt = countryOptions.find((c) => c.label === label);
            setCountry(opt?.value ?? "all");
            setPage(1);
          }}
          loading={dropdownsLoading}
        />
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-1.5">SKU</p>
          <input
            type="text"
            placeholder="SKU"
            value={sku}
            onChange={(e) => {
              setSku(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm
                       text-slate-700 placeholder-slate-400 outline-none
                       focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500">Active filters applied</span>
          <button
            onClick={resetFilters}
            className="text-xs text-primary hover:text-primary-dark font-semibold flex items-center gap-1 transition-colors"
          >
            <X size={11} /> Clear all
          </button>
        </div>
      )}
    </div>
  );
}
