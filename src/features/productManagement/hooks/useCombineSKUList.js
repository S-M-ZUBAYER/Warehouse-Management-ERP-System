import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
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
    console.log("call");

    const qs = new URLSearchParams();
    qs.set("page", params.page ?? 1);
    qs.set("limit", params.limit ?? 10); // ← changed from 20 to 10
    if (params.search?.trim()) qs.set("search", params.search.trim());
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    if (params.sortOrder) qs.set("sortOrder", params.sortOrder);
    return api.get(`/combine-skus?${qs.toString()}`).then((r) => r);
};

const deleteCombineSku = (id) => api.delete(`/combine-skus/${id}`).then((r) => r.data);
const bulkDeleteCombineSkus = (ids) => api.delete("/combine-skus/bulk", { data: { ids } }).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useCombineSKUList() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
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
    } = useQuery({
        queryKey: COMBINE_SKU_KEYS.list(listFilters),
        queryFn: () => fetchCombineSkus(listFilters),
        staleTime: 1000 * 60 * 1,
        gcTime: 1000 * 60 * 3,
        placeholderData: (prev) => prev,
    });

    const bundles = listData?.data ?? [];
    const pagination = listData?.pagination ?? { total: 0, totalPages: 1, page: 1, limit: 10 };

    // ── Delete single ─────────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: deleteCombineSku,
        onSuccess: () => {
            toast.success("Combine SKU deleted successfully");
            setShowDeleteModal(false);
            setDeleteTarget(null);
            setSelectedIds((p) => p.filter((id) => id !== deleteTarget?.id));
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

    const toggleAll = useCallback(() => {
        const ids = bundles.map((b) => b.id);
        const allSel = ids.every((id) => selectedIds.includes(id));
        setSelectedIds(allSel ? [] : ids);
    }, [bundles, selectedIds]);

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

        // selection
        selectedIds, toggleSelect, toggleAll,
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