import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchOrderDetail,
  fetchOrderActivityLogs,
  fetchOrderSkuAdjustments,
  fetchOrderWarehouses,
  getCachedOrderDetail,
  getStoredOrderContext,
  deleteOrderSkuAdjustment,
  saveOrderSkuAdjustment,
  searchMerchantSkus,
  setCachedOrderDetail,
  setCachedOrderDetailForId,
  updateOrderItemMapping,
} from "../utils/orderApi";

export const ORDER_DETAIL_KEYS = {
  detail: (platform, orderId) => ["order-management", "detail", platform, orderId],
  activityLogs: (platform, orderId) => ["order-management", "activity-logs", platform, orderId],
  merchantSkus: (params) => ["order-management", "merchant-skus", params],
};

const cleanSku = (value) =>
  String(value || "")
    .trim()
    .replace(/^SKU-/i, "")
    .toLowerCase();

const sameWarehouse = (sku, warehouse) => {
  if (!warehouse?.id && !warehouse?.name) return true;
  if (warehouse.id && String(sku?.warehouseId || "") === String(warehouse.id)) return true;
  return Boolean(warehouse.name && sku?.warehouseName && String(sku.warehouseName) === String(warehouse.name));
};

const getMappingStoreFilters = (context = {}) => {
  const platformStoreId = context.platform_store_id || context.store_id || "";
  const platformShopId = context.shop_id || context.store_shop_id || context.external_store_id || "";

  return {
    platformStoreId: String(platformStoreId).toLowerCase() === "all" ? "" : platformStoreId,
    platformShopId: String(platformShopId).toLowerCase() === "all" ? "" : platformShopId,
  };
};

const getSkuTotalAvailable = (sku) => Number(sku?.totalAvailable ?? sku?.onHand ?? 0);
const getOrderItemQuantity = (item) => Number(item?.quantity || 1);
const getSkuMappedWarehouseId = (sku) => {
  const mapping = Array.isArray(sku?.raw?.mappings) ? sku.raw.mappings[0] : null;
  return mapping?.fulfillment_warehouse_id || sku?.warehouseId || "";
};
const getOrderIdentity = (value) => value?.rawId || value?.orderId || value?.orderNo || value?.id;
const getAdjustmentStatus = (adjustments = []) => {
  const active = adjustments.filter((item) => item?.status !== "packed");
  const hasExchange = active.some((item) => item.adjustmentType === "exchange");
  const hasAdd = active.some((item) => item.adjustmentType === "add");
  return hasExchange && hasAdd ? "Exchange + Add" : hasExchange ? "Exchange" : hasAdd ? "Add" : "";
};
const getSkuDisplay = (sku = {}) => ({
  id: sku.merchantSkuId || sku.combineSkuId || sku.id || null,
  sku: sku.sku || sku.skuName || sku.name || null,
  name: sku.name || sku.skuTitle || sku.sku || sku.skuName || null,
  image: sku.image || sku.imageUrl || sku.image_url || null,
});
const normalizeAdjustmentPayload = (payload = {}) => payload?.data || payload;

