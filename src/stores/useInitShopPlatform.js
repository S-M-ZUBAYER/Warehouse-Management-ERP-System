/**
 * useInitShopPlatform.js
 *
 * Call this hook ONCE near the top of your app (e.g. in AppShell or a layout
 * component that always mounts after login).
 *
 * It fetches /api/v1/sku-mapping/dropdowns (platforms, stores, warehouses)
 * and writes the result into the global Zustand store so every page can read
 * selectedPlatform, selectedShopId, warehouses, etc. without re-fetching.
 *
 * Usage:
 *   // In AppShell.jsx or any always-mounted layout component
 *   import { useInitShopPlatform } from '@/hooks/useInitShopPlatform';
 *   export default function AppShell() {
 *     useInitShopPlatform();
 *     ...
 *   }
 */

import { useEffect } from 'react';
import { useQuery }  from '@tanstack/react-query';
import api           from '../lib/api';
import { useShopPlatformStore } from '../stores/shopPlatformStore';

const fetchDropdowns = () =>
    api.get('/sku-mapping/dropdowns').then((r) => r.data);

export function useInitShopPlatform() {
    const setDropdownData    = useShopPlatformStore((s) => s.setDropdownData);
    const setDropdownsLoading = useShopPlatformStore((s) => s.setDropdownsLoading);

    const { data, isLoading, isSuccess } = useQuery({
        queryKey:  ['global', 'shop-platform-dropdowns'],
        queryFn:   fetchDropdowns,
        staleTime: 1000 * 60 * 10, // 10 min — refresh silently in background
        gcTime:    1000 * 60 * 30,
    });

    useEffect(() => {
        setDropdownsLoading(isLoading);
    }, [isLoading, setDropdownsLoading]);

    useEffect(() => {
        if (isSuccess && data) {
            console.log(data,"all platform data..........");
            
            setDropdownData(data);
        }
    }, [isSuccess, data, setDropdownData]);
}