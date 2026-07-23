import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigationType } from "react-router-dom";
import { toast } from "sonner";
import {
  ALL_ORDER_STORE_CONTEXT,
  ALL_PLATFORM_VALUE,
  ALL_STORE_VALUE,
  consumeOrderDetailReturnContext,
  deleteOrderSkuOverride,
  fetchOrders,
  generateShopeeAwbPdf,
  generateTikTokAwbPdf,
  getStoredOrderListReturnState,
  isOrderDetailReturnContext,
  getStoredOrderContext,
  getStoredSearchContext,
  packShopeeOrders,
  packTikTokOrders,
  removeFailedPackOrders,
  removeWithdrawOrders,
  runOrderAction,
  saveFailedPackOrders,
  savePushSuccessfulOrders,
  saveWithdrawOrders,
  setCachedOrderDetail,
  setStoredOrderContext,
  setStoredSearchContext,
} from "../utils/orderApi";

export const ORDER_LIST_KEYS = {
  all: () => ["order-management"],
  list: (params) => ["order-management", "list", params],
};

const DEFAULT_PLATFORMS = ["All Platforms", "Shopee", "TikTok"];
const DEFAULT_STORES = ["All Stores"];
const SEARCH_TYPES = ["Single Search", "Batch Search"];
const SKU_TYPES = ["SKU", "Package Number", "Order Number", "Tracking Number"];
const ORDER_PAGE_SIZE = 10;
const ORDER_LIST_CACHE_TIME = 1000 * 60 * 30;

const getStatusSortValue = (order) =>
  String(order?.status || "").trim().toLowerCase();

const sortOrdersByStatus = (rows = [], direction) => {
  if (!direction) return rows;

  return [...rows].sort((a, b) => {
    const left = getStatusSortValue(a);
    const right = getStatusSortValue(b);

    if (!left && !right) return 0;
    if (!left) return 1;
    if (!right) return -1;

    const comparison = left.localeCompare(right, undefined, { sensitivity: "base" });
    return direction === "asc" ? comparison : -comparison;
  });
};

const getStoredStoreContext = (context = {}) => {
  const {
    searchType,
    skuType,
    search,
    pageState,
    ...storeOnlyContext
  } = context || {};

  return storeOnlyContext;
};

