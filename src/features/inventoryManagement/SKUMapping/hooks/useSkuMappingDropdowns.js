import { useQuery } from '@tanstack/react-query';
import api from '../../../../lib/api';
import { filterWarehousesByPermission } from '../../../../utils/permissions';

// ─────────────────────────────────────────────────────────────────────────────
// useSkuMappingDropdowns
// Fetches platforms, stores grouped by platform, and warehouses.
// Used by both ByProductSKUMappingPage and ByMerchantSKUMappingPage.
// API: GET /api/v1/sku-mapping/dropdowns
// ─────────────────────────────────────────────────────────────────────────────
export function useSkuMappingDropdowns() {
    const { data, isLoading, isError } = useQuery({
        queryKey:  ['sku-mapping', 'dropdowns'],
        queryFn:   () => api.get('/sku-mapping/dropdowns').then((r) => r.data),
        staleTime: 1000 * 60 * 10,
        gcTime:    1000 * 60 * 20,
    });

    // platforms: [{ label: 'shopee', value: 'shopee' }]
    const platforms = data?.platforms ?? [];

    // stores: [{ id, label, value, platform }]
    const stores = data?.stores ?? [];

    // storesByPlatform: { shopee: [...], tiktok: [...] }
    const storesByPlatform = data?.storesByPlatform ?? {};

    // warehouses: [{ id, label, value, is_default }]
    const warehouses = filterWarehousesByPermission(data?.warehouses ?? []);

    // Cascade: given a selected platform value, return that platform's stores
    const getStoresForPlatform = (platformValue) => {
        if (!platformValue) return stores;
        return storesByPlatform[platformValue] ?? [];
    };

    return {
        platforms,
        stores,
        storesByPlatform,
        warehouses,
        getStoresForPlatform,
        isLoading,
        isError,
    };
}
