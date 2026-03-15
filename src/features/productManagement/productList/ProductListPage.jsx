import { Search, ChevronDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProductList } from "../hooks/useProductList";
import SelectDropdown from "../../../components/shared/SelectDropdown";
import Topbar from "../../../components/layout/Topbar";

// ─────────────────────────────────────────────────────────────────────────────
// ProductListPage — Matches Figma Image 1 exactly:
//   • Top filter bar: Select Warehouse | Product Status | Select Country | SKU
//   • "Product list" section header
//   • Search + Bulk Action | Add Products (right)
//   • Table: Select | Image | SKU | Product Name | Available in Inventory |
//            In transit Inventory | Details | Actions
//   • Footer: Export (dropdown) | Print
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductListPage() {
  const navigate = useNavigate();

  const {
    search,
    setSearch,
    warehouse,
    setWarehouse,
    productStatus,
    setProductStatus,
    country,
    setCountry,
    sku,
    setSku,
    bulkAction,
    setBulkAction,
    products,
    selectedIds,
    toggleSelect,
    toggleAll,
    allSelected,
    someSelected,
    warehouses,
    statuses,
    countries,
  } = useProductList();

  return (
    <div className="space-y-4 font-body">
      {/* ── Page Title ── */}
      <Topbar PageTitle="Product List"></Topbar>
      {/* ── Top Filter Bar ── */}
      <div className="bg-white rounded-xl border border-surface-border p-4">
        <div className="grid grid-cols-4 gap-3">
          <SelectDropdown
            label="Select Warehouse"
            placeholder="Warehouse name here"
            options={warehouses}
            value={warehouse}
            onChange={setWarehouse}
          />
          <SelectDropdown
            label="Product Status"
            placeholder="Product Status here"
            options={statuses}
            value={productStatus}
            onChange={setProductStatus}
          />
          <SelectDropdown
            label="Select Country"
            placeholder="Country name here"
            options={countries}
            value={country}
            onChange={setCountry}
          />
          {/* SKU input */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">SKU</p>
            <input
              type="text"
              placeholder="SKU"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-surface-border rounded-lg text-sm
                         text-slate-700 placeholder-slate-400 outline-none
                         focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Product list card ── */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        {/* Card header */}
        <div className="px-5 py-4 ">
          <h2 className="text-base font-bold text-slate-800 font-display">
            Product list
          </h2>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border gap-3">
          {/* Left: Search + Bulk Action */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 text-sm bg-white border border-surface-border rounded-lg
                           text-slate-700 placeholder-slate-400 outline-none w-80
                           focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            {/* Bulk Action */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm border border-surface-border
                           rounded-lg text-slate-600 bg-white hover:bg-surface-card transition-colors"
              >
                Bulk Action
                <ChevronDown size={13} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Right: Add Products */}
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                       bg-white border border-surface-border rounded-lg text-slate-700
                       hover:bg-surface-card transition-colors"
          >
            Add Products
            <ChevronDown size={13} className="text-slate-400" />
          </button>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-lg font-body">
            <thead>
              <tr className="border-b border-surface-border bg-white">
                <th className="py-3 pl-5 w-36 text-left">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = someSelected && !allSelected; // ✅ Fix: only indeterminate when SOME (not all) are selected
                        }
                      }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                    <span className="pl-2 text-base font-semibold text-primary-text">
                      Select All
                    </span>
                  </label>
                </th>
                <th className="w-16 py-3 text-left">
                  <span className="text-base font-semibold text-primary-text  tracking-wide">
                    Image
                  </span>
                </th>
                <th className="w-24 py-3 text-left pr-4">
                  <span className="text-base font-semibold text-primary-text  tracking-wide">
                    SKU
                  </span>
                </th>
                <th className="py-3 text-left pr-4">
                  <span className="text-base font-semibold text-primary-text  tracking-wide">
                    Product Name
                  </span>
                </th>
                <th className="w-50 py-3 text-left pr-4">
                  <span className="text-base font-semibold text-primary-text  tracking-wide">
                    Available in Inventory
                  </span>
                </th>
                <th className="w-50 py-3 text-left pr-4">
                  <span className="text-base font-semibold text-primary-text  tracking-wide">
                    In transit Inventory
                  </span>
                </th>
                <th className="w-20 py-3 text-left pr-4">
                  <span className="text-base font-semibold text-primary-text  tracking-wide">
                    Details
                  </span>
                </th>
                <th className="w-20 py-3 text-left pr-5">
                  <span className="text-base font-semibold text-primary-text  tracking-wide">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-border">
              {products.map((product) => {
                const isChecked = selectedIds.includes(product.id);
                return (
                  <tr
                    key={product.id}
                    className={`transition-colors hover:bg-surface/60 ${isChecked ? "bg-blue-50/40" : ""}`}
                  >
                    {/* Checkbox */}
                    <td className="pl-5 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(product.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                      />
                    </td>

                    {/* Image */}
                    <td className="py-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-9 h-9 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/36x36/E6ECF0/004368?text=?";
                        }}
                      />
                    </td>

                    {/* SKU */}
                    <td className="py-3 pr-4">
                      <span className="text-sm font-medium text-slate-700">
                        {product.sku}
                      </span>
                    </td>

                    {/* Product Name */}
                    <td className="py-3 pr-4">
                      <span className="text-sm text-slate-700">
                        {product.name}
                      </span>
                    </td>

                    {/* Available in Inventory */}
                    <td className="py-3 pr-4">
                      <span className="text-sm text-slate-600">
                        {product.availableInventory} units
                      </span>
                    </td>

                    {/* In transit Inventory */}
                    <td className="py-3 pr-4">
                      <span className="text-sm text-slate-600">
                        {product.inTransitInventory} units
                      </span>
                    </td>

                    {/* Details link */}
                    <td className="py-3 pr-4">
                      <button className="text-sm font-medium text-primary hover:underline transition-colors">
                        Details
                      </button>
                    </td>

                    {/* Actions — 3-dot menu */}
                    <td className="py-3 pr-5">
                      <button className="flex items-center gap-0.5 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-surface-card">
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
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                       border border-surface-border rounded-lg text-slate-700 bg-white
                       hover:bg-surface-card transition-colors"
          >
            Export
            <ChevronDown size={13} className="text-slate-400" />
          </button>
          <button
            className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary
                       hover:bg-primary-dark text-white transition-colors"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
