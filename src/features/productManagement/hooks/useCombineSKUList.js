import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../../lib/api";
import useDebounce from "../../../hooks/useDebounce";

// ─────────────────────────────────────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────────────────────────────────────
export const COMBINE_SKU_KEYS = {
    all: () => ["combine-skus"],
    list: (filters) => ["combine-skus", "list", filters],
    detail: (id) => ["combine-skus", "detail", id],
    // ← warehouseId added so picker re-fetches when warehouse changes
    picker: (search, warehouseId) => ["combine-skus", "picker", search, warehouseId],
};

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────
const fetchCombineSkus = (params) => {

    const qs = new URLSearchParams();
    qs.set("page", params.page ?? 1);
    qs.set("limit", params.limit ?? 10); // ← changed from 20 to 10
    if (params.search?.trim()) qs.set("search", params.search.trim());
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    if (params.sortOrder) qs.set("sortOrder", params.sortOrder);
    return api.get(`/combine-skus?${qs.toString()}`).then((r) => r);
};

const fetchAllCombineSkus = async (params, knownTotal = 0) => {
    const pageLimit = Math.max(100, Number(knownTotal) || 100);
    const first = await fetchCombineSkus({ ...params, page: 1, limit: pageLimit });
    const totalPages = first?.pagination?.totalPages ?? 1;

    if (totalPages <= 1) return first?.data ?? [];

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
            fetchCombineSkus({ ...params, page: index + 2, limit: pageLimit })
        )
    );

    return [...(first?.data ?? []), ...rest.flatMap((response) => response?.data ?? [])];
};

const deleteCombineSku = (id) => api.delete(`/combine-skus/${id}`).then((r) => r.data);
const bulkDeleteCombineSkus = async (ids) => {
    await Promise.all(ids.map((id) => deleteCombineSku(id)));
    return { deleted: ids.length };
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useCombineSKUList() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedBundles, setSelectedBundles] = useState([]);
    const [selectionLoading, setSelectionLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const debouncedSearch = useDebounce(search, 350);
    const queryClient = useQueryClient();

    const listFilters = {
        page,
        limit: 10, // ← 10 per page
        search: debouncedSearch,
        sortBy: "created_at",
        sortOrder: "DESC",
    };

    // ── List query ────────────────────────────────────────────────────────────
    const {
        data: listData,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: COMBINE_SKU_KEYS.list(listFilters),
        queryFn: () => fetchCombineSkus(listFilters),
        staleTime: 1000 * 60 * 1,
        gcTime: 1000 * 60 * 3,
        placeholderData: (prev) => prev,
    });

    const bundles = listData?.data ?? [];
    const pagination = listData?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 10 };

    useEffect(() => {
        setSelectedBundles((prev) => {
            const rowById = new Map(prev.map((bundle) => [bundle.id, bundle]));
            bundles.forEach((bundle) => {
                if (selectedIds.includes(bundle.id)) rowById.set(bundle.id, bundle);
            });
            return selectedIds.map((id) => rowById.get(id)).filter(Boolean);
        });
    }, [bundles, selectedIds]);

    // ── Delete single ─────────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: deleteCombineSku,
        onSuccess: () => {
            toast.success("Combine SKU deleted successfully");
            setShowDeleteModal(false);
            setDeleteTarget(null);
            setSelectedIds((p) => p.filter((id) => id !== deleteTarget?.id));
            setSelectedBundles((p) => p.filter((bundle) => bundle.id !== deleteTarget?.id));
            queryClient.invalidateQueries({ queryKey: COMBINE_SKU_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? "Failed to delete");
        },
    });

    // ── Bulk delete ───────────────────────────────────────────────────────────
    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeleteCombineSkus,
        onSuccess: () => {
            toast.success(`${selectedIds.length} Combine SKU(s) deleted`);
            setSelectedIds([]);
            setSelectedBundles([]);
            setBulkDeleteConfirm(false);
            queryClient.invalidateQueries({ queryKey: COMBINE_SKU_KEYS.all() });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? "Bulk delete failed");
        },
    });

    // ── Selection ─────────────────────────────────────────────────────────────
    const toggleSelect = useCallback((id) => {
        setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    }, []);

    const toggleAll = useCallback(async () => {
        setSelectionLoading(true);
        const pageIds = bundles.map((b) => b.id);
        const allFilteredSelected =
            pagination.total > 0 &&
            selectedIds.length >= pagination.total &&
            pageIds.every((id) => selectedIds.includes(id));

        if (allFilteredSelected) {
            setSelectedIds([]);
            setSelectedBundles([]);
            setSelectionLoading(false);
            return;
        }

        try {
            const allBundles = await fetchAllCombineSkus(listFilters, pagination.total);
            setSelectedBundles(allBundles);
            setSelectedIds(allBundles.map((bundle) => bundle.id));
        } catch (err) {
            toast.error(err?.response?.data?.message ?? err?.message ?? "Failed to select all Combine SKUs");
        } finally {
            setSelectionLoading(false);
        }
    }, [bundles, selectedIds, pagination.total, listFilters]);

    // ── Delete helpers ────────────────────────────────────────────────────────
    const openDeleteModal = useCallback((bundle) => {
        setDeleteTarget(bundle);
        setShowDeleteModal(true);
    }, []);

    const confirmDelete = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id);
    }, [deleteTarget, deleteMutation]);

    const confirmBulkDelete = useCallback(() => {
        if (!selectedIds.length) return;
        bulkDeleteMutation.mutate(selectedIds);
    }, [selectedIds, bulkDeleteMutation]);

    return {
        // search
        search, setSearch,
        page, setPage,

        // data
        bundles,
        pagination,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,

        // selection
        selectedIds, selectedBundles, selectionLoading, toggleSelect, toggleAll,
        allSelected: bundles.length > 0 && bundles.every((b) => selectedIds.includes(b.id)),
        someSelected: bundles.some((b) => selectedIds.includes(b.id)),

        // delete
        deleteTarget,
        showDeleteModal, setShowDeleteModal,
        openDeleteModal,
        confirmDelete,
        deleting: deleteMutation.isPending,

        // bulk delete
        bulkDeleteConfirm, setBulkDeleteConfirm,
        confirmBulkDelete,
        bulkDeleting: bulkDeleteMutation.isPending,
    };
}
