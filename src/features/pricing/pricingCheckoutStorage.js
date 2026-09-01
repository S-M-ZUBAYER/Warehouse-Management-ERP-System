export const PRICING_CHECKOUT_STORAGE_KEY = "PricingCheckoutPayload";
export const PRICING_PAYMENT_RESULT_STORAGE_KEY = "PricingPaymentResult";

export function savePricingCheckout(payload) {
  localStorage.setItem(PRICING_CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
}

export function readPricingCheckout() {
  try {
    const rawValue = localStorage.getItem(PRICING_CHECKOUT_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

export function savePricingPaymentResult(result) {
  localStorage.setItem(PRICING_PAYMENT_RESULT_STORAGE_KEY, JSON.stringify(result));
}

export function readPricingPaymentResult() {
  try {
    const rawValue = localStorage.getItem(PRICING_PAYMENT_RESULT_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

export function formatUsdAmount(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amount || 0));
}
