import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchOrders,
  generateShopeeAwbPdf,
  generateTikTokAwbPdf,
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

const DEFAULT_PLATFORMS = ["Shopee", "TikTok"];
const DEFAULT_STORES = ["Store Name Here"];
const SEARCH_TYPES = ["Single Search", "Batch Search"];
const SKU_TYPES = ["SKU", "Package Number", "Order Number", "Tracking Number"];
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
  const [appliedSearchType, setAppliedSearchType] = useState(storedSearch?.searchType || "Single Search");
  const [appliedSkuType, setAppliedSkuType] = useState(storedSearch?.skuType || "SKU");
  const [storeContext, setStoreContext] = useState(getStoredOrderContext());
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [pageCursors, setPageCursors] = useState({ 1: "" });
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
  const platformValue = String(storeContext?.platform || "").toLowerCase();
  const serverPaginatedPageTypes = ["completed"];
  const serverPaginated =
    serverPaginatedPageTypes.includes(pageType) &&
    (platformValue.includes("shopee") || platformValue.includes("tik"));
  const detailPaginated =
    !serverPaginated &&
    ["all", "canceled"].includes(pageType) &&
    platformValue.includes("shopee");
  const queryPage = serverPaginated || detailPaginated ? page : 1;
  const queryCursor = serverPaginated ? pageCursors[page] || "" : "";

  useEffect(() => {
    setSelectedIds([]);
    setPage(1);
    setPageCursors({ 1: "" });
  }, [pageType, activeTab, appliedSearch, appliedSearchType, appliedSkuType, storeContext?.platform_store_id, storeContext?.platform, dateRange?.start, dateRange?.end]);

  const queryParams = useMemo(
    () => ({
      context: storeContext,
      pageType,
      tab: activeTab,
      search: appliedSearch,
      searchType: appliedSearchType,
      skuType: appliedSkuType,
      dateRange,
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
    [activeTab, appliedSearch, appliedSearchType, appliedSkuType, dateRange, detailPaginated, pageType, queryCursor, queryPage, serverPaginated, storeContext]
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

  const effectivePage = Math.min(page, pagination.totalPages);
  const orders = useMemo(() => {
    if (serverPaginated) return allOrders;

    const start = (effectivePage - 1) * ORDER_PAGE_SIZE;
    return allOrders.slice(start, start + ORDER_PAGE_SIZE);
  }, [allOrders, effectivePage, serverPaginated]);

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
    mutationFn: (orders) => packShopeeOrders({ context: storeContext, orders }),
    onSuccess: ({ successfulIds = [], failedOrders = [] }) => {
      removeOrdersFromCurrentList(successfulIds);
      removeFailedPackOrders({ context: storeContext, platform: "shopee", orderIds: successfulIds });
      removeWithdrawOrders({ context: storeContext, platform: "shopee", orderIds: successfulIds });
      saveFailedPackOrders({ context: storeContext, platform: "shopee", failedOrders });
      queryClient.invalidateQueries({ queryKey: ORDER_LIST_KEYS.all() });
      setSelectedIds([]);
      setPendingShopeePackRows([]);
      setFailedShopeePackOrders(failedOrders);

      if (failedOrders.length > 0) {
        toast.error(`${failedOrders.length} Shopee order(s) failed to pack`);
      } else {
        toast.success("All selected orders shipped successfully!");
      }
    },
    onError: (err) => {
      toast.error(err?.message || "Shopee package action failed");
    },
  });

  const shopeePrintMutation = useMutation({
    mutationFn: ({ orders, fromStatus }) =>
      generateShopeeAwbPdf({ context: storeContext, orders, fromStatus }),
    onSuccess: ({ pdfUrl = "", failedOrders = [], printedOrderIds = [] }, variables) => {
      if (String(variables?.fromStatus || "").toUpperCase() === "PROCESSED") {
        savePushSuccessfulOrders({ context: storeContext, platform: "shopee", orderIds: printedOrderIds });
        queryClient.invalidateQueries({ queryKey: ORDER_LIST_KEYS.all() });
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
      generateTikTokAwbPdf({ context: storeContext, orders, fromStatus }),
    onSuccess: ({ pdfUrl = "", failedOrders = [], printedOrderIds = [] }, variables) => {
      if (String(variables?.fromStatus || "").toUpperCase() === "AWAITING_COLLECTION") {
        savePushSuccessfulOrders({ context: storeContext, platform: "tiktok", orderIds: printedOrderIds });
        queryClient.invalidateQueries({ queryKey: ORDER_LIST_KEYS.all() });
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
    mutationFn: (orders) => packTikTokOrders({ context: storeContext, orders }),
    onSuccess: ({ successfulIds = [], failedOrders = [] }) => {
      removeOrdersFromCurrentList(successfulIds);
      removeFailedPackOrders({ context: storeContext, platform: "tiktok", orderIds: successfulIds });
      removeWithdrawOrders({ context: storeContext, platform: "tiktok", orderIds: successfulIds });
      saveFailedPackOrders({ context: storeContext, platform: "tiktok", failedOrders });
      queryClient.invalidateQueries({ queryKey: ORDER_LIST_KEYS.all() });
      setSelectedIds([]);
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
    setAppliedSearchType(searchType);
    setAppliedSkuType(skuType);
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

    const isShopeePack =
      action === "pack" &&
      rows.some((order) => String(order?.platform || "").toLowerCase() === "shopee");

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
      rows.some((order) => String(order?.platform || "").toLowerCase() === "tiktok");

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
      rows.some((order) => String(order?.platform || "").toLowerCase() === "shopee");

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
      rows.some((order) => String(order?.platform || "").toLowerCase() === "tiktok");

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
  };

  const markWithdraw = async (rows = selectedRows) => {
    if (!rows.length) {
      toast.error("Please select at least one order");
      return;
    }

    const platformName = String(rows[0]?.platform || storeContext?.platform || "").toLowerCase();
    const platform = platformName.includes("tik") ? "tiktok" : platformName.includes("shopee") ? "shopee" : "";
    const orderIds = rows.map((order) => order?.rawId || order?.orderNo || order?.id).filter(Boolean);

    if (!platform || orderIds.length === 0) {
      toast.error("Withdraw order could not be saved");
      return;
    }

    await saveWithdrawOrders({ context: storeContext, platform, orderIds });
    queryClient.invalidateQueries({ queryKey: ORDER_LIST_KEYS.all() });
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
    handleSearch,
    showSearchTypeDropdown,
    setShowSearchTypeDropdown,

    // data
    orders,
    allOrders,
    pagination,
    page: effectivePage,
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
    markWithdraw,
    actionLoading: actionMutation.isPending || shopeePackMutation.isPending || shopeePrintMutation.isPending || tikTokPackMutation.isPending || tikTokPrintMutation.isPending,
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
    failedTikTokPrintOrders,

    // options
    platforms: DEFAULT_PLATFORMS,
    stores: DEFAULT_STORES,
    searchTypes: SEARCH_TYPES,
    skuTypes: SKU_TYPES,
  };
}