export function useOrderDetail({
  platform,
  orderId,
  initialOrder,
  packAfterMapping = false,
  skuOverrideOnly = false,
  sourceTab = "",
  onPackAfterMappingSuccess,
}) {
  const queryClient = useQueryClient();
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingSearch, setMappingSearch] = useState("");
  const [appliedMappingSearch, setAppliedMappingSearch] = useState("");
  const [mappingSearchType, setMappingSearchType] = useState("sku_name");
  const [selectedSkuId, setSelectedSkuId] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [mappingTargetItem, setMappingTargetItem] = useState(null);
  const [mappingQuantity, setMappingQuantity] = useState(1);
  const context = getStoredOrderContext();
  const cachedOrder = initialOrder || getCachedOrderDetail(`${platform}:${orderId}`);

  const detailQuery = useQuery({
    queryKey: ORDER_DETAIL_KEYS.detail(platform, orderId),
    queryFn: () => fetchOrderDetail({ platform, orderId, context, cachedOrder }),
    enabled: Boolean(platform && orderId),
    staleTime: 1000 * 60,
    placeholderData: cachedOrder || undefined,
  });

  const order = detailQuery.data || cachedOrder;
  const orderIdentity = order?.rawId || order?.orderId || order?.orderNo || order?.id || orderId;

  const { data: warehouseOptions = [] } = useQuery({
    queryKey: ["order-management", "warehouses"],
    queryFn: fetchOrderWarehouses,
    enabled: showMappingModal,
    staleTime: 1000 * 60 * 10,
  });

  const adjustmentsQuery = useQuery({
    queryKey: ["order-management", "sku-adjustments", platform, orderIdentity],
    queryFn: () => fetchOrderSkuAdjustments({ platform: order?.platform || platform, orderIds: [orderIdentity] }),
    enabled: Boolean(orderIdentity && (order?.platform || platform)),
    staleTime: 1000 * 30,
  });

  const activityLogsQuery = useQuery({
    queryKey: ORDER_DETAIL_KEYS.activityLogs(order?.platform || platform, orderIdentity),
    queryFn: () => fetchOrderActivityLogs({ platform: order?.platform || platform, orderId: orderIdentity }),
    enabled: Boolean(orderIdentity && (order?.platform || platform)),
    staleTime: 1000 * 30,
  });

  const getWarehouseName = (warehouseId, fallback = "-") =>
    warehouseOptions.find((warehouse) => String(warehouse.id) === String(warehouseId))?.name || fallback;

  const skusQuery = useQuery({
    queryKey: ORDER_DETAIL_KEYS.merchantSkus({
      appliedMappingSearch,
      mappingSearchType,
      targetSku: mappingTargetItem?.sku,
      platformStoreId: getMappingStoreFilters(order?.storeContext || context).platformStoreId,
      platformShopId: getMappingStoreFilters(order?.storeContext || context).platformShopId,
      selectedWarehouseId,
      warehouseOptionCount: warehouseOptions.length,
    }),
    queryFn: async () => {
      const targetSku = mappingTargetItem?.sku || "";
      const storeFilters = getMappingStoreFilters(order?.storeContext || context);
      const targetMatches = targetSku
        ? await searchMerchantSkus({
            search: targetSku,
            searchType: "sku_name",
            limit: 20,
            ...storeFilters,
          })
        : [];
      const targetMerchantSku =
        targetMatches.find((sku) => cleanSku(sku.sku) === cleanSku(targetSku)) ||
        targetMatches[0] ||
        null;
      const matchedWarehouseId = getSkuMappedWarehouseId(targetMerchantSku);
      const fallbackWarehouse = warehouseOptions[0] || null;
      const activeWarehouseId = selectedWarehouseId || matchedWarehouseId || fallbackWarehouse?.id || "";
      const mappingWarehouse = activeWarehouseId
        ? {
            id: activeWarehouseId,
            name: getWarehouseName(activeWarehouseId, targetMerchantSku?.warehouseName || fallbackWarehouse?.name),
          }
        : null;

      const merchantSkus = await searchMerchantSkus({
        search: appliedMappingSearch,
        searchType: mappingSearchType,
        warehouseId: mappingWarehouse?.id,
        limit: 100,
      });

      return {
        merchantSkus: merchantSkus.filter((sku) => sameWarehouse(sku, mappingWarehouse)),
        mappingWarehouse,
      };
    },
    enabled: showMappingModal && Boolean(mappingTargetItem) && warehouseOptions.length > 0,
    staleTime: 1000 * 60,
    placeholderData: (previous) => previous,
  });

  const merchantSkus = Array.isArray(skusQuery.data)
    ? skusQuery.data
    : skusQuery.data?.merchantSkus || [];
  const mappingWarehouse = Array.isArray(skusQuery.data) ? null : skusQuery.data?.mappingWarehouse || null;
  useEffect(() => {
    if (!showMappingModal || selectedWarehouseId || !mappingWarehouse?.id) return;
    setSelectedWarehouseId(String(mappingWarehouse.id));
  }, [mappingWarehouse?.id, selectedWarehouseId, showMappingModal]);

  const selectedMerchantSku = useMemo(
    () => merchantSkus.find((sku) => String(sku.id) === String(selectedSkuId)),
    [merchantSkus, selectedSkuId]
  );

  const updateCachedOrderAdjustments = (updater) => {
    const targetOrderId = String(orderIdentity || "");
    if (!targetOrderId) return;

    const applyToOrder = (currentOrder) => {
      if (!currentOrder || String(getOrderIdentity(currentOrder) || "") !== targetOrderId) return currentOrder;
      const currentAdjustments = currentOrder.skuAdjustments || [];
      const nextAdjustments = updater(currentAdjustments);
      return {
        ...currentOrder,
        skuAdjustments: nextAdjustments,
        skuAdjustmentStatus: getAdjustmentStatus(nextAdjustments),
      };
    };

    queryClient.setQueriesData({ queryKey: ["order-management", "list"] }, (current) => {
      if (Array.isArray(current)) return current.map(applyToOrder);
      if (current && Array.isArray(current.orders)) {
        return {
          ...current,
          orders: current.orders.map(applyToOrder),
        };
      }
      return current;
    });

    queryClient.setQueryData(ORDER_DETAIL_KEYS.detail(platform, orderId), (current) => applyToOrder(current || order));
    const nextOrder = applyToOrder(order);
    if (nextOrder) {
      setCachedOrderDetail(nextOrder);
      setCachedOrderDetailForId(`${platform}:${orderId}`, nextOrder);
    }
  };

  const upsertCachedAdjustment = ({ result, adjustmentType, item, merchantSku }) => {
    const saved = normalizeAdjustmentPayload(result);
    const replacementSku = getSkuDisplay({
      ...merchantSku,
      merchantSkuId: saved.replacementMerchantSkuId,
      combineSkuId: saved.replacementCombineSkuId,
    });
    const nextAdjustment = {
      ...saved,
      adjustmentType,
      platform: saved.platform || order?.platform || platform,
      platformOrderId: saved.platformOrderId || orderIdentity,
      platformOrderItemId: saved.platformOrderItemId || item?.platformOrderItemId || item?.id,
      quantity: Number(saved.quantity || item?.quantity || mappingQuantity || 1),
      sourceTab: saved.sourceTab || sourceTab,
      status: saved.status || "active",
      originalSku: adjustmentType === "add" ? {} : getSkuDisplay(item),
      replacementSku,
    };

    queryClient.setQueryData(["order-management", "sku-adjustments", platform, orderIdentity], (current = []) => {
      const withoutCurrent = (current || []).filter((item) => String(item.id) !== String(nextAdjustment.id));
      return [...withoutCurrent, nextAdjustment];
    });

    updateCachedOrderAdjustments((current) => {
      const withoutCurrent = (current || []).filter((item) => String(item.id) !== String(nextAdjustment.id));
      return [...withoutCurrent, nextAdjustment];
    });
  };

  const removeCachedAdjustment = (adjustment) => {
    queryClient.setQueryData(["order-management", "sku-adjustments", platform, orderIdentity], (current = []) =>
      (current || []).filter((item) => String(item.id) !== String(adjustment?.id))
    );
    updateCachedOrderAdjustments((current) =>
      (current || []).filter((item) => String(item.id) !== String(adjustment?.id))
    );
  };

  const updateMappingMutation = useMutation({
    mutationFn: async () => {
      if (packAfterMapping || skuOverrideOnly) {
        const orderContext = order?.storeContext || context;

        await saveOrderSkuAdjustment({
          order,
          item: { ...mappingTargetItem, quantity: mappingQuantity },
          merchantSku: selectedMerchantSku,
          context: orderContext,
          adjustmentType: mappingTargetItem?.adjustmentType || "exchange",
          sourceTab,
          sourceItem: order?.items?.[0] || null,
        });

        return { message: "SKU adjustment saved" };
      }

      const mappingResult = await updateOrderItemMapping({
        order,
        item: mappingTargetItem,
        merchantSku: selectedMerchantSku,
      });

      return mappingResult;
    },
    onSuccess: async (data) => {
      if (packAfterMapping || skuOverrideOnly) {
        upsertCachedAdjustment({
          result: data,
          adjustmentType: mappingTargetItem?.adjustmentType || "exchange",
          item: { ...mappingTargetItem, quantity: mappingQuantity },
          merchantSku: selectedMerchantSku,
        });
      }
      toast.success(data?.message || "Merchant mapping updated");
      setShowMappingModal(false);
      setSelectedSkuId(null);
      setSelectedWarehouseId("");
      setMappingTargetItem(null);
      queryClient.invalidateQueries({ queryKey: ["order-management"] });
      queryClient.invalidateQueries({ queryKey: ["order-management", "sku-adjustments"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update mapping");
    },
  });

  const openMappingModal = (item) => {
    setMappingTargetItem({ ...item, adjustmentType: "exchange" });
    setMappingQuantity(Math.max(1, Number(item?.quantity || 1)));
    setSelectedSkuId(null);
    setSelectedWarehouseId("");
    setShowMappingModal(true);
  };

  const openAddSkuModal = (adjustment = null) => {
    setMappingTargetItem({
      id: adjustment?.platformOrderItemId || `ADD-${Date.now()}`,
      addLineId: adjustment?.platformOrderItemId || undefined,
      name: adjustment ? "Added SKU" : "Add SKU",
      sku: adjustment?.replacementSku?.sku || "",
      quantity: adjustment?.quantity || 1,
      adjustmentType: "add",
    });
    setMappingQuantity(Math.max(1, Number(adjustment?.quantity || 1)));
    setSelectedSkuId(null);
    setSelectedWarehouseId(String(adjustment?.replacementWarehouseId || ""));
    setShowMappingModal(true);
  };

  const deleteAdjustmentMutation = useMutation({
    mutationFn: (adjustment) => deleteOrderSkuAdjustment({ order, adjustment, context: order?.storeContext || context }),
    onSuccess: (_data, adjustment) => {
      removeCachedAdjustment(adjustment);
      toast.success("SKU adjustment deleted");
      queryClient.invalidateQueries({ queryKey: ["order-management"] });
      queryClient.invalidateQueries({ queryKey: ["order-management", "sku-adjustments"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete SKU adjustment");
    },
  });

  const updateAdjustmentQuantityMutation = useMutation({
    mutationFn: ({ adjustment, quantity, sourceItem }) => saveOrderSkuAdjustment({
      order,
      item: {
        ...(adjustment.adjustmentType === "add" ? {} : sourceItem || {}),
        id: adjustment.platformOrderItemId,
        addLineId: adjustment.adjustmentType === "add" ? adjustment.platformOrderItemId : undefined,
        platformOrderItemId: adjustment.platformOrderItemId,
        quantity,
        adjustmentType: adjustment.adjustmentType,
      },
      merchantSku: {
        id: adjustment.replacementCombineSkuId
          ? `combine:${adjustment.replacementCombineSkuId}`
          : `merchant:${adjustment.replacementMerchantSkuId}`,
        skuType: adjustment.replacementCombineSkuId ? "combine" : "merchant",
        merchantSkuId: adjustment.replacementMerchantSkuId,
        combineSkuId: adjustment.replacementCombineSkuId,
        warehouseId: adjustment.replacementWarehouseId,
      },
      context: order?.storeContext || context,
      adjustmentType: adjustment.adjustmentType,
      sourceTab,
      sourceItem: sourceItem || order?.items?.[0] || null,
    }),
    onSuccess: (data, variables) => {
      upsertCachedAdjustment({
        result: data,
        adjustmentType: variables.adjustment.adjustmentType,
        item: {
          ...(variables.sourceItem || {}),
          id: variables.adjustment.platformOrderItemId,
          platformOrderItemId: variables.adjustment.platformOrderItemId,
          quantity: variables.quantity,
        },
        merchantSku: {
          id: variables.adjustment.replacementCombineSkuId
            ? `combine:${variables.adjustment.replacementCombineSkuId}`
            : `merchant:${variables.adjustment.replacementMerchantSkuId}`,
          merchantSkuId: variables.adjustment.replacementMerchantSkuId,
          combineSkuId: variables.adjustment.replacementCombineSkuId,
          warehouseId: variables.adjustment.replacementWarehouseId,
          sku: variables.adjustment.replacementSku?.sku,
          name: variables.adjustment.replacementSku?.name,
          image: variables.adjustment.replacementSku?.image,
        },
      });
      toast.success("SKU quantity updated");
      queryClient.invalidateQueries({ queryKey: ["order-management"] });
      queryClient.invalidateQueries({ queryKey: ["order-management", "sku-adjustments"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update SKU quantity");
    },
  });

  const handleMappingSearch = () => setAppliedMappingSearch(mappingSearch);
  const handleWarehouseChange = (warehouseId) => {
    setSelectedWarehouseId(String(warehouseId || ""));
    setSelectedSkuId(null);
  };

  const confirmMapping = () => {
    if (!mappingTargetItem || !selectedMerchantSku) {
      toast.error("Please select one merchant SKU");
      return;
    }
    const quantity = Math.max(1, Number(mappingQuantity || 1));
    if (getSkuTotalAvailable(selectedMerchantSku) < quantity) {
      toast.error("Selected SKU total available quantity is not enough for this order");
      return;
    }
    updateMappingMutation.mutate();
  };

  return {
    order,
    isLoading: detailQuery.isLoading,
    isFetching: detailQuery.isFetching,
    isError: detailQuery.isError,
    error: detailQuery.error,
    showMappingModal,
    setShowMappingModal,
    mappingSearch,
    setMappingSearch,
    mappingSearchType,
    setMappingSearchType,
    handleMappingSearch,
    merchantSkus,
    mappingWarehouse,
    warehouseOptions,
    selectedWarehouseId,
    handleWarehouseChange,
    merchantSkusLoading: skusQuery.isLoading || skusQuery.isFetching,
    selectedSkuId,
    setSelectedSkuId,
    mappingQuantity,
    setMappingQuantity,
    mappingTargetItem,
    openMappingModal,
    confirmMapping,
    mappingSaving: updateMappingMutation.isPending,
    skuAdjustments: adjustmentsQuery.data || order?.skuAdjustments || [],
    skuAdjustmentsLoading: adjustmentsQuery.isLoading || adjustmentsQuery.isFetching,
    activityLogs: activityLogsQuery.data || [],
    activityLogsLoading: activityLogsQuery.isLoading || activityLogsQuery.isFetching,
    openAddSkuModal,
    deleteSkuAdjustment: (adjustment) => deleteAdjustmentMutation.mutate(adjustment),
    deletingSkuAdjustment: deleteAdjustmentMutation.isPending,
    updateSkuAdjustmentQuantity: (payload, options) => updateAdjustmentQuantityMutation.mutate(payload, options),
    updatingSkuAdjustmentQuantity: updateAdjustmentQuantityMutation.isPending,
  };
}
