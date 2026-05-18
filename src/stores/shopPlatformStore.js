/**
 * shopPlatformStore.js
 *
 * Global Zustand store for:
 *   - Selected shop (store)
 *   - Selected platform
 *   - Date range
 *   - Shared API data (warehouses, all stores, etc.) fetched ONCE and shared everywhere
 *
 * Default logic:
 *   - If no previous selection exists:
 *       1. Prefer TikTok + first TikTok store
 *       2. Fallback to Shopee + first Shopee store
 *       3. Fallback to first available platform + first store
 *   - Selection is persisted in localStorage via zustand/persist
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: pick default platform + store from the stores list
// Priority: tiktok → shopee → first available
// ─────────────────────────────────────────────────────────────────────────────
const pickDefaults = (storesByPlatform) => {
    const PRIORITY = ['tiktok', 'shopee'];
    for (const platform of PRIORITY) {
        const list = storesByPlatform[platform];
        if (list && list.length > 0) {
            return {
                selectedPlatform: platform,
                selectedShopId:   String(list[0].id),
                selectedShopName: list[0].label,
            };
        }
    }
    // Fallback: first platform in whatever order
    const platforms = Object.keys(storesByPlatform);
    if (platforms.length > 0) {
        const platform = platforms[0];
        const list     = storesByPlatform[platform];
        if (list && list.length > 0) {
            return {
                selectedPlatform: platform,
                selectedShopId:   String(list[0].id),
                selectedShopName: list[0].label,
            };
        }
    }
    return { selectedPlatform: '', selectedShopId: '', selectedShopName: '' };
};

// Default date range: last 30 days
const defaultDateRange = () => {
    const end   = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate:   end.toISOString().split('T')[0],
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────
export const useShopPlatformStore = create(
    persist(
        (set, get) => ({
            // ── Selection state ───────────────────────────────────────────────
            selectedPlatform: '',
            selectedShopId:   '',
            selectedShopName: '',
            dateRange:        defaultDateRange(),

            // ── Shared data (loaded once, reused everywhere) ──────────────────
            // Shape mirrors skuMapping/dropdowns response:
            //   platforms:        [{ label, value }]
            //   stores:           [{ id, label, value, platform }]
            //   storesByPlatform: { tiktok: [...], shopee: [...] }
            //   warehouses:       [{ id, label, value, is_default }]
            platforms:        [],
            stores:           [],
            storesByPlatform: {},
            warehouses:       [],
            dropdownsLoaded:  false,
            dropdownsLoading: false,

            // ── Actions ───────────────────────────────────────────────────────

            /**
             * setDropdownData — called once after fetching /sku-mapping/dropdowns
             * (or any API that returns the same shape).
             * If the user had no prior selection, auto-selects the best default.
             */
            setDropdownData: (data) => {
                const { selectedPlatform, selectedShopId } = get();

                const platforms        = data.platforms        ?? [];
                const stores           = data.stores           ?? [];
                const storesByPlatform = data.storesByPlatform ?? {};
                const warehouses       = data.warehouses       ?? [];

                // Only auto-select if nothing was previously chosen
                let patch = {};
                if (!selectedPlatform || !selectedShopId) {
                    patch = pickDefaults(storesByPlatform);
                } else {
                    // Validate persisted selection still exists in fresh data
                    const shopStillExists = stores.some((s) => String(s.id) === selectedShopId);
                    if (!shopStillExists) {
                        patch = pickDefaults(storesByPlatform);
                    }
                }

                set({
                    platforms,
                    stores,
                    storesByPlatform,
                    warehouses,
                    dropdownsLoaded:  true,
                    dropdownsLoading: false,
                    ...patch,
                });
            },

            setDropdownsLoading: (loading) => set({ dropdownsLoading: loading }),

            /**
             * selectPlatform — user picks a platform; auto-selects its first store.
             */
            selectPlatform: (platform) => {
                const { storesByPlatform } = get();
                const list = storesByPlatform[platform] ?? [];
                set({
                    selectedPlatform: platform,
                    selectedShopId:   list.length > 0 ? String(list[0].id) : '',
                    selectedShopName: list.length > 0 ? list[0].label      : '',
                });
            },

            /**
             * selectShop — user picks a specific store from the current platform's list.
             */
            selectShop: (shopId) => {
                const { stores } = get();
                const shop = stores.find((s) => String(s.id) === String(shopId));
                set({
                    selectedShopId:   shopId,
                    selectedShopName: shop?.label ?? '',
                });
            },

            /**
             * setDateRange — user picks a date range.
             * @param {{ startDate: string, endDate: string }} range
             */
            setDateRange: (range) => set({ dateRange: range }),

            /**
             * getStoresForPlatform — helper selector (not state).
             */
            getStoresForPlatform: (platform) => {
                const { storesByPlatform, stores } = get();
                if (!platform) return stores;
                return storesByPlatform[platform] ?? [];
            },

            /**
             * getSelectedStoreId as number (for API calls).
             */
            getSelectedStoreIdNum: () => {
                const { selectedShopId } = get();
                return selectedShopId ? parseInt(selectedShopId, 10) : null;
            },
        }),
        {
            name:    'shop-platform-store',
            // Only persist selections, not the full dropdown data (refetched on load)
            partialize: (state) => ({
                selectedPlatform: state.selectedPlatform,
                selectedShopId:   state.selectedShopId,
                selectedShopName: state.selectedShopName,
                dateRange:        state.dateRange,
            }),
        }
    )
);