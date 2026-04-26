import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { INBOUND_KEYS } from './useInboundList';
import api from '../../../../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
const fetchInboundDetail = (id) =>
    api.get(`/inbound/${id}`).then((r) => r.data);

const receiveInbound = ({ id, body }) =>
    api.put(`/inbound/${id}/receive`, body).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
// Hook — manages the Receive modal (for OnTheWay → Completed action)
// Fetches the inbound detail to get all lines, then lets the user
// input qty_received per line, then submits.
// ─────────────────────────────────────────────────────────────────────────────
export function useReceiveInbound() {
    const queryClient = useQueryClient();

    const [receiveTarget, setReceiveTarget] = useState(null);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [receivedQtys, setReceivedQtys] = useState({});  // lineId → qtyReceived
    const [receiveNotes, setReceiveNotes] = useState('');

    // Fetch the detail when the modal opens so we have all lines
    const { data: inboundDetail, isLoading: detailLoading } = useQuery({
        queryKey: INBOUND_KEYS.detail(receiveTarget?.id),
        queryFn: () => fetchInboundDetail(receiveTarget.id),
        enabled: !!receiveTarget?.id,
        staleTime: 0,  // always fresh when opening receive modal
    });

    const lines = inboundDetail?.lines ?? [];

    const openReceiveModal = useCallback((item) => {
        setReceiveTarget(item);
        setReceivedQtys({});
        setReceiveNotes('');
        setShowReceiveModal(true);
    }, []);

    const handleReceivedQtyChange = useCallback((lineId, val) => {
        setReceivedQtys((prev) => ({ ...prev, [lineId]: Math.max(0, Number(val) || 0) }));
    }, []);

    // Auto-fill all lines with their expected qty
    const fillAllExpected = useCallback(() => {
        const filled = {};
        lines.forEach((l) => { filled[l.id] = l.qty_expected; });
        setReceivedQtys(filled);
    }, [lines]);

    const receiveMutation = useMutation({
        mutationFn: receiveInbound,
        onSuccess: (data) => {
            toast.success(`Inbound ${data.inbound_id} received — stock updated`);
            queryClient.invalidateQueries({ queryKey: INBOUND_KEYS.all() });
            setShowReceiveModal(false);
            setReceiveTarget(null);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? 'Failed to receive inbound');
        },
    });

    const confirmReceive = useCallback(() => {
        if (!receiveTarget) return;
        if (!lines.length) {
            toast.error('No lines found for this inbound order');
            return;
        }

        // Build lines payload: use entered qty or 0 for missing
        const linePayload = lines.map((l) => ({
            lineId: l.id,
            qtyReceived: receivedQtys[l.id] ?? 0,
            discrepancyNotes: receivedQtys[l.id] !== l.qty_expected ? 'Discrepancy noted' : undefined,
        }));

        receiveMutation.mutate({
            id: receiveTarget.id,
            body: {
                lines: linePayload,
                notes: receiveNotes || undefined,
            },
        });
    }, [receiveTarget, lines, receivedQtys, receiveNotes, receiveMutation]);

    return {
        receiveTarget,
        showReceiveModal, setShowReceiveModal,
        openReceiveModal,
        lines,
        detailLoading,
        receivedQtys,
        receiveNotes, setReceiveNotes,
        handleReceivedQtyChange,
        fillAllExpected,
        confirmReceive,
        receiving: receiveMutation.isPending,
    };
}
