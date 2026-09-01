import { ArrowLeft, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import Topbar from "@/components/layout/Topbar";
import api from "@/lib/api";
import {
  formatUsdAmount,
  readPricingCheckout,
  readPricingPaymentResult,
  savePricingPaymentResult,
} from "./pricingCheckoutStorage";

const COMPLETE_CHECKOUT_ENDPOINT = "/subscription/checkout/complete";

function getGeneratedCouponCodes(paymentResult) {
  const couponCodes = Array.isArray(paymentResult?.couponCodes) ? paymentResult.couponCodes : [];
  const codes = couponCodes
    .filter((coupon) => !coupon?.status || coupon.status === "active")
    .map((coupon) => coupon?.code || coupon?.couponCode || coupon)
    .map((code) => String(code || "").trim())
    .filter(Boolean);
  if (!codes.length && paymentResult?.couponCode) return [paymentResult.couponCode];
  return codes;
}

function normalizePaymentResult(responseData) {
  const checkoutPayload = readPricingCheckout() || {};
  return {
    ...checkoutPayload,
    paymentId: responseData?.paymentId || responseData?.id || "",
    couponCode: responseData?.couponCode || "",
    couponCodes: Array.isArray(responseData?.couponCodes) ? responseData.couponCodes : [],
    redeemedCouponCode: responseData?.redeemedCouponCode || checkoutPayload?.couponCode || "",
    giftCreated: Boolean(responseData?.giftCreated),
    paidAt: responseData?.paidAt || new Date().toISOString(),
    provider: responseData?.paymentProvider || "Stripe",
    planName: checkoutPayload?.planName || responseData?.planName || responseData?.plan?.name || "",
    period: checkoutPayload?.period || responseData?.period || "",
    storeCount: responseData?.storeCount || checkoutPayload?.storeCount || checkoutPayload?.stores?.length || 0,
    totalAmount: responseData?.amount || checkoutPayload?.totalAmount || 0,
    currency: responseData?.currency || checkoutPayload?.currency || "USD",
  };
}

export default function PricingPaymentSuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const hasVerifiedSession = useRef(false);
  const initialPaymentResult = location.state?.paymentResult || (!sessionId ? readPricingPaymentResult() : null);
  const [paymentResult, setPaymentResult] = useState(initialPaymentResult);
  const [isConfirming, setIsConfirming] = useState(Boolean(sessionId && !initialPaymentResult));
  const [confirmError, setConfirmError] = useState("");
  const generatedReferralCodes = useMemo(
    () => getGeneratedCouponCodes(paymentResult),
    [paymentResult],
  );

  useEffect(() => {
    if (!sessionId || hasVerifiedSession.current) return;
    hasVerifiedSession.current = true;

    const confirmPayment = async () => {
      setIsConfirming(true);
      setConfirmError("");
      try {
        const response = await api.post(COMPLETE_CHECKOUT_ENDPOINT, { sessionId });
        const responseData = response?.data || response;
        const result = normalizePaymentResult(responseData);
        savePricingPaymentResult(result);
        setPaymentResult(result);
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          t("success.paymentCouldNotBeConfirmed");
        setConfirmError(message);
        toast.error(message);
        console.error("Stripe payment confirmation failed:", error);
      } finally {
        setIsConfirming(false);
      }
    };

    confirmPayment();
  }, [sessionId, t]);

  if (isConfirming) {
    return (
      <main className="min-h-screen bg-[#f3f5f7] px-6 py-5 lg:px-[86px]">
        <Topbar PageTitle="Payment Success" showBack onBack={() => navigate("/warehouse_management/pricing")} />
        <section className="mx-auto mt-20 w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm">
          <Loader2 size={36} className="mx-auto animate-spin text-[#004368]" />
          <h1 className="mt-6 text-2xl font-bold text-[#111827]">{t("success.confirmingPayment")}</h1>
          <p className="mt-3 text-sm leading-6 text-[#64748b]">
            {t("success.confirmPaymentMessage")}
          </p>
        </section>
      </main>
    );
  }

  if (!paymentResult || confirmError) {
    return (
      <main className="min-h-screen bg-[#f3f5f7] px-6 py-5 lg:px-[86px]">
        <Topbar
          PageTitle="Payment Success"
          showBack
          onBack={() => navigate("/warehouse_management/pricing")}
        />
        <section className="mx-auto mt-20 w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#111827]">
            {confirmError ? t("success.paymentCouldNotBeConfirmed") : t("success.noPaymentResultFound")}
          </h1>
          <p className="mt-3 text-sm text-[#64748b]">
            {confirmError || t("success.completeStripeFirst")}
          </p>
          <button
            type="button"
            onClick={() => navigate("/warehouse_management/pricing")}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#004368] px-5 text-sm font-semibold text-white"
          >
            {t("success.backToPricing")}
          </button>
        </section>
      </main>
    );
  }

  const couponCodes = generatedReferralCodes.map((code) => ({ code }));

  const copyCouponValue = async (code) => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    toast.success(t("success.couponCodeCopied"));
  };

  return (
    <main className="min-h-screen bg-[#f3f5f7] px-6 py-5 lg:px-[86px]">
      <Topbar
        PageTitle="Payment Success"
        showBack
        onBack={() => navigate("/warehouse_management/pricing")}
        giftReferralControllerProps={{
          autoOpenReferral: generatedReferralCodes.length > 0,
          initialReferralCodes: generatedReferralCodes,
        }}
      />
      <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-[760px] items-center py-8">
        <div className="w-full rounded-lg bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f4ed]">
            <CheckCircle2 size={36} className="text-[#168a4a]" />
          </div>
          <h1 className="mt-6 text-[30px] font-bold text-[#111827]">
            {t("success.paymentSuccessful")}
          </h1>
          <p className="mx-auto mt-3 max-w-[520px] text-sm leading-6 text-[#64748b]">
            {t("success.selectedPlanSubmitted")} {t("success.backendResponseStored")}
          </p>

          <div className="mt-8 grid gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-5 text-left">
            <ResultRow label={t("success.paymentId")} value={paymentResult.paymentId} />
            <ResultRow label={t("success.plan")} value={paymentResult.planName} />
            <ResultRow label={t("success.period")} value={paymentResult.period} />
            <ResultRow label={t("success.storeCount")} value={paymentResult.storeCount} />
            <ResultRow label={t("success.amount")} value={formatUsdAmount(paymentResult.totalAmount, paymentResult.currency)} />
            <ResultRow label={t("success.provider")} value={paymentResult.provider} />
            {paymentResult.redeemedCouponCode ? (
              <ResultRow label={t("success.redeemedCoupon")} value={paymentResult.redeemedCouponCode} />
            ) : null}
            {paymentResult.giftCreated ? (
              <ResultRow label={t("success.giftReward")} value={t("success.giftRewardCreated")} />
            ) : null}
          </div>

          {couponCodes.length ? (
            <div className="mt-5 rounded-lg border border-[#c9dbe6] bg-[#eef7fb] p-5">
              <p className="text-sm font-semibold text-[#004368]">
                {couponCodes.length === 1
                  ? t("success.generatedReferralCode")
                  : t("success.generatedReferralCodes")}
              </p>
              <div className="mt-3 grid gap-2">
                {couponCodes.map((coupon, index) => (
                  <button
                    key={`${coupon.code || coupon.couponCode}-${index}`}
                    type="button"
                    onClick={() => copyCouponValue(coupon.code || coupon.couponCode)}
                    className="mx-auto inline-flex min-h-11 w-full max-w-sm items-center justify-between gap-3 rounded-md bg-white px-4 py-2 text-left shadow-sm"
                  >
                    <span className="text-lg font-bold tracking-[0.16em] text-[#004368]">
                      {coupon.code || coupon.couponCode}
                    </span>
                    <Copy size={18} className="shrink-0 text-[#004368]" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-[#fde7c7] bg-[#fff8ed] p-5 text-sm font-medium text-[#9a5b00]">
              {t("success.couponNotReturned")}
            </div>
          )}

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/warehouse_management/pricing")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#004368] px-5 text-sm font-semibold text-[#004368]"
            >
              <ArrowLeft size={17} />
              {t("success.backToPricing")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/warehouse_management")}
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#004368] px-5 text-sm font-semibold text-white"
            >
              {t("success.goToDashboard")}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResultRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-5 text-sm">
      <span className="font-semibold text-[#64748b]">{label}</span>
      <span className="text-right font-bold text-[#111827]">{value || "-"}</span>
    </div>
  );
}
