import { ChevronDown } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// WarehouseSelect — reusable select for warehouse picker modals
// Props:
//   warehouses: [{ id, label, value, is_default }]
//   value: selected warehouse id string
//   onChange: (id, label) => void
//   label: string  (optional label above field)
//   required: bool
// ─────────────────────────────────────────────────────────────────────────────
export default function WarehouseSelect({ warehouses = [], value, onChange, label = '*Select Warehouse', required = false }) {
    return (
        <div className="text-left">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => {
                        const opt = warehouses.find((w) => w.value === e.target.value);
                        onChange(e.target.value, opt?.label ?? '');
                    }}
                    className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
                >
                    <option value="">Warehouse name here</option>
                    {warehouses.map((w) => (
                        <option key={w.value} value={w.value}>
                            {w.label}{w.is_default ? ' (Default)' : ''}
                        </option>
                    ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}