'use strict';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────
export const INBOUND_DROPDOWN_KEY = () => ['outbound', 'dropdowns'];

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
const fetchOutboundDropdowns = () =>
    api.get('/outbound/dropdowns').then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
// Hook — returns warehouses list and currencies list
// Used by: OutboundFilterBar, CreateOutboundPage (warehouse select + currency)
// ─────────────────────────────────────────────────────────────────────────────
export function useOutboundDropdowns() {
    const { data, isLoading, isError } = useQuery({
        queryKey: INBOUND_DROPDOWN_KEY(),
        queryFn: fetchOutboundDropdowns,
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 20,
    });

    const warehouses = data?.warehouses ?? [];
    const currencies = data?.currencies ?? [];

    // Options shaped for the filter bar dropdowns
    const warehouseOptions = [
        { label: 'Warehouse name here', value: '' },
        ...warehouses.map((w) => ({ label: w.name, value: String(w.id) })),
    ];

    return {
        warehouses,
        currencies,
        warehouseOptions,
        isLoading,
        isError,
    };
}
