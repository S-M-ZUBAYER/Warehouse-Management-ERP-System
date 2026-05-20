import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Search } from "lucide-react";
import api from "../../../../lib/api";
import {
  ORDER_STORE_CONTEXT_KEY,
  setStoredOrderContext,
  setStoredSearchContext,
  SUPPORTED_PLATFORMS,
} from "../utils/orderApi";

const PAGE_LIMIT = 100;

const unwrapPlatformStores = (res) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const fetchPlatformStoresPage = (page) =>
  api
    .get("/platform-stores", { params: { page, limit: PAGE_LIMIT } })
    .then((res) => ({
      rows: unwrapPlatformStores(res),
      totalPages: res?.pagination?.totalPages || res?.data?.pagination?.totalPages,
    }));

const fetchAllPlatformStores = async () => {
  const allStores = [];
  let page = 1;
  let totalPages = 1;

  do {
    const { rows, totalPages: responseTotalPages } = await fetchPlatformStoresPage(page);
    allStores.push(...rows);
    totalPages = responseTotalPages ?? (rows.length === PAGE_LIMIT ? page + 1 : page);
    page += 1;
  } while (page <= totalPages && page <= 100);

  return allStores.filter((store) =>
    SUPPORTED_PLATFORMS.includes(String(store?.platform || "").toLowerCase())
  );
};

const labelForPlatform = (platform) => {
  const value = String(platform || "").toLowerCase();
  if (value === "shopee") return "Shopee";
  if (value === "tiktok") return "TikTok";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getStoreValue = (store) => String(store?.id ?? store?.value ?? "");

const getStoreContext = (store, platform) => ({
  platform: String(platform || store?.platform || "").toLowerCase(),
  store: store?.store_name || store?.external_store_name || store?.label || "",
  platform_store_id: store?.id ?? store?.value ?? "",
  platform_open_id: store?.store_open_id ?? store?.open_id ?? store?.platform_open_id ?? "",
  cipher: store?.store_cipher ?? store?.cipher ?? store?.platform_cipher ?? "",
  shop_id: store?.store_shop_id ?? store?.shop_id ?? store?.external_store_id ?? "",
  external_store_id: store?.external_store_id ?? "",
  external_store_name: store?.external_store_name ?? "",
  region: store?.region ?? store?.country ?? "",
});

export default function OrderProcessingFilterBar({
  platform: fallbackPlatform,
  platforms: fallbackPlatforms = ["Shopee", "TikTok"],
  store: fallbackStore,
  stores: fallbackStores = ["Store Name Here"],
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
  const defaultSelectionApplied = useRef(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");

  const { data: platformStores = [] } = useQuery({
    queryKey: ["order-processing", "platform-stores", "shopee-tiktok"],
    queryFn: fetchAllPlatformStores,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const handler = (event) => {
      if (searchTypeRef.current && !searchTypeRef.current.contains(event.target)) {
        setShowSearchTypeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setShowSearchTypeDropdown]);

  useEffect(() => {
    if (platformStores.length === 0 || defaultSelectionApplied.current) return;

    let savedContext = null;
    try {
      savedContext = JSON.parse(localStorage.getItem(ORDER_STORE_CONTEXT_KEY) || "null");
    } catch {
      savedContext = null;
    }

    const savedStore = platformStores.find(
      (store) =>
        String(store.id) === String(savedContext?.platform_store_id) &&
        String(store.platform).toLowerCase() === String(savedContext?.platform).toLowerCase()
    );

    const defaultStore =
      savedStore ||
      platformStores.find((store) => String(store.platform).toLowerCase() === "shopee") ||
      platformStores[0];

    setSelectedPlatform(String(defaultStore.platform || "").toLowerCase());
    setSelectedStoreId(getStoreValue(defaultStore));
    defaultSelectionApplied.current = true;
  }, [platformStores]);

  const platformOptions = useMemo(() => {
    const uniquePlatforms = [
      ...new Set(platformStores.map((store) => String(store.platform || "").toLowerCase()).filter(Boolean)),
    ];

    if (uniquePlatforms.length > 0) {
      return uniquePlatforms.map((platform) => ({ label: labelForPlatform(platform), value: platform }));
    }

    return fallbackPlatforms
      .filter((platform) => SUPPORTED_PLATFORMS.includes(String(platform).toLowerCase()))
      .map((platform) => ({ label: labelForPlatform(platform), value: String(platform).toLowerCase() }));
  }, [fallbackPlatforms, platformStores]);

  const storeOptions = useMemo(() => {
    const filteredStores = selectedPlatform
      ? platformStores.filter((store) => String(store.platform).toLowerCase() === selectedPlatform)
      : platformStores;

    if (filteredStores.length > 0) {
      return filteredStores.map((store) => ({
        ...store,
        label: store.store_name || store.external_store_name || `Store #${store.id}`,
        value: getStoreValue(store),
      }));
    }

    return fallbackStores.map((store) => ({ id: store, label: store, value: store }));
  }, [fallbackStores, platformStores, selectedPlatform]);

  useEffect(() => {
    if (!selectedPlatform || storeOptions.length === 0) return;

    const storeStillVisible = storeOptions.some(
      (store) => getStoreValue(store) === String(selectedStoreId)
    );

    if (!storeStillVisible) {
      setSelectedStoreId(getStoreValue(storeOptions[0]));
    }
  }, [selectedPlatform, selectedStoreId, storeOptions]);

  const activePlatform = selectedPlatform || String(fallbackPlatform || "").toLowerCase();
  const activeStore = selectedStoreId || fallbackStore;
  const selectedStoreContext = useMemo(() => {
    const store = platformStores.find((item) => getStoreValue(item) === String(activeStore));

    if (!store) {
      return getStoreContext({ id: activeStore, store_name: activeStore }, activePlatform);
    }

    return getStoreContext(store, activePlatform);
  }, [activePlatform, activeStore, platformStores]);

  useEffect(() => {
    if (!selectedStoreContext?.platform_store_id) return;
    setStoredOrderContext(selectedStoreContext);
    setStoreContext?.(selectedStoreContext);
  }, [selectedStoreContext, setStoreContext]);

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
          <SelectBox
            value={activePlatform}
            onChange={(value) => {
              setSelectedPlatform(String(value).toLowerCase());
              setSelectedStoreId("");
            }}
            options={platformOptions}
            placeholder="Platform Name Here"
          />
        </div>

        <div className="col-span-12 md:col-span-6 xl:col-span-5">
          <p className="mb-1.5 text-xs font-semibold text-slate-600">Select Store</p>
          <SelectBox
            value={activeStore}
            onChange={(storeId) => setSelectedStoreId(String(storeId))}
            options={storeOptions}
            placeholder="Store Name Here"
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
