import { useState, useCallback } from 'react';
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { INBOUND_KEYS } from './useInboundList';
import api from '../../../../lib/api';

const fetchInboundDetail = (id) =>
    api.get(`/inbound/${id}`).then((r) => r.data);

const receiveInbound = ({ id, body }) =>
    api.put(`/inbound/${id}/receive`, body).then((r) => r.data);

const receiveInboundTargets = async ({ target, body }) => {
    const rows = Array.isArray(target) ? target : [target];

    if (rows.length > 1) {
        const details = Array.isArray(body?.details) ? body.details : [];
        const results = await Promise.all(rows.map(async (row) => {
            const detail = details.find((item) => String(item?.id) === String(row.id)) ?? await fetchInboundDetail(row.id);
            const lines = detail?.lines ?? [];

            if (!lines.length) {
                throw new Error(`No lines found for ${row.inbound_id ?? row.id}`);
            }

            return receiveInbound({
                id: row.id,
                body: {
                    lines: lines.map((line) => ({
                        lineId: line.id,
                        qtyReceived: body?.receivedQtys?.[line.id] ?? line.qty_expected,
                        discrepancyNotes:
                            (body?.receivedQtys?.[line.id] ?? line.qty_expected) !== line.qty_expected
                                ? 'Discrepancy noted'
                                : undefined,
                    })),
                    notes: body?.notes || undefined,
                },
            });
        }));

        return { results, count: rows.length };
    }

    const result = await receiveInbound({ id: rows[0].id, body });
    return { results: [result], count: 1 };
};

export function useReceiveInbound({ onSuccess } = {}) {
    const queryClient = useQueryClient();

    const [receiveTarget, setReceiveTarget] = useState(null);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [receivedQtys, setReceivedQtys] = useState({});
    const [receiveNotes, setReceiveNotes] = useState('');
    const isBulkReceive = Array.isArray(receiveTarget) && receiveTarget.length > 1;

    const { data: inboundDetail, isLoading: detailLoading } = useQuery({
        queryKey: INBOUND_KEYS.detail(receiveTarget?.id),
        queryFn: () => fetchInboundDetail(receiveTarget.id),
        enabled: !isBulkReceive && !!receiveTarget?.id,
        staleTime: 0,
    });

    const lines = inboundDetail?.lines ?? [];
    const bulkDetailQueries = useQueries({
        queries: isBulkReceive
            ? receiveTarget.map((target) => ({
                queryKey: INBOUND_KEYS.detail(target.id),
                queryFn: () => fetchInboundDetail(target.id),
                enabled: !!target?.id,
                staleTime: 0,
            }))
            : [],
    });
    const bulkDetails = isBulkReceive
        ? bulkDetailQueries.map((query, index) => query.data ?? receiveTarget[index]).filter(Boolean)
        : [];
    const bulkDetailLoading = bulkDetailQueries.some((query) => query.isLoading || query.isFetching);

    const openReceiveModal = useCallback((itemOrItems) => {
        setReceiveTarget(itemOrItems);
        setReceivedQtys({});
        setReceiveNotes('');
        setShowReceiveModal(true);
    }, []);

    const handleReceivedQtyChange = useCallback((lineId, val) => {
        setReceivedQtys((prev) => ({ ...prev, [lineId]: Math.max(0, Number(val) || 0) }));
    }, []);

    const fillAllExpected = useCallback(() => {
        const filled = {};
        const detailLines = isBulkReceive
            ? bulkDetails.flatMap((detail) => detail?.lines ?? [])
            : lines;

        detailLines.forEach((line) => {
            filled[line.id] = line.qty_expected;
        });
        setReceivedQtys(filled);
    }, [bulkDetails, isBulkReceive, lines]);

    const receiveMutation = useMutation({
        mutationFn: receiveInboundTargets,
        onSuccess: ({ results = [], count = 0 }) => {
            if (count > 1) {
                toast.success(`${count} inbound orders received - stock updated`);
            } else {
                toast.success(`Inbound ${results[0]?.inbound_id ?? ''} received - stock updated`);
            }
            queryClient.invalidateQueries({ queryKey: INBOUND_KEYS.all() });
            setShowReceiveModal(false);
            setReceiveTarget(null);
            onSuccess?.();
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to receive inbound');
        },
    });

    const confirmReceive = useCallback(() => {
        if (!receiveTarget) return;

        if (Array.isArray(receiveTarget) && receiveTarget.length > 1) {
            if (bulkDetailLoading) return;
            if (bulkDetails.some((detail) => !detail?.lines?.length)) {
                toast.error('No lines found for one or more selected inbound orders');
                return;
            }

            receiveMutation.mutate({
                target: receiveTarget,
                body: {
                    details: bulkDetails,
                    receivedQtys,
                    notes: receiveNotes || undefined,
                },
            });
            return;
        }

        if (!lines.length) {
            toast.error('No lines found for this inbound order');
            return;
        }

        const linePayload = lines.map((line) => ({
            lineId: line.id,
            qtyReceived: receivedQtys[line.id] ?? 0,
            discrepancyNotes: receivedQtys[line.id] !== line.qty_expected ? 'Discrepancy noted' : undefined,
        }));

        receiveMutation.mutate({
            target: receiveTarget,
            body: {
                lines: linePayload,
                notes: receiveNotes || undefined,
            },
        });
    }, [bulkDetailLoading, bulkDetails, receiveTarget, lines, receivedQtys, receiveNotes, receiveMutation]);

    return {
        receiveTarget,
        showReceiveModal,
        setShowReceiveModal,
        openReceiveModal,
        lines,
        detailLoading,
        bulkDetails,
        bulkDetailLoading,
        receivedQtys,
        receiveNotes,
        setReceiveNotes,
        handleReceivedQtyChange,
        fillAllExpected,
        confirmReceive,
        receiving: receiveMutation.isPending,
    };
}
