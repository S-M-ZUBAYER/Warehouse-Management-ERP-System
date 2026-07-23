import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { OUTBOUND_KEYS } from './useOutboundList';
import api from '../../../../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
const shipOutbound = ({ id, body }) =>
    api.put(`/outbound/${id}/ship`, body).then((r) => r.data);

const shipOutboundTargets = async ({ targets, body }) => {
    const rows = Array.isArray(targets) ? targets : [targets];
    const results = await Promise.all(rows.map((row) => shipOutbound({ id: row.id, body })));
    return { results, count: rows.length };
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook — manages the Ship modal form and mutation
// Used by OutboundDraftPage (ship action from 3-dot menu or Ship button)
// ─────────────────────────────────────────────────────────────────────────────
export function useShipOutbound({ onSuccess } = {}) {
    const queryClient = useQueryClient();

    const [shipTarget, setShipTarget] = useState(null);
    const [showShipModal, setShowShipModal] = useState(false);
    const [showShipConfirmModal, setShowShipConfirmModal] = useState(false);
    const [shipForm, setShipForm] = useState({
        trackingNumber: '',
        purchaseCurrency: 'USD',
        estimatedArrival: '',
        exchangeRate: '',
        shippingCost: '',
        notes: '',
    });
    const [shipErrors, setShipErrors] = useState({});

    const openShipModal = useCallback((itemOrItems) => {
        setShipTarget(itemOrItems);
        setShipForm({
            trackingNumber: '',
            purchaseCurrency: 'USD',
            estimatedArrival: '',
            exchangeRate: '',
            shippingCost: '',
            notes: '',
        });
        setShipErrors({});
        setShowShipModal(true);
        setShowShipConfirmModal(false);
    }, []);

    const handleShipFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setShipForm((p) => ({ ...p, [name]: value }));
        if (shipErrors[name]) setShipErrors((p) => ({ ...p, [name]: '' }));
    }, [shipErrors]);

    const validateShip = useCallback(() => {
        const e = {};
        if (!shipForm.trackingNumber.trim()) e.trackingNumber = 'Tracking number is required';
        if (!shipForm.purchaseCurrency.trim()) e.purchaseCurrency = 'Currency is required';
        if (!shipForm.estimatedArrival) e.estimatedArrival = 'Estimated arrival date is required';
        return e;
    }, [shipForm]);

    const shipMutation = useMutation({
        mutationFn: shipOutboundTargets,
        onSuccess: ({ results = [], count = 0 }) => {
            if (count > 1) {
                toast.success(`${count} outbound orders are now On The Way`);
            } else {
                toast.success(`Outbound ${results[0]?.outbound_id ?? ''} is now On The Way`);
            }
            queryClient.invalidateQueries({ queryKey: OUTBOUND_KEYS.all() });
            setShowShipModal(false);
            setShowShipConfirmModal(false);
            setShipTarget(null);
            onSuccess?.();
        },
        onError: (err) => {
            const msg = err?.response?.data?.message ?? 'Failed to ship outbound';
            const fieldErrors = err?.response?.data?.errors ?? [];
            if (fieldErrors.length) {
                const mapped = {};
                fieldErrors.forEach(({ field, message }) => { mapped[field] = message; });
                setShipErrors(mapped);
            }
            toast.error(msg);
        },
    });

    const requestShipConfirmation = useCallback(() => {
        const e = validateShip();
        if (Object.keys(e).length) { setShipErrors(e); return; }
        const targets = Array.isArray(shipTarget) ? shipTarget : [shipTarget].filter(Boolean);
        if (targets.length === 0) {
            toast.error('Please select at least one outbound order');
            return;
        }
        setShowShipConfirmModal(true);
    }, [shipTarget, validateShip]);

    const confirmShip = useCallback(() => {
        const targets = Array.isArray(shipTarget) ? shipTarget : [shipTarget].filter(Boolean);
        shipMutation.mutate({
            targets,
            body: {
                trackingNumber: shipForm.trackingNumber.trim(),
                purchaseCurrency: shipForm.purchaseCurrency.trim(),
                estimatedArrival: shipForm.estimatedArrival,
                exchangeRate: shipForm.exchangeRate ? Number(shipForm.exchangeRate) : undefined,
                shippingCost: shipForm.shippingCost ? Number(shipForm.shippingCost) : undefined,
                notes: shipForm.notes || undefined,
            },
        });
    }, [shipTarget, shipForm, shipMutation]);

    return {
        shipTarget,
        showShipModal, setShowShipModal,
        showShipConfirmModal, setShowShipConfirmModal,
        openShipModal,
        shipForm,
        shipErrors,
        handleShipFormChange,
        requestShipConfirmation,
        confirmShip,
        shipping: shipMutation.isPending,
    };
}
