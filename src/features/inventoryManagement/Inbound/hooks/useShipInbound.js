import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { INBOUND_KEYS } from './useInboundList';
import api from '../../../../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
const shipInbound = ({ id, body }) =>
    api.put(`/inbound/${id}/ship`, body).then((r) => r.data);

// ─────────────────────────────────────────────────────────────────────────────
// Hook — manages the Ship modal form and mutation
// Used by InboundDraftPage (ship action from 3-dot menu or Ship button)
// ─────────────────────────────────────────────────────────────────────────────
export function useShipInbound() {
    const queryClient = useQueryClient();

    const [shipTarget, setShipTarget] = useState(null);
    const [showShipModal, setShowShipModal] = useState(false);
    const [shipForm, setShipForm] = useState({
        trackingNumber: '',
        purchaseCurrency: 'USD',
        estimatedArrival: '',
        exchangeRate: '',
        shippingCost: '',
        notes: '',
    });
    const [shipErrors, setShipErrors] = useState({});

    const openShipModal = useCallback((item) => {
        setShipTarget(item);
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
        mutationFn: shipInbound,
        onSuccess: (data) => {
            toast.success(`Inbound ${data.inbound_id} is now On The Way`);
            queryClient.invalidateQueries({ queryKey: INBOUND_KEYS.all() });
            setShowShipModal(false);
            setShipTarget(null);
        },
        onError: (err) => {
            const msg = err?.response?.data?.message ?? 'Failed to ship inbound';
            const fieldErrors = err?.response?.data?.errors ?? [];
            if (fieldErrors.length) {
                const mapped = {};
                fieldErrors.forEach(({ field, message }) => { mapped[field] = message; });
                setShipErrors(mapped);
            }
            toast.error(msg);
        },
    });

    const confirmShip = useCallback(() => {
        const e = validateShip();
        if (Object.keys(e).length) { setShipErrors(e); return; }
        shipMutation.mutate({
            id: shipTarget.id,
            body: {
                trackingNumber: shipForm.trackingNumber.trim(),
                purchaseCurrency: shipForm.purchaseCurrency.trim(),
                estimatedArrival: shipForm.estimatedArrival,
                exchangeRate: shipForm.exchangeRate ? Number(shipForm.exchangeRate) : undefined,
                shippingCost: shipForm.shippingCost ? Number(shipForm.shippingCost) : undefined,
                notes: shipForm.notes || undefined,
            },
        });
    }, [shipTarget, shipForm, validateShip, shipMutation]);

    return {
        shipTarget,
        showShipModal, setShowShipModal,
        openShipModal,
        shipForm,
        shipErrors,
        handleShipFormChange,
        confirmShip,
        shipping: shipMutation.isPending,
    };
}
