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
const ORDER_PAGE_SIZE = 10;

// ─────────────────────────────────────────────────────────────────────────────
// useOrderList — shared hook used by all order list pages.
// It keeps the old UI contract, but replaces mock arrays with Shopee/TikTok APIs.
// ─────────────────────────────────────────────────────────────────────────────
export function useOrderList({ pageType = "all", activeTab = "", dateRange } = {}) {
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
  const [page, setPage] = useState(1);
  const [pageCursors, setPageCursors] = useState({ 1: "" });
  const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false);
  const platformValue = String(storeContext?.platform || "").toLowerCase();
  const serverPaginatedPageTypes = ["all", "completed", "canceled"];
  const serverPaginated =
    serverPaginatedPageTypes.includes(pageType) &&
    (platformValue.includes("shopee") || platformValue.includes("tik"));

  useEffect(() => {
    setSelectedIds([]);
    setPage(1);
    setPageCursors({ 1: "" });
  }, [pageType, activeTab, appliedSearch, skuType, storeContext?.platform_store_id, storeContext?.platform, dateRange?.start, dateRange?.end]);

  const queryParams = useMemo(
    () => ({
      context: storeContext,
      pageType,
      tab: activeTab,
      search: appliedSearch,
      skuType,
      dateRange,
      pagination: serverPaginated
        ? {
            serverPaginated: true,
            page,
            pageSize: ORDER_PAGE_SIZE,
            cursor: pageCursors[page] || "",
          }
        : undefined,
    }),
    [activeTab, appliedSearch, dateRange, page, pageCursors, pageType, serverPaginated, skuType, storeContext]
  );

  const hasStore = pageType === "manual" || Boolean(storeContext?.platform && storeContext?.platform_store_id);
  const {
    data: orderResult = [],
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

  const serverPageResult =
    serverPaginated && orderResult && !Array.isArray(orderResult) ? orderResult : null;
  const allOrders = Array.isArray(orderResult) ? orderResult : orderResult?.orders || [];

  useEffect(() => {
    if (!serverPaginated || !serverPageResult?.nextCursor) return;
    setPageCursors((current) => {
      const nextPage = page + 1;
      if (current[nextPage] === serverPageResult.nextCursor) return current;
      return {
        ...current,
        [nextPage]: serverPageResult.nextCursor,
      };
    });
  }, [page, serverPageResult?.nextCursor, serverPaginated]);

  const pagination = useMemo(() => {
    if (serverPaginated) {
      const visibleEnd = (page - 1) * ORDER_PAGE_SIZE + allOrders.length;
      const hasKnownTotal = serverPageResult?.hasKnownTotal === true;
      const total = hasKnownTotal
        ? Number(serverPageResult?.totalCount || 0)
        : visibleEnd;
      return {
        page,
        limit: ORDER_PAGE_SIZE,
        total,
        totalPages: hasKnownTotal
          ? Math.max(1, Math.ceil(total / ORDER_PAGE_SIZE))
          : serverPageResult?.hasMore && serverPageResult?.nextCursor ? page + 1 : page,
        hasMore: Boolean(serverPageResult?.hasMore && serverPageResult?.nextCursor),
        serverPaginated: true,
        hasKnownTotal,
      };
    }

    const total = allOrders.length;
    const totalPages = Math.max(1, Math.ceil(total / ORDER_PAGE_SIZE));
    return {
      page,
      limit: ORDER_PAGE_SIZE,
      total,
      totalPages,
      hasKnownTotal: true,
    };
  }, [allOrders.length, page, serverPageResult?.hasKnownTotal, serverPageResult?.hasMore, serverPageResult?.totalCount, serverPaginated]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pagination.totalPages));
  }, [pagination.totalPages]);

  const orders = useMemo(() => {
    if (serverPaginated) return allOrders;

    const start = (page - 1) * ORDER_PAGE_SIZE;
    return allOrders.slice(start, start + ORDER_PAGE_SIZE);
  }, [allOrders, page, serverPaginated]);

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
    () => allOrders.filter((order) => selectedIds.includes(order.id)),
    [allOrders, selectedIds]
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
    allOrders,
    pagination,
    page,
    setPage,
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
