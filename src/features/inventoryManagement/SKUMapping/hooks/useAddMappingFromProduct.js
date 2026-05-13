import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../../../lib/api';

// POST /api/v1/platform-products/map-merchant-sku
// Body: { platformProductId, merchantSkuId }
const apiMapMerchantSku = (body) =>
    api.post('/platform-products/map-merchant-sku', body).then((r) => r.data);

export function useAddMappingFromProduct() {
    const qc = useQueryClient();
    const [showModal,     setShowModal]     = useState(false);
    const [targetProduct, setTargetProduct] = useState(null);

    const mutation = useMutation({
        mutationFn: apiMapMerchantSku,
        onSuccess: (data) => {
            toast.success(data.message ?? 'Mapping created');
            setShowModal(false);
            setTargetProduct(null);
            qc.invalidateQueries({ queryKey: ['platform-products'] });
            qc.invalidateQueries({ queryKey: ['by-product'] });
            qc.invalidateQueries({ queryKey: ['by-merchant'] });
        },
        onError: (e) => toast.error(e?.response?.data?.message ?? 'Failed to create mapping'),
    });

    const openModal = useCallback((product) => {
        const hasCurrentMapping = !!product?.merchant_sku?.id || !!product?.is_mapped;
        const hasGeneratedSku = !!product?.generated_merchant_sku?.id;

        if (!hasCurrentMapping && !hasGeneratedSku) {
            toast.error('First generate Merchant SKU for this platform SKU');
            return;
        }

        setTargetProduct(product);
        setShowModal(true);
    }, []);

    const confirmMapping = useCallback((merchantSkuId) => {
        if (!targetProduct || !merchantSkuId) return;
        mutation.mutate({ platformProductId: targetProduct.id, merchantSkuId: parseInt(merchantSkuId, 10) });
    }, [targetProduct, mutation]);

    return {
        showModal, setShowModal,
        targetProduct,
        openModal,
        confirmMapping,
        confirming: mutation.isPending,
    };
}