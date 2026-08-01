import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchOrderDetail,
  fetchOrderWarehouses,
  getCachedOrderDetail,
  getStoredOrderContext,
  overrideOutOfStockSkuAndPackStock,
  packShopeeOrders,
  packTikTokOrders,
  searchMerchantSkus,
  updateOrderItemMapping,
} from "../utils/orderApi";

export const ORDER_DETAIL_KEYS = {
  detail: (platform, orderId) => ["order-management", "detail", platform, orderId],
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

export function useOrderDetail({
  platform,
  orderId,
  initialOrder,
  packAfterMapping = false,
  skuOverrideOnly = false,
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

  const { data: warehouseOptions = [] } = useQuery({
    queryKey: ["order-management", "warehouses"],
    queryFn: fetchOrderWarehouses,
    enabled: showMappingModal,
    staleTime: 1000 * 60 * 10,
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

  const updateMappingMutation = useMutation({
    mutationFn: async () => {
      if (packAfterMapping || skuOverrideOnly) {
        const orderContext = order?.storeContext || context;

        await overrideOutOfStockSkuAndPackStock({
          order,
          item: mappingTargetItem,
          merchantSku: selectedMerchantSku,
          context: orderContext,
        });

        if (skuOverrideOnly) {
          return { message: "Merchant mapping updated" };
        }

        const normalizedPlatform = String(order?.platform || platform || "").toLowerCase();
        const packResult = normalizedPlatform.includes("shopee")
          ? await packShopeeOrders({ context: orderContext, orders: [order] })
          : normalizedPlatform.includes("tik")
            ? await packTikTokOrders({ context: orderContext, orders: [order] })
            : null;

        if (packResult?.failedOrders?.length) {
          throw new Error(packResult.failedOrders[0]?.reason || "Order packaging failed");
        }

        return packResult;
      }

      const mappingResult = await updateOrderItemMapping({
        order,
        item: mappingTargetItem,
        merchantSku: selectedMerchantSku,
      });

      return mappingResult;
    },
    onSuccess: async (data) => {
      toast.success(packAfterMapping ? "Order packed" : data?.message || "Merchant mapping updated");
      setShowMappingModal(false);
      setSelectedSkuId(null);
      setSelectedWarehouseId("");
      setMappingTargetItem(null);
      queryClient.invalidateQueries({ queryKey: ["order-management"] });
      if (packAfterMapping || skuOverrideOnly) {
        await onPackAfterMappingSuccess?.({
          order,
          context: order?.storeContext || context,
          platform: String(order?.platform || platform || "").toLowerCase(),
        });
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update mapping");
    },
  });

  const openMappingModal = (item) => {
    setMappingTargetItem(item);
    setSelectedSkuId(null);
    setSelectedWarehouseId("");
    setShowMappingModal(true);
  };

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
    if (getSkuTotalAvailable(selectedMerchantSku) < getOrderItemQuantity(mappingTargetItem)) {
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
    mappingTargetItem,
    openMappingModal,
    confirmMapping,
    mappingSaving: updateMappingMutation.isPending,
  };
}
