import { Copy, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import api from "@/lib/api";
import giftReceivedImage from "@/assets/Gift/GiftReceived.svg";
import openGiftImage from "@/assets/Gift/OpenGift.svg";
import shareReferralImage from "@/assets/Gift/ShareRefferalCode.svg";

const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  zipCode: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

function getCouponCodes(payload) {
  const coupons = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  return coupons
    .filter((item) => !item?.status || item.status === "active")
    .map((item) => item?.code || item?.couponCode || item)
    .map((code) => String(code || "").trim())
    .filter(Boolean);
}

function uniqueCodes(codes = []) {
  return [...new Set(getCouponCodes(codes))];
}

function getGiftStatusLabel(status, t) {
  const key = String(status || "").toLowerCase();
  const fallback = String(status || "").replace(/_/g, " ").toLowerCase();
  return t(`gift.status.${key}`, { defaultValue: fallback });
}

function getGiftCode(gift) {
  return gift?.coupon?.code || gift?.couponCode || gift?.coupon_code || `Gift #${gift?.id || "-"}`;
}

function parseAddressValue(value) {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return typeof value === "object" ? value : {};
}

function getGiftDate(gift, language = "en") {
  const value = gift?.createdAt || gift?.created_at;
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getGiftActionLabel(gift, t) {
  if (gift?.status === "PENDING_ADDRESS") return t("gift.giveAddress");
  if (gift?.status === "ADDRESS_SUBMITTED") return t("gift.viewAddress");
  if (gift?.status === "DELIVERED") return t("gift.confirmReceived");
  if (gift?.status === "RECEIVED") return t("gift.received");
  return t("gift.viewGift");
}

function getGiftAddress(gift) {
  const savedAddress = parseAddressValue(
    gift?.delivery_address ||
      gift?.deliveryAddress ||
      gift?.delivery_address_json ||
      gift?.deliveryAddressJson,
  );
  return {
    ...emptyAddress,
    ...savedAddress,
    fullName: savedAddress.fullName || savedAddress.full_name || "",
    addressLine1: savedAddress.addressLine1 || savedAddress.address_line_1 || savedAddress.address || "",
    addressLine2: savedAddress.addressLine2 || savedAddress.address_line_2 || "",
    zipCode: savedAddress.zipCode || savedAddress.postalCode || "",
    postalCode: savedAddress.postalCode || savedAddress.zipCode || "",
  };
}

export default function GiftReferralModalController({
  onGiftCountChange,
  autoOpenReferral = false,
  initialReferralCodes = [],
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [couponCodes, setCouponCodes] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [activeGift, setActiveGift] = useState(null);
  const [address, setAddress] = useState(emptyAddress);
  const [busy, setBusy] = useState(false);
  const autoOpenedRef = useRef(false);
  const initialCodes = useMemo(() => uniqueCodes(initialReferralCodes), [initialReferralCodes]);

  const close = async () => {
    if (mode === "gift") {
      const unseen = gifts.filter((gift) => !gift.modal_seen_at && !gift.modalSeenAt);
      await Promise.allSettled(unseen.map((gift) => api.patch(`/subscription/gifts/${gift.id}/seen`)));
      onGiftCountChange?.();
    }
    setMode(null);
  };

  const openReferral = async (event) => {
    const suppliedCode = event?.detail?.couponCode;
    const suppliedCodes = getCouponCodes(event?.detail?.couponCodes || []);
    const nextSuppliedCodes = suppliedCodes.length ? suppliedCodes : uniqueCodes(suppliedCode ? [suppliedCode] : []);
    setMode("referral");
    setLoading(!nextSuppliedCodes.length);
    setCouponCodes(nextSuppliedCodes);
    if (nextSuppliedCodes.length) return;

    try {
      const response = await api.get("/subscription/coupons");
      const codes = getCouponCodes(response);
      setCouponCodes(codes);
      if (!codes.length) toast.error(t("gift.noReferralCode"));
    } catch (error) {
      toast.error(error?.response?.data?.message || t("gift.unableLoadReferral"));
    } finally {
      setLoading(false);
    }
  };

  const openGift = async () => {
    setMode("gift");
    setLoading(true);
    try {
      const response = await api.get("/subscription/gifts");
      const nextGifts = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setGifts(nextGifts);
      setActiveGift(null);
      setAddress(emptyAddress);
    } catch (error) {
      toast.error(error?.response?.data?.message || t("gift.unableLoadGifts"));
    } finally {
      setLoading(false);
    }
  };

  const selectGift = async (gift) => {
    setActiveGift(gift);
    setAddress(getGiftAddress(gift));

    if (!gift?.id) return;
    try {
      const response = await api.get(`/subscription/gifts/${gift.id}`);
      const detailedGift = response?.data || response;
      const mergedGift = { ...gift, ...detailedGift };
      setActiveGift(mergedGift);
      setAddress(getGiftAddress(mergedGift));
    } catch (error) {
      toast.error(error?.response?.data?.message || t("gift.unableLoadGifts"));
    }
  };

  useEffect(() => {
    window.addEventListener("open-referral-code", openReferral);
    window.addEventListener("open-gift-notifications", openGift);
    return () => {
      window.removeEventListener("open-referral-code", openReferral);
      window.removeEventListener("open-gift-notifications", openGift);
    };
  }, []);

  useEffect(() => {
    if (!autoOpenReferral || autoOpenedRef.current || !initialCodes.length) return;
    autoOpenedRef.current = true;
    setCouponCodes(initialCodes);
    setLoading(false);
    setMode("referral");
  }, [autoOpenReferral, initialCodes]);

  const copyCode = async (code) => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    toast.success(t("gift.referralCopied", { code }));
  };

  const submitAddress = async () => {
    if (!activeGift?.id) return;
    setBusy(true);
    try {
      await api.put(`/subscription/gifts/${activeGift.id}/address`, {
        address: {
          ...address,
          postalCode: address.zipCode || address.postalCode || "",
        },
      });
      toast.success(t("gift.addressSubmitted"));
      await openGift();
      onGiftCountChange?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || t("gift.unableSubmitAddress"));
    } finally {
      setBusy(false);
    }
  };

  const confirmReceived = async () => {
    if (!activeGift?.id) return;
    setBusy(true);
    try {
      await api.patch(`/subscription/gifts/${activeGift.id}/received`);
      toast.success(t("gift.receiptConfirmed"));
      await openGift();
    } catch (error) {
      toast.error(error?.response?.data?.message || t("gift.unableConfirmGift"));
    } finally {
      setBusy(false);
    }
  };

  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/25 px-4 backdrop-blur-[6px]">
      <section className="relative w-full max-w-[470px] rounded-lg bg-white px-5 py-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.25)]">
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label={t("topbar.close")}
        >
          <X size={16} />
        </button>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm font-semibold text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            {t("gift.loading")}
          </div>
        ) : mode === "referral" ? (
          <ReferralContent couponCodes={couponCodes} onCopy={copyCode} onClose={close} />
        ) : !activeGift ? (
          <GiftListContent
            gifts={gifts}
            onClose={close}
            onSelectGift={selectGift}
          />
        ) : (
          <GiftContent
            gift={activeGift}
            address={address}
            setAddress={setAddress}
            busy={busy}
            onClose={close}
            onBack={() => {
              setActiveGift(null);
              setAddress(emptyAddress);
            }}
            onSubmitAddress={submitAddress}
            onConfirmReceived={confirmReceived}
          />
        )}
      </section>
    </div>
  );
}

