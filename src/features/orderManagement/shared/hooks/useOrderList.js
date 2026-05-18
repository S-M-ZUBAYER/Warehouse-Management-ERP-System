import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchOrders,
  getStoredOrderContext,
  getStoredSearchContext,
  runOrderAction,
  setCachedOrderDetail,
  setStoredOrderContext,
  setStoredSearchContext,
} from "../utils/orderApi";

export const ORDER_LIST_KEYS = {
  all: () => ["order-management"],
  list: (params) => ["order-management", "list", params],
};

const DEFAULT_PLATFORMS = ["Shopee", "TikTok"];
const DEFAULT_STORES = ["Store Name Here"];
const SEARCH_TYPES = ["Single Search", "Batch Search"];
const SKU_TYPES = ["SKU", "Order Number", "Tracking Number"];

// ─────────────────────────────────────────────────────────────────────────────
// useOrderList — shared hook used by all order list pages.
// It keeps the old UI contract, but replaces mock arrays with Shopee/TikTok APIs.
// ─────────────────────────────────────────────────────────────────────────────
export function useOrderList({ pageType = "all", activeTab = "" } = {}) {
  const queryClient = useQueryClient();
  const storedSearch = getStoredSearchContext();
  const [platform, setPlatform] = useState(storedSearch?.platform || "Shopee");
  const [store, setStore] = useState(storedSearch?.platform_store_id || "Store Name Here");
  const [searchType, setSearchType] = useState(storedSearch?.searchType || "Single Search");
  const [skuType, setSkuType] = useState(storedSearch?.skuType || "SKU");
  const [search, setSearch] = useState(storedSearch?.search || "");
  const [appliedSearch, setAppliedSearch] = useState(storedSearch?.search || "");
  const [storeContext, setStoreContext] = useState(getStoredOrderContext());
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
  }, [pageType, activeTab, appliedSearch, skuType, storeContext?.platform_store_id]);

  const queryParams = useMemo(
    () => ({
      context: storeContext,
      pageType,
      tab: activeTab,
      search: appliedSearch,
      skuType,
    }),
    [activeTab, appliedSearch, pageType, skuType, storeContext]
  );

  const hasStore = pageType === "manual" || Boolean(storeContext?.platform && storeContext?.platform_store_id);
  const {
    data: orders = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ORDER_LIST_KEYS.list(queryParams),
    queryFn: () => fetchOrders(queryParams),
    enabled: hasStore,
    staleTime: 1000 * 45,
    placeholderData: (previous) => previous,
  });

  const actionMutation = useMutation({
    mutationFn: runOrderAction,
    onSuccess: (data) => {
      toast.success(data?.message || "Order action completed");
      queryClient.invalidateQueries({ queryKey: ORDER_LIST_KEYS.all() });
      setSelectedIds([]);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Order action failed");
    },
  });

  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = () => {
    const ids = orders.map((order) => order.id);
    setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids);
  };

  const handleSearch = () => {
    setAppliedSearch(search);
    setStoredSearchContext({
      ...storeContext,
      searchType,
      skuType,
      search,
    });
  };

  const handleStoreContextChange = (context) => {
    setStoreContext(context || {});
    setPlatform(context?.platform || "");
    setStore(context?.platform_store_id || context?.store || "");
    setStoredOrderContext(context || {});
    setStoredSearchContext({
      ...(context || {}),
      searchType,
      skuType,
      search,
    });
  };

  const selectedRows = useMemo(
    () => orders.filter((order) => selectedIds.includes(order.id)),
    [orders, selectedIds]
  );

  const cacheOrderForDetail = (order) => setCachedOrderDetail(order);

  const runAction = (action, rows = selectedRows) => {
    if (!rows.length) {
      toast.error("Please select at least one order");
      return;
    }
    actionMutation.mutate({ action, orders: rows });
  };

  return {
    // filter state
    platform,
    setPlatform,
    store,
    setStore,
    storeContext,
    setStoreContext: handleStoreContextChange,
    searchType,
    setSearchType,
    skuType,
    setSkuType,
    search,
    setSearch,
    appliedSearch,
    handleSearch,
    showSearchTypeDropdown,
    setShowSearchTypeDropdown,

    // data
    orders,
    selectedRows,
    isLoading,
    isFetching,
    isError,
    error,
    hasStore,

    // selection
    selectedIds,
    toggleSelect,
    toggleAll,
    allSelected: orders.length > 0 && orders.every((order) => selectedIds.includes(order.id)),
    someSelected: orders.some((order) => selectedIds.includes(order.id)),

    // actions
    runAction,
    actionLoading: actionMutation.isPending,
    cacheOrderForDetail,

    // options
    platforms: DEFAULT_PLATFORMS,
    stores: DEFAULT_STORES,
    searchTypes: SEARCH_TYPES,
    skuTypes: SKU_TYPES,
  };
}
