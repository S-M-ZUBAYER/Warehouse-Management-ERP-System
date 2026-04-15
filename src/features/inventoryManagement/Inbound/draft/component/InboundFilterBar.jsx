import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar, Search, Loader2 } from 'lucide-react';

const TIME_TYPES   = ['Created Time', 'Estimated arrival time'];
const TIME_FILTERS = ['All', 'Yesterday', 'Today', 'Last 7 days', 'Last 30 days'];
const INBOUND_TYPES = ['Inbound No.', 'SKU Name', 'GTIN'];

// ─────────────────────────────────────────────────────────────────────────────
// InboundFilterBar — shared by Draft, OnTheWay, Completed
// warehouseOptions: [{ label, value }] from useInboundDropdowns
// ─────────────────────────────────────────────────────────────────────────────
export default function InboundFilterBar({
    warehouseId, setWarehouseId,
    warehouseOptions = [],
    warehouseLoading = false,
    timeType, setTimeType,
    timeFilter, setTimeFilter,
    inboundType, setInboundType,
    search, setSearch,
    onSearch,
}) {
    const [showWareDrop,    setShowWareDrop]    = useState(false);
    const [showTimeDrop,    setShowTimeDrop]    = useState(false);
    const [showAllDrop,     setShowAllDrop]     = useState(false);
    const [showInboundDrop, setShowInboundDrop] = useState(false);

    const wareRef    = useRef(null);
    const timeRef    = useRef(null);
    const allRef     = useRef(null);
    const inboundRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (wareRef.current    && !wareRef.current.contains(e.target))    setShowWareDrop(false);
            if (timeRef.current    && !timeRef.current.contains(e.target))    setShowTimeDrop(false);
            if (allRef.current     && !allRef.current.contains(e.target))     setShowAllDrop(false);
            if (inboundRef.current && !inboundRef.current.contains(e.target)) setShowInboundDrop(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectedWarehouseLabel = warehouseOptions.find((o) => o.value === warehouseId)?.label ?? 'Warehouse name here';

    const DropBtn = ({ value, onClick, open, className = '', loading = false }) => (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-between pl-3 pr-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 hover:border-primary/40 transition-colors ${className}`}
        >
            <span className="truncate">{value}</span>
            {loading
                ? <Loader2 size={12} className="text-primary animate-spin ml-2 flex-shrink-0" />
                : <ChevronDown size={13} className={`text-slate-400 ml-2 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            }
        </button>
    );

    const DropMenu = ({ options, selected, onSelect }) => (
        <div className="absolute left-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1 min-w-full w-max">
            {options.map((opt) => {
                const label = typeof opt === 'string' ? opt : opt.label;
                const value = typeof opt === 'string' ? opt : opt.value;
                return (
                    <button
                        key={value}
                        onClick={() => onSelect(value)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${selected === value ? 'text-primary font-semibold bg-blue-50' : 'text-slate-700 hover:bg-surface-card'}`}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="bg-white rounded-xl border border-surface-border p-4 font-body">
            <div className="flex items-end gap-2.5 flex-wrap">
                {/* Select Warehouse */}
                <div className="flex-1 min-w-40">
                    <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Warehouse</p>
                    <div className="relative" ref={wareRef}>
                        <DropBtn
                            value={selectedWarehouseLabel}
                            onClick={() => setShowWareDrop((p) => !p)}
                            open={showWareDrop}
                            loading={warehouseLoading}
                            className="w-full"
                        />
                        {showWareDrop && (
                            <DropMenu
                                options={warehouseOptions}
                                selected={warehouseId}
                                onSelect={(v) => { setWarehouseId(v); setShowWareDrop(false); }}
                            />
                        )}
                    </div>
                </div>

                {/* Select Time type */}
                <div className="w-44 relative" ref={timeRef}>
                    <p className="text-xs font-semibold text-slate-600 mb-1.5">Select Time</p>
                    <DropBtn value={timeType} onClick={() => setShowTimeDrop((p) => !p)} open={showTimeDrop} className="w-full" />
                    {showTimeDrop && (
                        <DropMenu options={TIME_TYPES} selected={timeType} onSelect={(v) => { setTimeType(v); setShowTimeDrop(false); }} />
                    )}
                </div>

                {/* Time filter */}
                <div className="w-28 relative mt-5" ref={allRef}>
                    <DropBtn value={timeFilter} onClick={() => setShowAllDrop((p) => !p)} open={showAllDrop} className="w-full" />
                    {showAllDrop && (
                        <DropMenu options={TIME_FILTERS} selected={timeFilter} onSelect={(v) => { setTimeFilter(v); setShowAllDrop(false); }} />
                    )}
                </div>

                {/* Date range */}
                <div className="mt-5">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-500 hover:border-primary/40 transition-colors whitespace-nowrap">
                        <Calendar size={13} className="text-slate-400" />
                        01 Oct 2025 - 31 Oct 2025
                        <ChevronDown size={12} className="text-slate-400" />
                    </button>
                </div>

                {/* Inbound No. type */}
                <div className="w-32 relative mt-5" ref={inboundRef}>
                    <DropBtn value={inboundType} onClick={() => setShowInboundDrop((p) => !p)} open={showInboundDrop} className="w-full" />
                    {showInboundDrop && (
                        <DropMenu options={INBOUND_TYPES} selected={inboundType} onSelect={(v) => { setInboundType(v); setShowInboundDrop(false); }} />
                    )}
                </div>

                {/* Search input */}
                <div className="flex-1 min-w-32 relative mt-5">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                </div>

                {/* Search button */}
                <button
                    onClick={onSearch}
                    className="mt-5 px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors whitespace-nowrap"
                >
                    Search
                </button>
            </div>
        </div>
    );
}
