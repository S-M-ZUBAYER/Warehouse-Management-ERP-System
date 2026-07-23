import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Search } from "lucide-react";
import {
  ALL_PLATFORM_VALUE,
  ALL_STORE_VALUE,
  ALL_PLATFORM_LABEL,
  ALL_STORE_LABEL,
  fetchAllOrderPlatformStores,
  getOrderStoreContext,
  getPlatformStoreValue,
  platformLabel,
  setStoredOrderContext,
  setStoredSearchContext,
  SUPPORTED_PLATFORMS,
} from "../utils/orderApi";

const createAllStoreContext = (platform = ALL_PLATFORM_VALUE) => ({
  platform: platform || ALL_PLATFORM_VALUE,
  store: ALL_STORE_LABEL,
  platform_store_id: ALL_STORE_VALUE,
  isAllStoreContext: true,
});

const normalizeContextList = (value) =>
  Array.isArray(value) ? value.map(String).sort().join("|") : "";

const isSameStoreContext = (left = {}, right = {}) =>
  String(left?.platform || "") === String(right?.platform || "") &&
  String(left?.platform_store_id || "") === String(right?.platform_store_id || "") &&
  String(left?.store || "") === String(right?.store || "") &&
  String(left?.shop_id || "") === String(right?.shop_id || "") &&
  String(left?.external_store_id || "") === String(right?.external_store_id || "") &&
  Boolean(left?.isAllStoreContext) === Boolean(right?.isAllStoreContext) &&
  normalizeContextList(left?.selected_platforms) === normalizeContextList(right?.selected_platforms) &&
  normalizeContextList(left?.selected_store_ids) === normalizeContextList(right?.selected_store_ids);

