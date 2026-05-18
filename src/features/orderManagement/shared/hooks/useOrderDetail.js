import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchOrderDetail,
  getCachedOrderDetail,
  getStoredOrderContext,
  searchMerchantSkus,
  updateOrderItemMapping,
} from "../utils/orderApi";

export const ORDER_DETAIL_KEYS = {
  detail: (platform, orderId) => ["order-management", "detail", platform, orderId],
  merchantSkus: (params) => ["order-management", "merchant-skus", params],
};

export function useOrderDetail({ platform, orderId, initialOrder }) {
  const queryClient = useQueryClient();
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingSearch, setMappingSearch] = useState("");
  const [appliedMappingSearch, setAppliedMappingSearch] = useState("");
  const [mappingSearchType, setMappingSearchType] = useState("sku_name");
  const [selectedSkuId, setSelectedSkuId] = useState(null);
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

  const skusQuery = useQuery({
    queryKey: ORDER_DETAIL_KEYS.merchantSkus({ appliedMappingSearch, mappingSearchType }),
    queryFn: () => searchMerchantSkus({ search: appliedMappingSearch, searchType: mappingSearchType }),
    enabled: showMappingModal,
    staleTime: 1000 * 60,
    placeholderData: (previous) => previous,
  });

  const merchantSkus = skusQuery.data || [];
  const selectedMerchantSku = useMemo(
    () => merchantSkus.find((sku) => String(sku.id) === String(selectedSkuId)),
    [merchantSkus, selectedSkuId]
  );

  const updateMappingMutation = useMutation({
    mutationFn: () =>
      updateOrderItemMapping({
        order,
        item: mappingTargetItem,
        merchantSku: selectedMerchantSku,
      }),
    onSuccess: (data) => {
      toast.success(data?.message || "Merchant mapping updated");
      setShowMappingModal(false);
      setSelectedSkuId(null);
      setMappingTargetItem(null);
      queryClient.invalidateQueries({ queryKey: ["order-management"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update mapping");
    },
  });

  const openMappingModal = (item) => {
    setMappingTargetItem(item);
    setSelectedSkuId(null);
    setShowMappingModal(true);
  };

  const handleMappingSearch = () => setAppliedMappingSearch(mappingSearch);

  const confirmMapping = () => {
    if (!mappingTargetItem || !selectedMerchantSku) {
      toast.error("Please select one merchant SKU");
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
    merchantSkusLoading: skusQuery.isLoading || skusQuery.isFetching,
    selectedSkuId,
    setSelectedSkuId,
    mappingTargetItem,
    openMappingModal,
    confirmMapping,
    mappingSaving: updateMappingMutation.isPending,
  };
}