// ─────────────────────────────────────────────────────────────────────────────
// useOrderList — shared hook used by all order list pages.
// It keeps the old UI contract, but replaces mock arrays with Shopee/TikTok APIs.
// ─────────────────────────────────────────────────────────────────────────────
export function useOrderList({ pageType = "all", activeTab = "", datePreset, dateRange, showAllShopeeShipped = false, tabRefreshKey = 0 } = {}) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigationType = useNavigationType();
  const [isOrderDetailReturn] = useState(() =>
    isOrderDetailReturnContext({
      pathname: location.pathname,
      navigationType,
    })
  );
  const detailReturnQuerySignatureRef = useRef(null);
  const didMountRef = useRef(false);
  const storedSearch = getStoredSearchContext();
  const storedOrderContext = getStoredOrderContext();
  const storedSearchContext = getStoredStoreContext(storedSearch);
  const initialStoreContext =
    storedSearchContext?.platform || storedSearchContext?.platform_store_id
      ? storedSearchContext
      : storedOrderContext?.platform || storedOrderContext?.platform_store_id
        ? storedOrderContext
        : { ...ALL_ORDER_STORE_CONTEXT };
  const [platform, setPlatform] = useState(initialStoreContext?.platform || ALL_PLATFORM_VALUE);
  const [store, setStore] = useState(initialStoreContext?.platform_store_id || ALL_STORE_VALUE);
  const [searchType, setSearchType] = useState(storedSearch?.searchType || "Single Search");
  const [skuType, setSkuType] = useState(storedSearch?.skuType || "SKU");
  const [search, setSearch] = useState(storedSearch?.search || "");
  const [appliedSearch, setAppliedSearch] = useState(storedSearch?.search || "");
  const [appliedSearchType, setAppliedSearchType] = useState(storedSearch?.searchType || "Single Search");
  const [appliedSkuType, setAppliedSkuType] = useState(storedSearch?.skuType || "SKU");
  const [storeContext, setStoreContext] = useState(() => initialStoreContext);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedOrderRows, setSelectedOrderRows] = useState([]);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [statusSortDirection, setStatusSortDirection] = useState(null);
  const restoredPageState = getStoredOrderListReturnState({
    pathname: location.pathname,
    navigationType,
    pageType,
  });
  const initialPageState = restoredPageState?.pageType === pageType ? restoredPageState : storedSearch?.pageState;
  const hasMatchingInitialPageState =
    isOrderDetailReturn &&
    initialPageState?.pageType === pageType &&
    (!activeTab || initialPageState?.activeTab === activeTab);
  const initialPage = hasMatchingInitialPageState ? Number(initialPageState?.page || 1) : 1;
  const initialPageCursors =
    hasMatchingInitialPageState &&
    initialPageState?.pageCursors &&
    typeof initialPageState.pageCursors === "object"
      ? initialPageState.pageCursors
      : { 1: "" };
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);
  const [pageCursors, setPageCursors] = useState(initialPageCursors);
  const [showSearchTypeDropdown, setShowSearchTypeDropdown] = useState(false);
  const [pendingShopeePackRows, setPendingShopeePackRows] = useState([]);
  const [failedShopeePackOrders, setFailedShopeePackOrders] = useState([]);
  const [pendingTikTokPackRows, setPendingTikTokPackRows] = useState([]);
  const [failedTikTokPackOrders, setFailedTikTokPackOrders] = useState([]);
  const [pendingShopeePrintRows, setPendingShopeePrintRows] = useState([]);
  const [pendingTikTokPrintRows, setPendingTikTokPrintRows] = useState([]);
  const [shopeePrintStatus, setShopeePrintStatus] = useState("");
  const [tikTokPrintStatus, setTikTokPrintStatus] = useState("");
  const [shopeeNoItemsModalOpen, setShopeeNoItemsModalOpen] = useState(false);
  const [shopeeAwbModalOpen, setShopeeAwbModalOpen] = useState(false);
  const [shopeeAwbPdfUrl, setShopeeAwbPdfUrl] = useState("");
  const [failedShopeePrintOrders, setFailedShopeePrintOrders] = useState([]);
  const [tikTokAwbModalOpen, setTikTokAwbModalOpen] = useState(false);
  const [tikTokAwbPdfUrl, setTikTokAwbPdfUrl] = useState("");
  const [failedTikTokPrintOrders, setFailedTikTokPrintOrders] = useState([]);
  const [tikTokAwbRows, setTikTokAwbRows] = useState([]);
  const [tikTokAwbFromStatus, setTikTokAwbFromStatus] = useState("");
  const [withdrawPackLoading, setWithdrawPackLoading] = useState(false);
  const platformValue = String(storeContext?.platform || "").toLowerCase();
  const allStoreScope =
    storeContext?.isAllStoreContext === true ||
    platformValue === ALL_PLATFORM_VALUE ||
    String(storeContext?.platform_store_id || "").toLowerCase() === ALL_STORE_VALUE;
  const serverPaginatedPageTypes = ["completed"];
  const serverPaginated =
    !allStoreScope &&
    serverPaginatedPageTypes.includes(pageType) &&
    (platformValue.includes("shopee") || platformValue.includes("tik"));
  const detailPaginated =
    !allStoreScope &&
    !serverPaginated &&
    ["all", "canceled"].includes(pageType) &&
    platformValue.includes("shopee");
  const queryPage = serverPaginated || detailPaginated ? page : 1;
  const queryCursor = serverPaginated ? pageCursors[page] || "" : "";
  const queryStoreContext = useMemo(() => getStoredStoreContext(storeContext), [storeContext]);
  const persistPageState = useCallback(
    (nextPage, nextPageCursors = pageCursors) => {
      setStoredSearchContext({
        ...storeContext,
        searchType,
        skuType,
        search,
        pageState: {
          pageType,
          activeTab,
          page: nextPage,
          pageCursors: nextPageCursors,
          datePreset,
          dateRange,
          showAllShopeeShipped,
        },
      });
    },
    [activeTab, datePreset, dateRange, pageCursors, pageType, search, searchType, showAllShopeeShipped, skuType, storeContext]
  );
  const setPageAndPersist = useCallback(
    (nextPageOrUpdater) => {
      setPage((currentPage) => {
        const nextPage =
          typeof nextPageOrUpdater === "function"
            ? nextPageOrUpdater(currentPage)
            : nextPageOrUpdater;
        const normalizedPage = Math.max(1, Number(nextPage) || 1);
        persistPageState(normalizedPage, pageCursors);
        return normalizedPage;
      });
    },
    [pageCursors, persistPageState]
  );
  const handleStatusSortChange = useCallback(
    (direction) => {
      setStatusSortDirection(direction);
      setPageAndPersist(1);
    },
    [setPageAndPersist]
  );

  useEffect(() => {
    if (!isOrderDetailReturn) return;
    consumeOrderDetailReturnContext({
      pathname: location.pathname,
      navigationType,
    });
  }, [isOrderDetailReturn, location.pathname, navigationType]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    setSelectedIds([]);
    setSelectedOrderRows([]);
    setPage(1);
    setPageCursors({ 1: "" });
  }, [pageType, activeTab, appliedSearch, appliedSearchType, appliedSkuType, storeContext?.platform_store_id, storeContext?.platform, storeContext?.isAllStoreContext, dateRange?.start, dateRange?.end, showAllShopeeShipped]);

  useEffect(() => {
    persistPageState(page, pageCursors);
  }, [page, pageCursors, persistPageState]);

  const queryParams = useMemo(
    () => ({
      context: queryStoreContext,
      pageType,
      tab: activeTab,
      search: appliedSearch,
      searchType: appliedSearchType,
      skuType: appliedSkuType,
      dateRange,
      showAllShopeeShipped,
      tabRefreshKey,
      pagination: serverPaginated
        ? {
            serverPaginated: true,
            page: queryPage,
            pageSize: ORDER_PAGE_SIZE,
            cursor: queryCursor,
          }
        : detailPaginated
          ? {
              detailPaginated: true,
              page: queryPage,
              pageSize: ORDER_PAGE_SIZE,
            }
        : undefined,
    }),
    [activeTab, appliedSearch, appliedSearchType, appliedSkuType, dateRange, detailPaginated, pageType, queryCursor, queryPage, serverPaginated, showAllShopeeShipped, tabRefreshKey, queryStoreContext]
  );
  const querySignature = useMemo(() => JSON.stringify(queryParams), [queryParams]);
  if (isOrderDetailReturn && detailReturnQuerySignatureRef.current === null) {
    detailReturnQuerySignatureRef.current = querySignature;
  }
  const isOrderDetailReturnQuery =
    isOrderDetailReturn && detailReturnQuerySignatureRef.current === querySignature;

  const hasStore =
    pageType === "manual" ||
    (pageType === "processed" && activeTab === "Pushing") ||
    Boolean(storeContext?.isAllStoreContext || (storeContext?.platform && storeContext?.platform_store_id));
  const {
    data: orderResult,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ORDER_LIST_KEYS.list(queryParams),
    queryFn: () => fetchOrders(queryParams),
    enabled: hasStore,
    staleTime: isOrderDetailReturnQuery ? ORDER_LIST_CACHE_TIME : 0,
    gcTime: ORDER_LIST_CACHE_TIME,
    refetchOnMount: isOrderDetailReturnQuery ? false : "always",
    refetchOnWindowFocus: false,
    placeholderData: (previous) => previous,
  });

  const hasOrderResult = orderResult !== undefined;
  const listLoading = isOrderDetailReturnQuery ? isLoading : isLoading || isFetching;
  const serverPageResult =
    serverPaginated && orderResult && !Array.isArray(orderResult) ? orderResult : null;
  const allOrders = Array.isArray(orderResult) ? orderResult : orderResult?.orders || [];
  const sortedAllOrders = useMemo(
    () => sortOrdersByStatus(allOrders, statusSortDirection),
    [allOrders, statusSortDirection]
  );

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

    const total = sortedAllOrders.length;
    const totalPages = Math.max(1, Math.ceil(total / ORDER_PAGE_SIZE));
    return {
      page,
      limit: ORDER_PAGE_SIZE,
      total,
      totalPages,
      hasKnownTotal: true,
    };
  }, [page, serverPageResult?.hasKnownTotal, serverPageResult?.hasMore, serverPageResult?.totalCount, serverPaginated, sortedAllOrders.length]);

  useEffect(() => {
    if (!hasOrderResult) return;
    setPage((currentPage) => Math.min(currentPage, pagination.totalPages));
  }, [hasOrderResult, pagination.totalPages]);

  const effectivePage = hasOrderResult ? Math.min(page, pagination.totalPages) : page;
  const orders = useMemo(() => {
    if (serverPaginated) return sortedAllOrders;

    const start = (effectivePage - 1) * ORDER_PAGE_SIZE;
    return sortedAllOrders.slice(start, start + ORDER_PAGE_SIZE);
  }, [effectivePage, serverPaginated, sortedAllOrders]);

  const invalidateOrderManagementData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ORDER_LIST_KEYS.all() });
    queryClient.invalidateQueries({ queryKey: ["order-management", "new-order-tab-counts"] });
    queryClient.invalidateQueries({ queryKey: ["order-management", "processed-order-tab-counts"] });
  }, [queryClient]);

  const actionMutation = useMutation({
    mutationFn: runOrderAction,
    onSuccess: (data) => {
      toast.success(data?.message || "Order action completed");
      invalidateOrderManagementData();
      setSelectedIds([]);
      setSelectedOrderRows([]);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Order action failed");
    },
  });

  const removeOrdersFromCurrentList = (successfulIds = []) => {
    if (!successfulIds.length) return;
    const successfulSet = new Set(successfulIds.map(String));

    queryClient.setQueryData(ORDER_LIST_KEYS.list(queryParams), (current) => {
      const keepOrder = (order) => {
        const orderSn = order?.rawId || order?.order_sn || order?.orderId || order?.orderNo;
        return !successfulSet.has(String(orderSn));
      };

      if (Array.isArray(current)) return current.filter(keepOrder);
      if (current && Array.isArray(current.orders)) {
        return {
          ...current,
          orders: current.orders.filter(keepOrder),
        };
      }
      return current;
    });
  };

  const shopeePackMutation = useMutation({
    mutationFn: (orders) => packShopeeOrders({ context: getActionContext(orders), orders }),
    onSuccess: ({ successfulIds = [], failedOrders = [] }, orders = []) => {
      removeOrdersFromCurrentList(successfulIds);
      const actionContext = getActionContext(orders);
      removeFailedPackOrders({ context: actionContext, platform: "shopee", orderIds: successfulIds });
      removeWithdrawOrders({ context: actionContext, platform: "shopee", orderIds: successfulIds });
      saveFailedPackOrders({ context: actionContext, platform: "shopee", failedOrders });
      invalidateOrderManagementData();
      setSelectedIds([]);
      setSelectedOrderRows([]);
      setPendingShopeePackRows([]);
      setFailedShopeePackOrders(failedOrders);

      if (failedOrders.length > 0) {
        toast.error(`${failedOrders.length} Shopee order(s) failed to pack`);
      } else {
        toast.success("All selected orders packed successfully!");
      }
    },
    onError: (err) => {
      toast.error(err?.message || "Shopee package action failed");
    },
  });

  const shopeePrintMutation = useMutation({
    mutationFn: ({ orders, fromStatus }) =>
      generateShopeeAwbPdf({ context: getActionContext(orders), orders, fromStatus }),
    onSuccess: ({ pdfUrl = "", failedOrders = [], printedOrderIds = [] }, variables) => {
      const actionContext = getActionContext(variables?.orders || []);
      if (String(variables?.fromStatus || "").toUpperCase() === "PROCESSED") {
        savePushSuccessfulOrders({ context: actionContext, platform: "shopee", orderIds: printedOrderIds });
        invalidateOrderManagementData();
      }

      setShopeeAwbPdfUrl(pdfUrl);
      setFailedShopeePrintOrders(failedOrders);

      if (failedOrders.length > 0) {
        toast.error(`${failedOrders.length} Shopee AWB order(s) failed`);
      } else if (pdfUrl) {
        toast.success("Shopee AWB is ready to print");
      }
    },
    onError: (err) => {
      toast.error(err?.message || "Shopee AWB print failed");
    },
  });

  const tikTokPrintMutation = useMutation({
    mutationFn: ({ orders, fromStatus }) =>
      generateTikTokAwbPdf({ context: getActionContext(orders), orders, fromStatus }),
    onSuccess: ({ pdfUrl = "", failedOrders = [], printedOrderIds = [] }, variables) => {
      const actionContext = getActionContext(variables?.orders || []);
      if (String(variables?.fromStatus || "").toUpperCase() === "AWAITING_COLLECTION") {
        savePushSuccessfulOrders({ context: actionContext, platform: "tiktok", orderIds: printedOrderIds });
        invalidateOrderManagementData();
      }

      setTikTokAwbPdfUrl(pdfUrl);
      setFailedTikTokPrintOrders(failedOrders);

      if (failedOrders.length > 0) {
        toast.error(`${failedOrders.length} TikTok AWB order(s) failed`);
      } else if (pdfUrl) {
        toast.success("TikTok AWB is ready to print");
      }
    },
    onError: (err) => {
      toast.error(err?.message || "TikTok AWB print failed");
    },
  });

  const tikTokPackMutation = useMutation({
    mutationFn: (orders) => packTikTokOrders({ context: getActionContext(orders), orders }),
    onSuccess: ({ successfulIds = [], failedOrders = [] }, orders = []) => {
      const actionContext = getActionContext(orders);
      removeOrdersFromCurrentList(successfulIds);
      removeFailedPackOrders({ context: actionContext, platform: "tiktok", orderIds: successfulIds });
      removeWithdrawOrders({ context: actionContext, platform: "tiktok", orderIds: successfulIds });
      saveFailedPackOrders({ context: actionContext, platform: "tiktok", failedOrders });
      invalidateOrderManagementData();
      setSelectedIds([]);
      setSelectedOrderRows([]);
      setPendingTikTokPackRows([]);
      setFailedTikTokPackOrders(failedOrders);

      if (failedOrders.length > 0) {
        toast.error(`${failedOrders.length} TikTok order(s) failed to pack`);
      } else {
        toast.success("All selected TikTok orders packed successfully");
      }
    },
    onError: (err) => {
      toast.error(err?.message || "TikTok package action failed");
    },
  });

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        setSelectedOrderRows((rows) => rows.filter((order) => order.id !== id));
        return prev.filter((x) => x !== id);
      }

      const selectedOrder = sortedAllOrders.find((order) => order.id === id) || orders.find((order) => order.id === id);
      if (selectedOrder) {
        setSelectedOrderRows((rows) => rows.some((order) => order.id === id) ? rows : [...rows, selectedOrder]);
      }
      return [...prev, id];
    });
  };

  const toggleAll = async ({ allPages = false } = {}) => {
    setSelectionLoading(true);
    try {
      const fetchedRows = allPages ? await fetchOrders({ ...queryParams, pagination: undefined }) : null;
      const sourceRows = allPages
        ? Array.isArray(fetchedRows) ? fetchedRows : fetchedRows?.orders || []
        : orders;
      const ids = sourceRows.map((order) => order.id);
      const shouldClear = ids.length > 0 && ids.every((id) => selectedIds.includes(id));

      setSelectedIds(shouldClear ? [] : ids);
      setSelectedOrderRows(shouldClear ? [] : sourceRows);
    } finally {
      setSelectionLoading(false);
    }
  };

  const handleSearch = () => {
    setAppliedSearch(search);
    setAppliedSearchType(searchType);
    setAppliedSkuType(skuType);
    setSelectedOrderRows([]);
    setStoredSearchContext({
      ...storeContext,
      searchType,
      skuType,
      search,
    });
  };

  const handleStoreContextChange = (context) => {
    const nextContext = context || { ...ALL_ORDER_STORE_CONTEXT };
    setStoreContext(nextContext);
    setPlatform(nextContext?.platform || ALL_PLATFORM_VALUE);
    setStore(nextContext?.platform_store_id || nextContext?.store || ALL_STORE_VALUE);
    setSelectedOrderRows([]);
    setStoredOrderContext(nextContext);
    setStoredSearchContext({
      ...nextContext,
      searchType,
      skuType,
      search,
    });
  };

  const selectedRows = useMemo(() => {
    const cachedRowsMatchSelection =
      selectedOrderRows.length === selectedIds.length &&
      selectedIds.every((id) => selectedOrderRows.some((order) => order.id === id));

    if (cachedRowsMatchSelection) return selectedOrderRows;
    return sortedAllOrders.filter((order) => selectedIds.includes(order.id));
  }, [selectedIds, selectedOrderRows, sortedAllOrders]);

  const cacheOrderForDetail = (order) => {
    persistPageState(page, pageCursors);
    setCachedOrderDetail(order);
  };

  const getActionContext = (rows = []) => rows?.[0]?.storeContext || storeContext || {};

  const getActionPlatform = (order) =>
    String(order?.platform || order?.storeContext?.platform || storeContext?.platform || "").toLowerCase();

  const getActionStoreKey = (order) => {
    const context = order?.storeContext || storeContext || {};
    return String(
      context?.platform_store_id ||
        context?.shop_id ||
        context?.external_store_id ||
        order?.storeName ||
        ""
    );
  };

  const completeWithdrawPack = async (rows = []) => {
    const actionContext = getActionContext(rows);
    const platformName = String(rows[0]?.platform || actionContext?.platform || "").toLowerCase();
    const platform = platformName.includes("tik") ? "tiktok" : platformName.includes("shopee") ? "shopee" : "";
    const orderIds = rows.map((order) => order?.rawId || order?.orderNo || order?.id).filter(Boolean);

    if (!platform || orderIds.length === 0) {
      toast.error("Withdraw order could not be packed");
      return;
    }

    setWithdrawPackLoading(true);
    try {
      await removeWithdrawOrders({ context: actionContext, platform, orderIds });
      removeOrdersFromCurrentList(orderIds);
      invalidateOrderManagementData();
      setSelectedIds([]);
      setSelectedOrderRows([]);
      toast.success("Order removed from withdraw");
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Withdraw order could not be packed");
    } finally {
      setWithdrawPackLoading(false);
    }
  };

  const validateSinglePlatformStoreAction = (action, rows = []) => {
    if (!["pack", "push"].includes(action) || rows.length <= 1) return true;

    const platforms = new Set(rows.map(getActionPlatform).filter(Boolean));
    if (platforms.size > 1) {
      toast.error("Please select orders from the same platform for this action");
      return false;
    }

    const storeKeys = new Set(rows.map(getActionStoreKey).filter(Boolean));
    if (storeKeys.size > 1) {
      toast.error("Please select orders from the same store for this action");
      return false;
    }

    return true;
  };

  const runAction = (action, rows = selectedRows) => {
    if (!rows.length) {
      const isShopeeAction =
        ["pack", "push"].includes(action) &&
        String(storeContext?.platform || "").toLowerCase().includes("shopee");
      const isTikTokPack =
        action === "pack" &&
        String(storeContext?.platform || "").toLowerCase().includes("tik");
      const isTikTokPush =
        action === "push" &&
        String(storeContext?.platform || "").toLowerCase().includes("tik");

      if (isShopeeAction) {
        setShopeeNoItemsModalOpen(true);
      } else if (isTikTokPack) {
        toast.error("Please select minimum one order");
      } else if (isTikTokPush) {
        toast.error("Please select at least one order");
      } else {
        toast.error(action === "pack" ? "No Items Selected" : "Please select at least one order");
      }
      return;
    }

    if (!validateSinglePlatformStoreAction(action, rows)) return;

    if (action === "pack" && pageType === "processed" && activeTab === "Withdraw") {
      completeWithdrawPack(rows);
      return;
    }

    const isShopeePack =
      action === "pack" &&
      rows.some((order) => getActionPlatform(order) === "shopee");

    if (isShopeePack) {
      const invalidRows = rows.filter((order) => String(order?.rawStatus || "").toUpperCase() !== "READY_TO_SHIP");
      if (invalidRows.length > 0) {
        toast.error("Pack is only available for READY_TO_SHIP Shopee orders");
        return;
      }

      setPendingShopeePackRows(rows);
      return;
    }

    const isTikTokPack =
      action === "pack" &&
      rows.some((order) => getActionPlatform(order) === "tiktok");

    if (isTikTokPack) {
      const invalidRows = rows.filter((order) => String(order?.rawStatus || "").toUpperCase() !== "AWAITING_SHIPMENT");
      if (invalidRows.length > 0) {
        toast.error("Pack is only available for AWAITING_SHIPMENT TikTok orders");
        return;
      }

      setPendingTikTokPackRows(rows);
      return;
    }

    const isShopeePush =
      action === "push" &&
      rows.some((order) => getActionPlatform(order) === "shopee");

    if (isShopeePush) {
      // const allowedStatuses = ["PROCESSED", "SHIPPED", "PROCESSED_PRINTED"];
      // const invalidRows = rows.filter((order) => !allowedStatuses.includes(String(order?.rawStatus || "").toUpperCase()));
      // if (invalidRows.length > 0) {
      //   toast.error("Push is only available for PROCESSED, SHIPPED, or PROCESSED_PRINTED Shopee orders");
      //   return;
      // }

      setPendingShopeePrintRows(rows);
      setShopeePrintStatus(activeTab === "Pushed Successful" ? "PROCESSED_PRINTED" : String(rows[0]?.rawStatus || "").toUpperCase());
      setShopeeAwbPdfUrl("");
      setFailedShopeePrintOrders([]);
      return;
    }

    const isTikTokPush =
      action === "push" &&
      rows.some((order) => getActionPlatform(order) === "tiktok");

    if (isTikTokPush) {
      const allowedStatuses = ["AWAITING_COLLECTION", "AWAITING_COLLECTION_PRINTED", "IN_TRANSIT"];
      const invalidRows = rows.filter((order) => !allowedStatuses.includes(String(order?.rawStatus || "").toUpperCase()));
      if (invalidRows.length > 0) {
        toast.error("Push is only available for AWAITING_COLLECTION TikTok orders");
        return;
      }

      setPendingTikTokPrintRows(rows);
      setTikTokPrintStatus(activeTab === "Pushed Successful" ? "AWAITING_COLLECTION_PRINTED" : String(rows[0]?.rawStatus || "").toUpperCase());
      setTikTokAwbPdfUrl("");
      setFailedTikTokPrintOrders([]);
      return;
    }

    actionMutation.mutate({ action, orders: rows });
  };

  const cancelShopeePack = () => {
    if (shopeePackMutation.isPending) return;
    setPendingShopeePackRows([]);
  };

  const confirmShopeePack = () => {
    if (!pendingShopeePackRows.length) return;
    shopeePackMutation.mutate(pendingShopeePackRows);
  };

  const cancelTikTokPack = () => {
    if (tikTokPackMutation.isPending) return;
    setPendingTikTokPackRows([]);
  };

  const confirmTikTokPack = () => {
    if (!pendingTikTokPackRows.length) return;
    tikTokPackMutation.mutate(pendingTikTokPackRows);
  };

  const cancelShopeePrint = () => {
    if (shopeePrintMutation.isPending) return;
    setPendingShopeePrintRows([]);
    setShopeePrintStatus("");
  };

  const confirmShopeePrint = () => {
    if (!pendingShopeePrintRows.length) return;
    setShopeeAwbModalOpen(true);
    const rows = pendingShopeePrintRows;
    const fromStatus = shopeePrintStatus;
    setPendingShopeePrintRows([]);
    shopeePrintMutation.mutate({ orders: rows, fromStatus });
  };

  const cancelTikTokPrint = () => {
    if (tikTokPrintMutation.isPending) return;
    setPendingTikTokPrintRows([]);
    setTikTokPrintStatus("");
  };

  const confirmTikTokPrint = () => {
    if (!pendingTikTokPrintRows.length) return;
    setTikTokAwbModalOpen(true);
    const rows = pendingTikTokPrintRows;
    const fromStatus = tikTokPrintStatus;
    setTikTokAwbRows(rows);
    setTikTokAwbFromStatus(fromStatus);
    setPendingTikTokPrintRows([]);
    tikTokPrintMutation.mutate({ orders: rows, fromStatus });
  };

  const closeShopeeAwbModal = () => {
    if (shopeePrintMutation.isPending) return;
    if (shopeeAwbPdfUrl) URL.revokeObjectURL(shopeeAwbPdfUrl);
    setShopeeAwbModalOpen(false);
    setShopeeAwbPdfUrl("");
    setFailedShopeePrintOrders([]);
    setShopeePrintStatus("");
  };

  const closeTikTokAwbModal = () => {
    if (tikTokPrintMutation.isPending) return;
    if (tikTokAwbPdfUrl) URL.revokeObjectURL(tikTokAwbPdfUrl);
    setTikTokAwbModalOpen(false);
    setTikTokAwbPdfUrl("");
    setFailedTikTokPrintOrders([]);
    setTikTokPrintStatus("");
    setTikTokAwbRows([]);
    setTikTokAwbFromStatus("");
  };

  const refreshTikTokAwbPdf = () => {
    if (!tikTokAwbRows.length || tikTokPrintMutation.isPending) return;
    if (tikTokAwbPdfUrl) URL.revokeObjectURL(tikTokAwbPdfUrl);
    setTikTokAwbPdfUrl("");
    setFailedTikTokPrintOrders([]);
    tikTokPrintMutation.mutate({ orders: tikTokAwbRows, fromStatus: tikTokAwbFromStatus });
  };

  const markWithdraw = async (rows = selectedRows) => {
    if (!rows.length) {
      toast.error("Please select at least one order");
      return;
    }

    const actionContext = getActionContext(rows);
    const platformName = String(rows[0]?.platform || actionContext?.platform || "").toLowerCase();
    const platform = platformName.includes("tik") ? "tiktok" : platformName.includes("shopee") ? "shopee" : "";
    const orderIds = rows.map((order) => order?.rawId || order?.orderNo || order?.id).filter(Boolean);

    if (!platform || orderIds.length === 0) {
      toast.error("Withdraw order could not be saved");
      return;
    }

    await Promise.all(rows.map((order) => deleteOrderSkuOverride({ order, context: actionContext })));
    await saveWithdrawOrders({ context: actionContext, platform, orderIds });
    invalidateOrderManagementData();
    setSelectedIds([]);
    setSelectedOrderRows([]);
    toast.success("Order moved to withdraw");
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
    appliedSearchType,
    appliedSkuType,
    dateRange,
    handleSearch,
    showSearchTypeDropdown,
    setShowSearchTypeDropdown,

    // data
    orders,
    allOrders,
    pagination,
    page: effectivePage,
    setPage: setPageAndPersist,
    statusSortDirection,
    setStatusSortDirection: handleStatusSortChange,
    selectedRows,
    isLoading: listLoading,
    isFetching,
    isError,
    error,
    refetch,
    hasStore,

    // selection
    selectedIds,
    selectionLoading,
    toggleSelect,
    toggleAll,
    allSelected: orders.length > 0 && orders.every((order) => selectedIds.includes(order.id)),
    someSelected: orders.some((order) => selectedIds.includes(order.id)),

    // actions
    runAction,
    markWithdraw,
    actionLoading: actionMutation.isPending || shopeePackMutation.isPending || shopeePrintMutation.isPending || tikTokPackMutation.isPending || tikTokPrintMutation.isPending || withdrawPackLoading,
    cacheOrderForDetail,
    shopeeNoItemsModalOpen,
    closeShopeeNoItemsModal: () => setShopeeNoItemsModalOpen(false),
    shopeePackConfirmOpen: pendingShopeePackRows.length > 0,
    shopeePackConfirmCount: pendingShopeePackRows.length,
    confirmShopeePack,
    cancelShopeePack,
    shopeePackLoading: shopeePackMutation.isPending,
    failedShopeePackOrders,
    closeFailedShopeePackOrders: () => setFailedShopeePackOrders([]),
    tikTokPackConfirmOpen: pendingTikTokPackRows.length > 0,
    tikTokPackConfirmCount: pendingTikTokPackRows.length,
    confirmTikTokPack,
    cancelTikTokPack,
    tikTokPackLoading: tikTokPackMutation.isPending,
    failedTikTokPackOrders,
    closeFailedTikTokPackOrders: () => setFailedTikTokPackOrders([]),
    shopeePrintConfirmOpen: pendingShopeePrintRows.length > 0,
    shopeePrintConfirmMessage:
      shopeePrintStatus === "PROCESSED"
        ? "Are you sure to print for ready to ship?"
        : "Do you want print AWB again?",
    confirmShopeePrint,
    cancelShopeePrint,
    shopeeAwbModalOpen,
    shopeeAwbLoading: shopeePrintMutation.isPending,
    shopeeAwbPdfUrl,
    closeShopeeAwbModal,
    failedShopeePrintOrders,
    tikTokPrintConfirmOpen: pendingTikTokPrintRows.length > 0,
    tikTokPrintConfirmMessage:
      tikTokPrintStatus === "AWAITING_COLLECTION"
        ? "Are you sure to print for ready to ship?"
        : "Do you want print AWB again?",
    confirmTikTokPrint,
    cancelTikTokPrint,
    tikTokAwbModalOpen,
    tikTokAwbLoading: tikTokPrintMutation.isPending,
    tikTokAwbPdfUrl,
    closeTikTokAwbModal,
    refreshTikTokAwbPdf,
    failedTikTokPrintOrders,

    // options
    platforms: DEFAULT_PLATFORMS,
    stores: DEFAULT_STORES,
    searchTypes: SEARCH_TYPES,
    skuTypes: SKU_TYPES,
  };
}
