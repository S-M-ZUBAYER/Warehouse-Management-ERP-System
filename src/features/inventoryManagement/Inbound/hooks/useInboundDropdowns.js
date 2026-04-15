'use strict';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────
export const INBOUND_DROPDOWN_KEY = () => ['inbound', 'dropdowns'];

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
const fetchInboundDropdowns = () =>
    api.get('/inbound/dropdowns').then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
// Hook — returns warehouses list and currencies list
// Used by: InboundFilterBar, CreateInboundPage (warehouse select + currency)
// ─────────────────────────────────────────────────────────────────────────────
export function useInboundDropdowns() {
    const { data, isLoading, isError } = useQuery({
        queryKey: INBOUND_DROPDOWN_KEY(),
        queryFn: fetchInboundDropdowns,
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
