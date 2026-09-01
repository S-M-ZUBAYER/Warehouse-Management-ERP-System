import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CreditCard, LockKeyhole, Store } from "lucide-react";
import api from "../../../../lib/api";

const DAY_MS = 24 * 60 * 60 * 1000;

const getStoreRows = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data?.data)) return response.data.data;
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
    remainingDays: subscription.remainingDays ?? subscription.remaining_days ?? store.remainingDays ?? store.remaining_days,
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

function BlockingModal({ hasError, onPricing, onStoreAuthorization }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-order-access-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LockKeyhole size={28} />
        </div>

        <h2 id="manual-order-access-title" className="mt-5 text-lg font-bold text-slate-900">
          {t("subscription.manualOrderAccessTitle", { defaultValue: "Purchase Plan Required" })}
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {hasError
            ? t("subscription.manualOrderAccessVerifyError", {
                defaultValue:
                  "We could not verify this company's store plan. Please refresh the page or purchase any plan for any store before using Manual Order and Platform Manual Order.",
              })
            : t("subscription.manualOrderAccessMessage", {
                defaultValue:
                  "Manual Order and Platform Manual Order are available only when this company has at least one store with active plan days or free trial days. Please purchase any plan for any store first, then you can use these pages.",
              })}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onStoreAuthorization}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-surface-border bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-card"
          >
            <Store size={16} />
            {t("subscription.manualOrderAccessStores", { defaultValue: "Stores" })}
          </button>
          <button
            type="button"
            onClick={onPricing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <CreditCard size={16} />
            {t("subscription.manualOrderAccessPurchasePlan", { defaultValue: "Purchase Plan" })}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManualOrderSubscriptionGate({ children }) {
  const navigate = useNavigate();
  const [accessState, setAccessState] = useState({
    loading: true,
    allowed: false,
    hasError: false,
  });

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      setAccessState({ loading: true, allowed: false, hasError: false });
      try {
        const response = await api.get("/platform-stores", { params: { page: 1, limit: 1000 } });
        const stores = getStoreRows(response);
        const allowed = stores.some(hasUsableSubscription);
        if (active) setAccessState({ loading: false, allowed, hasError: false });
      } catch {
        if (active) setAccessState({ loading: false, allowed: false, hasError: true });
      }
    };

    checkAccess();

    return () => {
      active = false;
    };
  }, []);

  const modalProps = useMemo(
    () => ({
      hasError: accessState.hasError,
      onPricing: () => navigate("/warehouse_management/pricing"),
      onStoreAuthorization: () => navigate("/warehouse_management/config/store_authorization"),
    }),
    [accessState.hasError, navigate],
  );

  return (
    <>
      {children}
      {!accessState.loading && !accessState.allowed && <BlockingModal {...modalProps} />}
    </>
  );
}