export default function OrderProcessingFilterBar({
  platform: fallbackPlatform,
  platforms: fallbackPlatforms = [ALL_PLATFORM_LABEL, "Shopee", "TikTok"],
  store: fallbackStore,
  stores: fallbackStores = [ALL_STORE_LABEL],
  storeContext,
  setStoreContext,
  searchType,
  setSearchType,
  searchTypes,
  skuType,
  setSkuType,
  skuTypes,
  search,
  setSearch,
  handleSearch,
  showSearchTypeDropdown,
  setShowSearchTypeDropdown,
}) {
  const searchTypeRef = useRef(null);
  const platformSelectRef = useRef(null);
  const storeSelectRef = useRef(null);
  const getInitialPlatforms = () => {
    if (Array.isArray(storeContext?.selected_platforms) && storeContext.selected_platforms.length > 0) {
      return storeContext.selected_platforms.map((platform) => String(platform).toLowerCase());
    }
    const platform = storeContext?.platform || fallbackPlatform || ALL_PLATFORM_VALUE;
    return [String(platform).toLowerCase()];
  };
  const getInitialStoreIds = () => {
    if (Array.isArray(storeContext?.selected_store_ids) && storeContext.selected_store_ids.length > 0) {
      return storeContext.selected_store_ids.map(String);
    }
    const storeId = storeContext?.platform_store_id || fallbackStore || ALL_STORE_VALUE;
    return [String(storeId)];
  };
  const [selectedPlatforms, setSelectedPlatforms] = useState(getInitialPlatforms);
  const [selectedStoreIds, setSelectedStoreIds] = useState(getInitialStoreIds);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  const { data: platformStores = [] } = useQuery({
    queryKey: ["order-processing", "platform-stores", "shopee-tiktok"],
    queryFn: fetchAllOrderPlatformStores,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const handler = (event) => {
      if (searchTypeRef.current && !searchTypeRef.current.contains(event.target)) {
        setShowSearchTypeDropdown(false);
      }
      if (platformSelectRef.current && !platformSelectRef.current.contains(event.target)) {
        setShowPlatformDropdown(false);
      }
      if (storeSelectRef.current && !storeSelectRef.current.contains(event.target)) {
        setShowStoreDropdown(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setShowSearchTypeDropdown]);

  const platformOptions = useMemo(() => {
    const uniquePlatforms = [
      ...new Set(platformStores.map((store) => String(store.platform || "").toLowerCase()).filter(Boolean)),
    ];

    const sourcePlatforms = uniquePlatforms.length
      ? uniquePlatforms
      : fallbackPlatforms.map((platform) => String(platform).toLowerCase());

    const supportedOptions = sourcePlatforms
      .filter((platform) => SUPPORTED_PLATFORMS.includes(String(platform).toLowerCase()))
      .map((platform) => ({ label: platformLabel(platform), value: String(platform).toLowerCase() }));

    return [{ label: ALL_PLATFORM_LABEL, value: ALL_PLATFORM_VALUE }, ...supportedOptions];
  }, [fallbackPlatforms, platformStores]);

  const selectedPlatformValues = useMemo(
    () => selectedPlatforms.filter((platform) => platform !== ALL_PLATFORM_VALUE),
    [selectedPlatforms]
  );

  const storeOptions = useMemo(() => {
    const filteredStores = selectedPlatformValues.length > 0
      ? platformStores.filter((store) => selectedPlatformValues.includes(String(store.platform).toLowerCase()))
      : platformStores;

    const mappedStores = filteredStores.length > 0
      ? filteredStores.map((store) => ({
          ...store,
          label: store.store_name || store.external_store_name || `Store #${getPlatformStoreValue(store)}`,
          value: getPlatformStoreValue(store),
        }))
      : fallbackStores
          .filter((store) => String(store).toLowerCase() !== ALL_STORE_VALUE && store !== ALL_STORE_LABEL)
          .map((store) => ({ id: store, label: store, value: store }));

    return [{ id: ALL_STORE_VALUE, label: ALL_STORE_LABEL, value: ALL_STORE_VALUE }, ...mappedStores];
  }, [fallbackStores, platformStores, selectedPlatformValues]);

  useEffect(() => {
    if (selectedStoreIds.includes(ALL_STORE_VALUE)) return;

    const visibleStoreValues = new Set(storeOptions.map((store) => String(store.value)));
    const visibleSelectedStores = selectedStoreIds.filter((storeId) => visibleStoreValues.has(String(storeId)));

    if (visibleSelectedStores.length !== selectedStoreIds.length) {
      setSelectedStoreIds(visibleSelectedStores.length ? visibleSelectedStores : [ALL_STORE_VALUE]);
    }
  }, [selectedStoreIds, storeOptions]);

  const activePlatform = selectedPlatforms.includes(ALL_PLATFORM_VALUE)
    ? ALL_PLATFORM_VALUE
    : selectedPlatformValues.length === 1
      ? selectedPlatformValues[0]
      : ALL_PLATFORM_VALUE;
  const selectedStoreValues = useMemo(
    () => selectedStoreIds.filter((storeId) => storeId !== ALL_STORE_VALUE),
    [selectedStoreIds]
  );
  const activeStore = selectedStoreIds.includes(ALL_STORE_VALUE)
    ? ALL_STORE_VALUE
    : selectedStoreValues.length === 1
      ? selectedStoreValues[0]
      : ALL_STORE_VALUE;
  const selectedStoreContext = useMemo(() => {
    const hasPlatformFilter = !selectedPlatforms.includes(ALL_PLATFORM_VALUE) && selectedPlatformValues.length > 0;
    const hasStoreFilter = !selectedStoreIds.includes(ALL_STORE_VALUE) && selectedStoreValues.length > 0;

    if (hasStoreFilter && selectedStoreValues.length === 1) {
      const store = platformStores.find((item) => getPlatformStoreValue(item) === String(selectedStoreValues[0]));

      if (!store && String(storeContext?.platform_store_id || "") === String(selectedStoreValues[0])) {
        return storeContext;
      }

      if (!store) {
        return getOrderStoreContext({ id: selectedStoreValues[0], store_name: selectedStoreValues[0] }, activePlatform);
      }

      return getOrderStoreContext(store, store.platform || activePlatform);
    }

    const contextPlatform = hasPlatformFilter && selectedPlatformValues.length === 1
      ? selectedPlatformValues[0]
      : ALL_PLATFORM_VALUE;
    const context = createAllStoreContext(contextPlatform);

    if (hasPlatformFilter) {
      context.selected_platforms = selectedPlatformValues;
    }

    if (hasStoreFilter) {
      context.selected_store_ids = selectedStoreValues;
      context.store = selectedStoreValues.length === 1 ? selectedStoreValues[0] : `${selectedStoreValues.length} selected stores`;
    }

    return context;
  }, [activePlatform, platformStores, selectedPlatformValues, selectedPlatforms, selectedStoreIds, selectedStoreValues, storeContext]);

  useEffect(() => {
    setStoredOrderContext(selectedStoreContext);
    if (!isSameStoreContext(storeContext, selectedStoreContext)) {
      setStoreContext?.(selectedStoreContext);
    }
  }, [selectedStoreContext, setStoreContext, storeContext]);

  const onSearchClick = () => {
    setStoredSearchContext({
      ...selectedStoreContext,
      searchType,
      skuType,
      search,
    });
    handleSearch?.();
  };

  return (
    <div className="bg-white rounded-xl border border-surface-border p-4 font-body">
      <div className="grid grid-cols-12 items-end gap-3 xl:grid-cols-[repeat(24,minmax(0,1fr))]">
        <div className="col-span-12 md:col-span-6 xl:col-span-4">
          <p className="mb-1.5 text-xs font-semibold text-slate-600">Select Platform</p>
          <CheckboxSelectBox
            refNode={platformSelectRef}
            values={selectedPlatforms}
            onChange={(values) => {
              setSelectedPlatforms(values.map((value) => String(value || ALL_PLATFORM_VALUE).toLowerCase()));
              setSelectedStoreIds([ALL_STORE_VALUE]);
            }}
            options={platformOptions}
            placeholder="Platform Name Here"
            open={showPlatformDropdown}
            setOpen={setShowPlatformDropdown}
            allValue={ALL_PLATFORM_VALUE}
          />
        </div>

        <div className="col-span-12 md:col-span-6 xl:col-span-5">
          <p className="mb-1.5 text-xs font-semibold text-slate-600">Select Store</p>
          <CheckboxSelectBox
            refNode={storeSelectRef}
            values={selectedStoreIds}
            onChange={(storeIds) => setSelectedStoreIds(storeIds.map((storeId) => String(storeId || ALL_STORE_VALUE)))}
            options={storeOptions}
            placeholder="Store Name Here"
            open={showStoreDropdown}
            setOpen={setShowStoreDropdown}
            allValue={ALL_STORE_VALUE}
          />
        </div>

        <div className="relative col-span-12 md:col-span-5 xl:col-span-4" ref={searchTypeRef}>
          <p className="mb-1.5 text-xs font-semibold text-slate-600">Select Search Type</p>
          <button
            type="button"
            onClick={() => setShowSearchTypeDropdown((open) => !open)}
            className="flex w-full items-center justify-between rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-slate-600 outline-none transition-colors hover:border-primary/40"
          >
            <span>{searchType}</span>
            <ChevronDown
              size={13}
              className={`text-slate-400 transition-transform ${showSearchTypeDropdown ? "rotate-180" : ""}`}
            />
          </button>
          {showSearchTypeDropdown && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-full rounded-xl border border-surface-border bg-white py-1 shadow-lg">
              {searchTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSearchType(type);
                    setShowSearchTypeDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    searchType === type ? "bg-blue-50 font-semibold text-primary" : "text-slate-700 hover:bg-surface-card"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-4 md:col-span-2 xl:col-span-3">
          <SelectBox value={skuType} onChange={setSkuType} options={skuTypes} />
        </div>

        <div className="relative col-span-8 md:col-span-4 xl:col-span-6">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          {searchType === "Batch Search" ? (
            <textarea
              rows={2}
              placeholder="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-10 w-full resize-y rounded-lg border border-surface-border bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          ) : (
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && onSearchClick()}
              className="h-10 w-full rounded-lg border border-surface-border bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          )}
        </div>

        <button
          type="button"
          onClick={onSearchClick}
          className="col-span-12 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark md:col-span-1 xl:col-span-2"
        >
          Search
        </button>
      </div>
    </div>
  );
}

function CheckboxSelectBox({ refNode, values, onChange, options, placeholder, open, setOpen, allValue }) {
  const normalizedOptions = options.map((option) =>
    typeof option === "string"
      ? { label: option, value: option }
      : {
          label: option.label ?? option.name ?? option.store_name ?? option.value,
          value: String(option.id ?? option.value ?? option.label),
        }
  );
  const selectedValues = values.length ? values.map(String) : [allValue];
  const optionValues = normalizedOptions.map((option) => String(option.value)).filter((value) => value !== allValue);
  const selectedWithoutAll = selectedValues.filter((value) => value !== allValue);
  const allSelectedByItems = optionValues.length > 0 && optionValues.every((value) => selectedWithoutAll.includes(value));
  const hasOnlyAllSelected = selectedValues.includes(allValue) && selectedWithoutAll.length === 0;
  const isAllSelected = selectedValues.includes(allValue) || allSelectedByItems;
  const selectedLabels = normalizedOptions
    .filter((option) => selectedWithoutAll.includes(String(option.value)))
    .map((option) => option.label);
  const allLabel = normalizedOptions.find((option) => String(option.value) === allValue)?.label || placeholder;
  const buttonLabel = isAllSelected
    ? allLabel
    : selectedLabels.length === 1
      ? selectedLabels[0]
      : selectedLabels.length > 1
        ? `${selectedLabels.length} selected`
        : placeholder;

  const updateSelection = (value) => {
    const nextValue = String(value);

    if (nextValue === allValue) {
      onChange([allValue]);
      return;
    }

    const current = hasOnlyAllSelected ? [] : selectedWithoutAll;
    const next = current.includes(nextValue)
      ? current.filter((item) => item !== nextValue)
      : [...current, nextValue];

    onChange(next.length === 0 ? [allValue] : next.length === optionValues.length ? [allValue, ...optionValues] : next);
  };

  return (
    <div className="relative" ref={refNode}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-surface-border bg-white px-3 text-left text-sm text-slate-700 outline-none transition-colors hover:border-primary/40 focus:border-primary"
      >
        <span className="truncate">{buttonLabel}</span>
        <ChevronDown
          size={13}
          className={`ml-2 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-64 min-w-full overflow-y-auto rounded-xl border border-surface-border bg-white py-1 shadow-lg">
          {normalizedOptions.map((option) => {
            const optionValue = String(option.value);
            const checked = optionValue === allValue
              ? isAllSelected
              : selectedValues.includes(optionValue);

            return (
              <label
                key={optionValue}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-surface-card"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => updateSelection(optionValue)}
                  className="h-4 w-4 rounded border-surface-border text-primary focus:ring-primary/20"
                />
                <span className="truncate">{option.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SelectBox({ value, onChange, options, placeholder }) {
  const normalizedOptions = options.map((option) =>
    typeof option === "string"
      ? { label: option, value: option }
      : {
          label: option.label ?? option.name ?? option.store_name ?? option.value,
          value: String(option.id ?? option.value ?? option.label),
        }
  );

  const selectedValue =
    normalizedOptions.find((option) => String(option.value) === String(value))?.value ?? "";

  return (
    <div className="relative">
      <select
        value={selectedValue}
        onChange={(event) => onChange(event.target.value)}
        className="w-full cursor-pointer appearance-none rounded-lg border border-surface-border bg-white py-2 pl-3 pr-8 text-sm text-slate-700 outline-none transition-colors focus:border-primary"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}
