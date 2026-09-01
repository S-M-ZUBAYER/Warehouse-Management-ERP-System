import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Topbar from "@/components/layout/Topbar";
import paymentIllustration from "@/assets/paymentIllustration.svg";
import api from "@/lib/api";
import {
  formatUsdAmount,
  readPricingCheckout,
  savePricingCheckout,
} from "./pricingCheckoutStorage";

const CHECKOUT_ENDPOINT = "/subscription/checkout";

function readUserEmail() {
  try {
    const user = JSON.parse(localStorage.getItem("warehouseUser") || "{}");
    return user?.email || user?.user?.email || "";
  } catch {
    return "";
  }
}

function getCheckoutUrl(response) {
  return (
    response?.checkoutUrl ||
    response?.url ||
    response?.data?.checkoutUrl ||
    response?.data?.url ||
    ""
  );
}

export default function PricingCheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const checkoutPayload = location.state?.checkoutPayload || readPricingCheckout();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode] = useState(checkoutPayload?.couponCode || "");
  const hasLockedReferralCoupon = Boolean(checkoutPayload?.referralCouponLocked && checkoutPayload?.couponCode);

  const email = useMemo(() => readUserEmail(), []);
  const storesText = checkoutPayload?.stores?.length
    ? checkoutPayload.stores
        .map((store) => store?.label || store?.storeName || store)
        .join(", ")
    : t("checkout.noStoreSelected");
  const platformsText = checkoutPayload?.platform?.length
    ? checkoutPayload.platform.join(", ")
    : t("checkout.noPlatformSelected");

  useEffect(() => {
    if (searchParams.get("stripe_cancelled") !== "1") return;
    toast.error(t("checkout.paymentCancelled"));
    searchParams.delete("stripe_cancelled");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, t]);

  const handleStripePayment = async () => {
    if (!checkoutPayload) return;

    const submissionCouponCode = hasLockedReferralCoupon ? couponCode.trim() : "";
    setIsSubmitting(true);
    try {
      const response = await api.post(CHECKOUT_ENDPOINT, {
        ...checkoutPayload,
        couponCode: submissionCouponCode || undefined,
      });
      const responseData = response?.data || response;
      const checkoutUrl = getCheckoutUrl(responseData);

      if (!checkoutUrl) {
        throw new Error(t("checkout.missingStripeRedirect"));
      }

      savePricingCheckout({
        ...checkoutPayload,
        couponCode: submissionCouponCode || "",
        stripeSessionId: responseData?.sessionId || "",
      });
      window.location.assign(checkoutUrl);
    } catch (error) {
      if (error?.response?.status === 404) {
        toast.error(t("checkout.checkoutUnavailable"));
      } else if (error?.response?.status === 403) {
        toast.error(error?.response?.data?.message || t("checkout.ownerOnly"));
      } else {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            t("checkout.unableStartStripe"),
        );
      }
      console.error("Stripe checkout failed:", error);
      setIsSubmitting(false);
    }
  };

  if (!checkoutPayload) {
    return (
      <main className="min-h-screen bg-[#f3f5f7] px-6 py-5 lg:px-[86px]">
        <Topbar
          PageTitle="Checkout"
          showBack
          onBack={() => navigate("/warehouse_management/pricing")}
        />
        <section className="mx-auto mt-20 w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#111827]">{t("checkout.noCheckoutSelected")}</h1>
          <p className="mt-3 text-sm text-[#64748b]">
            {t("checkout.selectPlanBeforePayment")}
          </p>
          <button
            type="button"
            onClick={() => navigate("/warehouse_management/pricing")}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#004368] px-5 text-sm font-semibold text-white"
          >
            {t("checkout.backToPricing")}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f5f7] px-6 py-5 lg:px-[86px]">
      <Topbar
        PageTitle="Stripe Payment"
        showBack
        onBack={() => navigate("/warehouse_management/pricing")}
      />
      <section className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-10 py-8 lg:grid-cols-[460px_1fr]">
        <div className="w-full">
          <label className="mb-4 block">
            <span className="text-sm font-semibold text-[#111827]">
              {t("checkout.email")} <span className="text-red-500">*</span>
            </span>
            <input
              type="email"
              value={email}
              readOnly
              placeholder="name@example.com"
              className="mt-1 h-[42px] w-full rounded border border-[#d9dee7] bg-white px-3 text-[17px] text-[#111827] outline-none"
            />
          </label>

          <section className="rounded-md bg-white px-6 py-5 shadow-sm">
            <div className="mb-6 flex items-center gap-7">
              <CreditCard size={18} className="text-[#004b70]" />
              <span className="text-sm font-bold text-[#004b70]">{t("checkout.secureStripePayment")}</span>
            </div>

            <div className="rounded-md border border-[#dde7ee] bg-[#f8fafc] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck size={22} className="mt-0.5 shrink-0 text-[#004368]" />
                <div>
                  <p className="text-sm font-bold text-[#111827]">{t("checkout.stripeHostedCheckout")}</p>
                  <p className="mt-2 text-sm leading-6 text-[#64748b]">
                    {t("checkout.secureStripeDescription")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase text-[#64748b]">
                {t("checkout.acceptedCards")}
              </span>
              <span className="flex gap-1">
                <span className="rounded bg-[#005da8] px-1.5 py-0.5 text-[10px] font-bold text-white">VISA</span>
                <span className="rounded bg-[#111827] px-1.5 py-0.5 text-[10px] font-bold text-white">MC</span>
                <span className="rounded bg-[#008fc7] px-1.5 py-0.5 text-[10px] font-bold text-white">AMEX</span>
              </span>
            </div>
          </section>

          <section className="mt-4 rounded-md border border-[#dde7ee] bg-white px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#111827]">{checkoutPayload.planName}</p>
                <p className="mt-1 text-xs text-[#64748b]">
                  {platformsText} - {storesText}
                </p>
              </div>
              <p className="shrink-0 text-lg font-bold text-[#004368]">
                {formatUsdAmount(checkoutPayload.totalAmount, checkoutPayload.currency)}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#64748b]">
              <ShieldCheck size={15} className="text-[#004368]" />
              {t("checkout.backendValidates")}
            </div>
          </section>

          {hasLockedReferralCoupon ? (
            <label className="mt-4 block rounded-md border border-[#dde7ee] bg-white px-5 py-4">
              <span className="text-sm font-bold text-[#111827]">{t("checkout.referralCoupon")}</span>
              <input
                value={couponCode}
                readOnly
                className="mt-2 h-10 w-full cursor-not-allowed rounded border border-[#d9dee7] bg-[#f8fafc] px-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#004368] outline-none"
              />
            </label>
          ) : null}

          <button
            type="button"
            onClick={handleStripePayment}
            disabled={isSubmitting}
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded bg-[#004368] px-4 text-base font-bold text-white transition-colors hover:bg-[#00324d] disabled:cursor-not-allowed disabled:bg-[#86a3b4]"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                {t("checkout.redirectingToStripe")}
              </span>
            ) : (
              t("checkout.payWithStripe", {
                amount: formatUsdAmount(checkoutPayload.totalAmount, checkoutPayload.currency),
              })
            )}
          </button>
        </div>

        <div className="hidden justify-center lg:flex">
          <img
            src={paymentIllustration}
            alt="Payment illustration"
            className="w-full max-w-[760px]"
          />
        </div>

        <div className="flex justify-center lg:hidden">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#004368] shadow-sm">
            <CheckCircle2 size={17} />
            {t("checkout.stripeCheckoutReady")}
          </div>
        </div>
      </section>
    </main>
  );
}
