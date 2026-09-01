import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

const DAY_MS = 24 * 60 * 60 * 1000;

const getStoreRows = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.stores)) return response.data.stores;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.rows)) return response.data.rows;
  if (Array.isArray(response?.stores)) return response.stores;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.rows)) return response.rows;
  return [];
};

const toNumberOrNull = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const getDaysUntil = (value) => {
  if (!value) return null;
  const expiryTime = new Date(value).getTime();
  if (!Number.isFinite(expiryTime)) return null;
  return Math.ceil((expiryTime - Date.now()) / DAY_MS);
};

const getSubscriptionSnapshot = (store = {}) => {
  const subscription = store.subscription || {};
  return {
    status: subscription.status ?? store.subscriptionStatus ?? store.subscription_status,
    remainingDays:
      subscription.remainingDays ??
      subscription.remaining_days ??
      store.remainingDays ??
      store.remaining_days,
    expiresAt: subscription.expiresAt ?? subscription.expires_at ?? store.expiresAt ?? store.expires_at,
  };
};

const hasUsableSubscription = (store) => {
  const subscription = getSubscriptionSnapshot(store);
  const hasSubscriptionInfo =
    subscription.status !== undefined ||
    subscription.remainingDays !== undefined ||
    subscription.expiresAt !== undefined;

  if (!hasSubscriptionInfo) return false;

  const status = String(subscription.status || "").toLowerCase();
  const remainingDays =
    toNumberOrNull(subscription.remainingDays) ?? getDaysUntil(subscription.expiresAt);

  return status !== "expired" && Number(remainingDays) > 0;
};

export default function useCompanyPlanAccessGuard() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkAccess = useCallback(async () => {
    const response = await api.get("/platform-stores", { params: { page: 1, limit: 1000 } });
    return getStoreRows(response).some(hasUsableSubscription);
  }, []);

  const requireCompanyPlan = useCallback(
    async (onAllowed) => {
      if (checking) return false;

      setChecking(true);
      setHasError(false);

      try {
        const allowed = await checkAccess();
        if (allowed) {
          onAllowed?.();
          return true;
        }

        setModalOpen(true);
        return false;
      } catch {
        setHasError(true);
        setModalOpen(true);
        return false;
      } finally {
        setChecking(false);
      }
    },
    [checkAccess, checking],
  );

  const modalProps = useMemo(
    () => ({
      open: modalOpen,
      hasError,
      onCancel: () => setModalOpen(false),
      onConfirm: () => {
        setModalOpen(false);
        navigate("/warehouse_management/pricing");
      },
    }),
    [hasError, modalOpen, navigate],
  );

  return {
    checkingCompanyPlan: checking,
    requireCompanyPlan,
    companyPlanModalProps: modalProps,
  };
}
