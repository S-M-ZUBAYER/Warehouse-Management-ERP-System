import { Search, ChevronDown } from "lucide-react";
import { useRef, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// OrderFilterBar — shared filter bar matching Figma top section on all pages:
//   Select Platform | Select Store | Select Search Type | SKU dropdown | Search input | Search btn
// ─────────────────────────────────────────────────────────────────────────────

function SimpleSelect({ value, onChange, options, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border
                   rounded-lg bg-white text-slate-600 font-body outline-none focus:border-primary
                   cursor-pointer transition-colors"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  );
}

export default function OrderFilterBar({
  platform,
  setPlatform,
  platforms,
  store,
  setStore,
  stores,
  searchType,
  setSearchType,
  searchTypes,
  skuType,
  setSkuType,
  skuTypes,
  search,
  setSearch,
  showSearchTypeDropdown,
  setShowSearchTypeDropdown,
}) {
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowSearchTypeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-surface-border p-4 font-body">
      <div className="flex items-end gap-3 flex-wrap">
        {/* Select Platform */}
        <div className="flex-1 min-w-36">
          <p className="text-xs font-semibold text-slate-600 mb-1.5">
            Select Platform
          </p>
          <SimpleSelect
            value={platform}
            onChange={setPlatform}
            options={platforms}
          />
        </div>

        {/* Select Store */}
        <div className="flex-1 min-w-36">
          <p className="text-xs font-semibold text-slate-600 mb-1.5">
            Select Store
          </p>
          <SimpleSelect value={store} onChange={setStore} options={stores} />
        </div>

        {/* Select Search Type — with dropdown showing Single/Batch */}
        <div className="flex-1 min-w-36 relative" ref={dropRef}>
          <p className="text-xs font-semibold text-slate-600 mb-1.5">
            Select Search Type
          </p>
          <button
            type="button"
            onClick={() => setShowSearchTypeDropdown((p) => !p)}
            className="w-full flex items-center justify-between pl-3 pr-3 py-2 text-sm border
                       border-surface-border rounded-lg bg-white text-slate-600 outline-none
                       hover:border-primary/40 transition-colors"
          >
            <span>{searchType}</span>
            <ChevronDown
              size={13}
              className={`text-slate-400 transition-transform ${showSearchTypeDropdown ? "rotate-180" : ""}`}
            />
          </button>
          {showSearchTypeDropdown && (
            <div
              className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border
                            border-surface-border shadow-lg py-1 min-w-full"
            >
              {searchTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSearchType(t);
                    setShowSearchTypeDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors
                    ${searchType === t ? "text-primary font-semibold bg-blue-50" : "text-slate-700 hover:bg-surface-card"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SKU type */}
        <div className="w-28">
          <SimpleSelect
            value={skuType}
            onChange={setSkuType}
            options={skuTypes}
          />
        </div>

        {/* Search input */}
        <div className="flex-1 min-w-40 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg
                       text-slate-700 placeholder-slate-400 outline-none bg-white
                       focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        {/* Search button */}
        <button
          className="px-6 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark
                           text-white rounded-lg transition-colors whitespace-nowrap"
        >
          Search
        </button>
      </div>
    </div>
  );
}
