/**
 * ShopPlatformSelector.jsx
 *
 * A self-contained selector bar that reads/writes the global shopPlatformStore.
 * Shows:
 *   1. Shop list dropdown   (all stores across all platforms)
 *   2. Platform dropdown    (filtered to platforms for selected shop)
 *   3. Date range picker
 *
 * Flow:
 *   - User first picks a shop → platform list narrows to that shop's platform
 *   - Or user picks platform first → first store of that platform auto-selected
 *   - Date range is saved globally
 *
 * Place this component inside Topbar.jsx or anywhere in your layout.
 *
 * Usage:
 *   import ShopPlatformSelector from '@/components/shared/ShopPlatformSelector';
 *   <ShopPlatformSelector />
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar, Store, Globe } from 'lucide-react';
import { useShopPlatformStore } from '../../stores/shopPlatformStore';

// ─── tiny DateRangePicker (no external dep) ───────────────────────────────────
function DateRangePicker({ value, onChange }) {
    const [open, setOpen]   = useState(false);
    const [draft, setDraft] = useState(value);
    const ref               = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const presets = [
        { label: 'Today',        days: 0  },
        { label: 'Last 7 days',  days: 7  },
        { label: 'Last 30 days', days: 30 },
        { label: 'Last 90 days', days: 90 },
    ];

    const applyPreset = (days) => {
        const end   = new Date();
        const start = new Date();
        if (days > 0) start.setDate(start.getDate() - days);
        const fmt = (d) => d.toISOString().split('T')[0];
        const range = { startDate: fmt(start), endDate: fmt(end) };
        setDraft(range);
        onChange(range);
        setOpen(false);
    };

    const applyCustom = () => {
        onChange(draft);
        setOpen(false);
    };

    const displayText = value.startDate && value.endDate
        ? `${value.startDate}  →  ${value.endDate}`
        : 'Select date range';

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((p) => !p)}
                className="flex items-center gap-2 pl-3 pr-3 py-1.5 text-sm border border-surface-border rounded-lg bg-white text-slate-600 hover:border-primary/50 transition-colors whitespace-nowrap"
            >
                <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                <span className="text-xs font-medium">{displayText}</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl border border-surface-border shadow-xl p-4"
                    style={{ width: '280px' }}
                >
                    {/* Presets */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {presets.map((p) => (
                            <button
                                key={p.label}
                                onClick={() => applyPreset(p.days)}
                                className="text-xs py-1.5 px-3 rounded-lg border border-surface-border text-slate-600 hover:bg-surface-card hover:border-primary/40 transition-colors"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom range */}
                    <div className="space-y-2 mb-4">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Start date</p>
                            <input
                                type="date"
                                value={draft.startDate}
                                onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                                className="w-full text-xs border border-surface-border rounded-lg px-3 py-1.5 outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">End date</p>
                            <input
                                type="date"
                                value={draft.endDate}
                                onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                                className="w-full text-xs border border-surface-border rounded-lg px-3 py-1.5 outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <button
                        onClick={applyCustom}
                        className="w-full py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors"
                    >
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── ShopPlatformSelector ─────────────────────────────────────────────────────
export default function ShopPlatformSelector() {
    const {
        selectedPlatform,
        selectedShopId,
        dateRange,
        stores,
        storesByPlatform,
        dropdownsLoaded,
        dropdownsLoading,
        selectPlatform,
        selectShop,
        setDateRange,
    } = useShopPlatformStore();

    // When user selects a shop, infer its platform automatically
    const handleShopChange = (shopId) => {
        const shop = stores.find((s) => String(s.id) === String(shopId));
        if (shop) {
            // Update platform to match the selected shop's platform
            useShopPlatformStore.getState().selectPlatform(shop.platform);
            useShopPlatformStore.getState().selectShop(shopId);
        }
    };

    // Platforms available for the currently selected shop
    // Once a shop is selected, only show that shop's platform
    const selectedShop    = stores.find((s) => String(s.id) === String(selectedShopId));
    const platforms       = selectedShop
        ? [{ value: selectedShop.platform, label: selectedShop.platform }]
        : Object.keys(storesByPlatform).map((p) => ({ value: p, label: p }));

    // Stores filtered to current platform (or all if no platform)
    const filteredStores  = selectedPlatform
        ? (storesByPlatform[selectedPlatform] ?? stores)
        : stores;

    if (!dropdownsLoaded && dropdownsLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 animate-pulse">
                <div className="w-24 h-6 bg-slate-100 rounded-lg" />
                <div className="w-24 h-6 bg-slate-100 rounded-lg" />
                <div className="w-36 h-6 bg-slate-100 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {/* Shop selector */}
            <div className="relative">
                <Store size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                    value={selectedShopId}
                    onChange={(e) => handleShopChange(e.target.value)}
                    className="appearance-none pl-7 pr-7 py-1.5 text-xs border border-surface-border rounded-lg bg-white text-slate-700 outline-none focus:border-primary cursor-pointer font-medium max-w-[140px] truncate"
                >
                    <option value="">Select Shop</option>
                    {stores.map((s) => (
                        <option key={s.id} value={String(s.id)}>{s.label}</option>
                    ))}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Platform selector */}
            <div className="relative">
                <Globe size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                    value={selectedPlatform}
                    onChange={(e) => selectPlatform(e.target.value)}
                    className="appearance-none pl-7 pr-7 py-1.5 text-xs border border-surface-border rounded-lg bg-white text-slate-700 outline-none focus:border-primary cursor-pointer font-medium capitalize max-w-[120px]"
                >
                    <option value="">All Platforms</option>
                    {platforms.map((p) => (
                        <option key={p.value} value={p.value}>
                            {p.label.charAt(0).toUpperCase() + p.label.slice(1)}
                        </option>
                    ))}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Date range */}
            <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
    );
}