function ReferralContent({ couponCodes, onCopy, onClose }) {
  const { t } = useTranslation();
  const codes = Array.isArray(couponCodes) ? couponCodes.filter(Boolean) : [];

  return (
    <>
      <img src={shareReferralImage} alt="" className="mx-auto h-[130px] w-[180px] object-contain" />
      <h2 className="mt-3 text-[18px] font-bold text-[#333333]">
        {t("gift.shareTitle")}
      </h2>
      <p className="mx-auto mt-3 max-w-[390px] text-[11px] leading-[15px] text-[#505050]">
        {t("gift.shareDescription")}
      </p>

      <div className="mx-auto mt-6 max-h-[148px] w-full max-w-[260px] space-y-2 overflow-y-auto pr-1">
        {codes.length ? (
          codes.map((code, index) => (
            <div
              key={`${code}-${index}`}
              className="flex h-[44px] items-center justify-between rounded-full border border-[#b9d0df] px-5"
            >
              <span className="text-[18px] font-bold text-[#004368]">{code}</span>
              <button
                type="button"
                onClick={() => onCopy(code)}
                className="inline-flex h-8 items-center gap-1 rounded-full bg-[#f1f3f5] px-3 text-[11px] font-semibold text-[#5b6470]"
              >
                {t("gift.copy")} <Copy size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="flex h-[44px] items-center justify-center rounded-full border border-[#b9d0df] text-[18px] font-bold text-[#004368]">
            ------
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button type="button" onClick={onClose} className="h-10 rounded-md border border-[#d8dee6] text-sm font-medium text-[#222]">
          {t("gift.cancel")}
        </button>
        <button type="button" onClick={onClose} className="h-10 rounded-md bg-[#004b70] text-sm font-medium text-white">
          {t("gift.useLater")}
        </button>
      </div>
    </>
  );
}

function GiftListContent({ gifts, onClose, onSelectGift }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";

  if (!gifts.length) {
    return (
      <>
        <img src={openGiftImage} alt="" className="mx-auto h-[170px] w-[210px] object-contain" />
        <h2 className="mt-3 text-[18px] font-bold text-[#333333]">{t("gift.myGift")}</h2>
        <p className="mt-3 text-[12px] text-[#505050]">{t("gift.noGift")}</p>
        <button type="button" onClick={onClose} className="mt-8 h-10 w-full rounded-md bg-[#004b70] text-sm font-medium text-white">
          {t("gift.close")}
        </button>
      </>
    );
  }

  return (
    <>
      <img src={openGiftImage} alt="" className="mx-auto h-[125px] w-[170px] object-contain" />
      <h2 className="mt-2 text-[18px] font-bold text-[#333333]">{t("gift.myGift")}</h2>
      <p className="mt-2 text-[11px] text-[#505050]">
        {t("gift.selectGift")}
      </p>

      <div className="mt-5 max-h-[408px] space-y-2 overflow-y-auto pr-1 text-left">
        {gifts.map((gift) => {
          const isDone = ["RECEIVED", "DECLINED", "CANCELLED"].includes(gift.status);
          return (
            <div key={gift.id} className="rounded-lg border border-[#dbe7ef] bg-[#f8fbfd] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#004368]">{getGiftCode(gift)}</p>
                  <p className="mt-1 text-[11px] capitalize text-[#667085]">
                    {getGiftStatusLabel(gift.status, t)}
                    {getGiftDate(gift, language) ? ` - ${getGiftDate(gift, language)}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    gift.status === "PENDING_ADDRESS"
                      ? "bg-[#fff4d6] text-[#996300]"
                      : gift.status === "ADDRESS_SUBMITTED"
                        ? "bg-[#e7f7ee] text-[#168a4a]"
                        : gift.status === "DELIVERED"
                          ? "bg-[#e8f1ff] text-[#175cd3]"
                          : "bg-[#eef2f6] text-[#667085]"
                  }`}
                >
                  {getGiftStatusLabel(gift.status, t)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSelectGift(gift)}
                disabled={isDone}
                className="mt-3 h-9 w-full rounded-md bg-[#004b70] text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#b7c7d1]"
              >
                {getGiftActionLabel(gift, t)}
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={onClose} className="mt-5 h-10 w-full rounded-md border border-[#d8dee6] text-sm font-medium text-[#222]">
        {t("gift.close")}
      </button>
    </>
  );
}

function GiftContent({ gift, address, setAddress, busy, onClose, onBack, onSubmitAddress, onConfirmReceived }) {
  const { t } = useTranslation();
  const [showAddressConfirm, setShowAddressConfirm] = useState(false);
  const isAddressSubmitted = gift.status === "ADDRESS_SUBMITTED";

  if (!gift) {
    return (
      <>
        <img src={openGiftImage} alt="" className="mx-auto h-[170px] w-[210px] object-contain" />
        <h2 className="mt-3 text-[18px] font-bold text-[#333333]">{t("gift.openGift")}</h2>
        <p className="mt-3 text-[12px] text-[#505050]">{t("gift.noGift")}</p>
        <button type="button" onClick={onClose} className="mt-8 h-10 w-full rounded-md bg-[#004b70] text-sm font-medium text-white">
          {t("gift.close")}
        </button>
      </>
    );
  }

  if (gift.status === "PENDING_ADDRESS" || isAddressSubmitted) {
    return (
      <>
        <img src={giftReceivedImage} alt="" className="mx-auto h-[145px] w-[230px] object-contain" />
        <h2 className="mt-2 text-[18px] font-bold text-[#333333]">
          {isAddressSubmitted ? t("gift.deliveryAddress") : t("gift.congratulations")}
        </h2>
        <p className="mt-3 text-[11px] text-[#505050]">
          {isAddressSubmitted
            ? t("gift.addressSubmittedMessage")
            : t("gift.receivedPrinterMessage")}
        </p>

        <div className="mt-5 space-y-3 text-left">
          {[
            ["fullName", t("gift.name"), t("gift.namePlaceholder")],
            ["phone", t("gift.phoneNumber"), t("gift.phonePlaceholder")],
            ["addressLine1", t("gift.address"), t("gift.addressPlaceholder")],
            ["zipCode", t("gift.zipCode"), "1207"],
            ["city", t("gift.city"), t("gift.cityPlaceholder")],
            ["country", t("gift.country"), t("gift.countryPlaceholder")],
          ].map(([field, label, placeholder]) => (
            <label key={field} className="block">
              <span className="text-[10px] font-semibold text-[#333333]">{label}</span>
              <input
                value={address?.[field] || ""}
                onChange={(event) => setAddress((current) => ({ ...current, [field]: event.target.value }))}
                readOnly={isAddressSubmitted}
                placeholder={placeholder}
                className="mt-1 h-8 w-full rounded-sm border border-[#d5d5d5] px-2 text-[11px] outline-none focus:border-[#004b70] read-only:bg-[#f8fafc]"
              />
            </label>
          ))}
        </div>

        {isAddressSubmitted ? (
          <div className="mt-7 grid grid-cols-2 gap-3">
            <button type="button" onClick={onBack} className="h-10 rounded-md border border-[#d8dee6] text-sm font-medium text-[#222]">
              {t("gift.backToGifts")}
            </button>
            <button type="button" onClick={onClose} className="h-10 rounded-md bg-[#004b70] text-sm font-medium text-white">
              {t("gift.close")}
            </button>
          </div>
        ) : showAddressConfirm ? (
          <div className="mt-6 rounded-md border border-[#cfe0ea] bg-[#f5fafc] p-3">
            <p className="text-[12px] font-semibold text-[#333333]">
              {t("gift.confirmAddress")}
            </p>
            <p className="mt-1 text-[11px] text-[#667085]">
              {t("gift.processingAfterConfirm")}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowAddressConfirm(false)}
                disabled={busy}
                className="h-10 rounded-md border border-[#d8dee6] text-sm font-medium text-[#222] disabled:opacity-60"
              >
                {t("gift.back")}
              </button>
              <button
                type="button"
                onClick={onSubmitAddress}
                disabled={busy}
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#004b70] text-sm font-medium text-white disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    {t("gift.starting")}
                  </>
                ) : (
                  t("gift.confirm")
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3">
            <button type="button" onClick={onBack} className="h-10 rounded-md border border-[#d8dee6] text-sm font-medium text-[#222]">
              {t("gift.backToGifts")}
            </button>
            <button
              type="button"
              onClick={() => setShowAddressConfirm(true)}
              disabled={busy}
              className="h-10 rounded-md bg-[#004b70] text-sm font-medium text-white disabled:opacity-60"
            >
              {t("gift.receiveGift")}
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <img src={openGiftImage} alt="" className="mx-auto h-[170px] w-[210px] object-contain" />
      <h2 className="mt-3 text-[18px] font-bold text-[#333333]">{t("gift.openGift")}</h2>
      <p className="mt-3 text-[12px] capitalize text-[#505050]">
        {t("gift.giftStatus", { status: getGiftStatusLabel(gift.status, t) })}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        <button type="button" onClick={onBack} className="h-10 rounded-md border border-[#d8dee6] text-sm font-medium text-[#222]">
          {t("gift.backToGifts")}
        </button>
        <button
          type="button"
          onClick={gift.status === "DELIVERED" ? onConfirmReceived : onClose}
          disabled={busy}
          className="h-10 rounded-md bg-[#004b70] text-sm font-medium text-white disabled:opacity-60"
        >
          {gift.status === "DELIVERED" ? t("gift.confirmReceived") : t("gift.openGift")}
        </button>
      </div>
    </>
  );
}
