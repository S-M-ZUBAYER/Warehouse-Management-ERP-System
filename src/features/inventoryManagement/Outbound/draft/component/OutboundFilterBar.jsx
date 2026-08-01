import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronRight, Search, Loader2 } from 'lucide-react';
import { formatOutboundDateRange } from '../../../shared/outboundFilterUtils';

const TIME_TYPES   = ['Created Time', 'Estimated arrival time'];
const INBOUND_TYPES = ['Outbound No.', 'SKU Name'];

function DropBtn({ value, onClick, open, className = '', loading = false }) {
    return (
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
}

function DropMenu({ options, selected, onSelect }) {
    return (
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
}

// ─────────────────────────────────────────────────────────────────────────────
// OutboundFilterBar — shared by Draft, OnTheWay, Completed
// warehouseOptions: [{ label, value }] from useOutboundDropdowns
// ─────────────────────────────────────────────────────────────────────────────
export default function OutboundFilterBar({
    warehouseId, setWarehouseId,
    warehouseOptions = [],
    warehouseLoading = false,
    timeType, setTimeType,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    outboundType, setOutboundType,
    search, setSearch,
    onSearch,
}) {
    const [showWareDrop,    setShowWareDrop]    = useState(false);
    const [showTimeDrop,    setShowTimeDrop]    = useState(false);
    const [showDateDrop,    setShowDateDrop]    = useState(false);
    const [showOutboundDrop, setShowOutboundDrop] = useState(false);

    const wareRef    = useRef(null);
    const timeRef    = useRef(null);
    const dateRef    = useRef(null);
    const outboundRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (wareRef.current    && !wareRef.current.contains(e.target))    setShowWareDrop(false);
            if (timeRef.current    && !timeRef.current.contains(e.target))    setShowTimeDrop(false);
            if (dateRef.current    && !dateRef.current.contains(e.target))    setShowDateDrop(false);
            if (outboundRef.current && !outboundRef.current.contains(e.target)) setShowOutboundDrop(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectedWarehouseLabel = warehouseOptions.find((o) => o.value === warehouseId)?.label ?? 'Warehouse name here';
    const dateRangeLabel = formatOutboundDateRange({ dateFrom, dateTo });

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

                {/* Date range */}
                <div className="w-64 relative mt-5" ref={dateRef}>
                    <button
                        type="button"
                        onClick={() => setShowDateDrop((p) => !p)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 hover:border-primary/40 transition-colors"
                    >
                        <Calendar size={16} className="text-slate-500 flex-shrink-0" />
                        <span className="flex-1 truncate text-left">{dateRangeLabel}</span>
                        <ChevronRight size={14} className={`text-slate-400 flex-shrink-0 transition-transform ${showDateDrop ? 'rotate-90' : ''}`} />
                    </button>

                    {showDateDrop && (
                        <div className="absolute left-0 top-full mt-1 z-30 w-72 rounded-xl border border-surface-border bg-white shadow-lg p-3">
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                <input
                                    type="date"
                                    value={dateFrom ?? ''}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="min-w-0 px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                />
                                <span className="text-xs text-slate-400">to</span>
                                <input
                                    type="date"
                                    value={dateTo ?? ''}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="min-w-0 px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                />
                            </div>
                            <div className="flex justify-end mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDateFrom('');
                                        setDateTo('');
                                        setShowDateDrop(false);
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Outbound No. type */}
                <div className="w-32 relative mt-5" ref={outboundRef}>
                    <DropBtn value={outboundType} onClick={() => setShowOutboundDrop((p) => !p)} open={showOutboundDrop} className="w-full" />
                    {showOutboundDrop && (
                        <DropMenu options={INBOUND_TYPES} selected={outboundType} onSelect={(v) => { setOutboundType(v); setShowOutboundDrop(false); }} />
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
