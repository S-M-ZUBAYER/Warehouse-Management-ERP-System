/**
 * useSkuSyncGroups.js
 *
 * Hook for the Merchant SKU Sync Group feature (TP870 ↔ TP890 linking).
 * Used in ByMerchantSKUMappingsPage in the "Mapped SKU" dropdown actions.
 *
 * API:
 *   GET  /api/v1/sku-sync-groups
 *   GET  /api/v1/sku-sync-groups/eligible-secondaries?primarySkuId=X
 *   POST /api/v1/sku-sync-groups
 *   POST /api/v1/sku-sync-groups/:groupId/members
 *   DELETE /api/v1/sku-sync-groups/:groupId/members/:memberSkuId
 *   DELETE /api/v1/sku-sync-groups/:groupId
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../../../lib/api';

// ─── API helpers ──────────────────────────────────────────────────────────────
const fetchGroups             = ()              => api.get('/sku-sync-groups').then((r) => r.data);
const fetchGroup              = (id)            => api.get(`/sku-sync-groups/${id}`).then((r) => r.data);
const fetchEligible           = (primarySkuId)  => api.get(`/sku-sync-groups/eligible-secondaries?primarySkuId=${primarySkuId}`).then((r) => r.data);
const apiCreateGroup          = (body)          => api.post('/sku-sync-groups', body).then((r) => r.data);
const apiAddMember            = (groupId, body) => api.post(`/sku-sync-groups/${groupId}/members`, body).then((r) => r.data);
const apiRemoveMember         = ({ groupId, memberSkuId }) => api.delete(`/sku-sync-groups/${groupId}/members/${memberSkuId}`).then((r) => r.data);
const apiDissolveGroup        = (groupId)       => api.delete(`/sku-sync-groups/${groupId}`).then((r) => r.data);

const KEYS = {
    all:     () => ['sku-sync-groups'],
    list:    () => ['sku-sync-groups', 'list'],
    one:     (id) => ['sku-sync-groups', 'one', id],
    eligible:(id) => ['sku-sync-groups', 'eligible', id],
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useSkuSyncGroups() {
    const qc = useQueryClient();

    // ── State for modals ──────────────────────────────────────────────────────
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showAddMemberModal,   setShowAddMemberModal]   = useState(false);
    const [activeGroup,          setActiveGroup]          = useState(null); // group obj for add-member flow
    const [targetPrimarySkuId,   setTargetPrimarySkuId]   = useState(null); // for create-group flow

    // ── List all groups ───────────────────────────────────────────────────────
    const {
        data: groups = [],
        isLoading: groupsLoading,
    } = useQuery({
        queryKey:  KEYS.list(),
        queryFn:   fetchGroups,
        staleTime: 1000 * 60 * 5,
        select:    (r) => r?.data ?? [],
    });

    // ── Eligible secondaries (for add-member modal) ───────────────────────────
    const {
        data: eligibleSecondaries = [],
        isLoading: eligibleLoading,
    } = useQuery({
        queryKey:  KEYS.eligible(activeGroup?.primarySku?.id),
        queryFn:   () => fetchEligible(activeGroup.primarySku.id),
        enabled:   showAddMemberModal && !!activeGroup?.primarySku?.id,
        staleTime: 1000 * 30,
        select:    (r) => r?.data ?? [],
    });

    // ── Mutations ─────────────────────────────────────────────────────────────
    const createGroupMutation = useMutation({
        mutationFn: apiCreateGroup,
        onSuccess:  (data) => {
            toast.success(data.message ?? 'Sync group created');
            setShowCreateGroupModal(false);
            qc.invalidateQueries({ queryKey: KEYS.all() });
        },
        onError: (e) => toast.error(e?.response?.data?.message ?? 'Failed to create group'),
    });

    const addMemberMutation = useMutation({
        mutationFn: ({ groupId, secondarySkuId }) => apiAddMember(groupId, { secondarySkuId }),
        onSuccess:  (data) => {
            toast.success(data.message ?? 'SKU linked to group');
            setShowAddMemberModal(false);
            setActiveGroup(null);
            qc.invalidateQueries({ queryKey: KEYS.all() });
        },
        onError: (e) => toast.error(e?.response?.data?.message ?? 'Failed to link SKU'),
    });

    const removeMemberMutation = useMutation({
        mutationFn: apiRemoveMember,
        onSuccess:  (data) => {
            toast.success(data.message ?? 'SKU removed from group');
            qc.invalidateQueries({ queryKey: KEYS.all() });
        },
        onError: (e) => toast.error(e?.response?.data?.message ?? 'Failed to remove SKU'),
    });

    const dissolveGroupMutation = useMutation({
        mutationFn: apiDissolveGroup,
        onSuccess:  (data) => {
            toast.success(data.message ?? 'Sync group dissolved');
            qc.invalidateQueries({ queryKey: KEYS.all() });
        },
        onError: (e) => toast.error(e?.response?.data?.message ?? 'Failed to dissolve group'),
    });

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Call when user clicks "+ Create Sync Group" on an UNMAPPED merchant SKU.
     * Opens the create-group modal with this SKU pre-selected as primary.
     */
    const openCreateGroupModal = useCallback((merchantSku) => {
        setTargetPrimarySkuId(merchantSku.id);
        setShowCreateGroupModal(true);
    }, []);

    /**
     * Call when user clicks "+ Add to Sync Group" on an already-MAPPED merchant SKU.
     * Finds the existing group for this SKU (or the SKU itself as primary).
     */
    const openAddMemberModal = useCallback((merchantSku, existingGroup) => {
        setActiveGroup(existingGroup ?? { primarySku: merchantSku });
        setShowAddMemberModal(true);
    }, []);

    /**
     * For a given merchantSku, find its sync group if any.
     */
    const getGroupForSku = useCallback((skuId) => {
        return groups.find(
            (g) =>
                g.primarySku?.id === skuId ||
                g.members?.some((m) => m.memberSku?.id === skuId)
        ) ?? null;
    }, [groups]);

    const confirmCreateGroup = useCallback((primarySkuId, name) => {
        createGroupMutation.mutate({ primarySkuId, name });
    }, [createGroupMutation]);

    const confirmAddMember = useCallback((groupId, secondarySkuId) => {
        addMemberMutation.mutate({ groupId, secondarySkuId });
    }, [addMemberMutation]);

    return {
        // Data
        groups,
        groupsLoading,
        eligibleSecondaries,
        eligibleLoading,

        // Modal state
        showCreateGroupModal, setShowCreateGroupModal,
        showAddMemberModal,   setShowAddMemberModal,
        activeGroup,
        targetPrimarySkuId,

        // Helpers
        getGroupForSku,
        openCreateGroupModal,
        openAddMemberModal,

        // Actions
        confirmCreateGroup,
        creatingGroup: createGroupMutation.isPending,

        confirmAddMember,
        addingMember: addMemberMutation.isPending,

        removeMember: ({ groupId, memberSkuId }) => removeMemberMutation.mutate({ groupId, memberSkuId }),
        removingMember: removeMemberMutation.isPending,

        dissolveGroup: (groupId) => dissolveGroupMutation.mutate(groupId),
        dissolvingGroup: dissolveGroupMutation.isPending,
    };
}