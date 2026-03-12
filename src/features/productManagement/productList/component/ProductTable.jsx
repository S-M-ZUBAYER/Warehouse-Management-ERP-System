import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import StatusBadge from "../../../../components/shared/StatusBadge";

// ─────────────────────────────────────────────────────────────────────────────
// ProductTable — main data table matching Figma product list design
// ─────────────────────────────────────────────────────────────────────────────

const COL_HEADERS = [
  { key: "name", label: "Product Name", sortable: true, width: "w-[30%]" },
  { key: "sku", label: "SKU", sortable: true, width: "w-[10%]" },
  {
    key: "additionalSku",
    label: "Additional SKU",
    sortable: false,
    width: "w-[12%]",
  },
  {
    key: "totalStock",
    label: "Total Stock Unit",
    sortable: true,
    width: "w-[12%]",
  },
  {
    key: "availableStock",
    label: "Available Stock",
    sortable: true,
    width: "w-[12%]",
  },
  { key: "status", label: "Status", sortable: false, width: "w-[10%]" },
  { key: "actions", label: "Actions", sortable: false, width: "w-[9%]" },
];

export default function ProductTable({
  products,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  sortField,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  onView,
}) {
  const allSelected =
    products.length > 0 && products.every((p) => selectedIds.includes(p.id));
  const someSelected =
    products.some((p) => selectedIds.includes(p.id)) && !allSelected;

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <ArrowUpDown size={12} className="text-slate-400 ml-1 inline" />;
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="text-primary ml-1 inline" />
    ) : (
      <ArrowDown size={12} className="text-primary ml-1 inline" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border bg-white">
      <table
        className="w-full text-sm"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* ── Head ── */}
        <thead>
          <tr className="bg-surface-card border-b border-surface-border">
            {/* Checkbox */}
            <th className="w-10 pl-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={onToggleAll}
                className="w-4 h-4 rounded border-slate-300 text-primary accent-primary cursor-pointer"
              />
            </th>
            {/* Image placeholder col */}
            <th className="w-12 py-3" />

            {COL_HEADERS.map((col) => (
              <th
                key={col.key}
                className={`py-3 pr-4 text-left text-xs font-semibold text-slate-500 uppercase
                            tracking-wide ${col.width}
                            ${col.sortable ? "cursor-pointer select-none hover:text-primary" : ""}`}
                onClick={() => col.sortable && onSort(col.key)}
              >
                {col.label}
                {col.sortable && <SortIcon field={col.key} />}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody className="divide-y divide-surface-border">
          {products.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="py-16 text-center text-slate-400 text-sm"
              >
                No products found
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              return (
                <tr
                  key={product.id}
                  className={`transition-colors duration-100 hover:bg-blue-50/40
                    ${isSelected ? "bg-blue-50/60" : "bg-white"}`}
                >
                  {/* Checkbox */}
                  <td className="pl-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(product.id)}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                  </td>

                  {/* Product image */}
                  <td className="py-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-9 h-9 rounded-lg object-cover border border-surface-border"
                      onError={(e) => {
                        e.target.src =
                          "https://placehold.co/36x36/E6ECF0/004368?text=?";
                      }}
                    />
                  </td>

                  {/* Name */}
                  <td className="py-3 pr-4">
                    <p
                      className="font-medium text-slate-800 truncate max-w-[200px]"
                      title={product.name}
                    >
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {product.category}
                    </p>
                  </td>

                  {/* SKU */}
                  <td className="py-3 pr-4">
                    <span
                      className="text-xs font-mono font-medium text-primary bg-blue-50
                                 px-2 py-0.5 rounded-md"
                    >
                      {product.sku}
                    </span>
                  </td>

                  {/* Additional SKU */}
                  <td className="py-3 pr-4 text-xs text-slate-500 font-mono">
                    {product.additionalSku || "—"}
                  </td>

                  {/* Total Stock */}
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-slate-800">
                      {product.totalStock.toLocaleString()}
                    </span>
                  </td>

                  {/* Available Stock */}
                  <td className="py-3 pr-4">
                    <span
                      className={`font-semibold ${
                        product.availableStock < 100
                          ? "text-red-500"
                          : product.availableStock < 300
                            ? "text-amber-500"
                            : "text-emerald-600"
                      }`}
                    >
                      {product.availableStock.toLocaleString()}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 pr-4">
                    <StatusBadge status={product.status} />
                  </td>

                  {/* Actions */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <ActionBtn
                        icon={<Eye size={14} />}
                        title="View"
                        color="text-slate-500 hover:text-primary hover:bg-blue-50"
                        onClick={() => onView?.(product)}
                      />
                      <ActionBtn
                        icon={<Pencil size={14} />}
                        title="Edit"
                        color="text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                        onClick={() => onEdit?.(product)}
                      />
                      <ActionBtn
                        icon={<Trash2 size={14} />}
                        title="Delete"
                        color="text-slate-500 hover:text-red-500 hover:bg-red-50"
                        onClick={() => onDelete(product)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActionBtn({ icon, title, color, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${color}`}
    >
      {icon}
    </button>
  );
}
