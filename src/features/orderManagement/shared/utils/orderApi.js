import api from "../../../../lib/api";
import platformApi from "../../../../lib/platformApi";

export const ORDER_STORE_CONTEXT_KEY = "order-store-context";
export const ORDER_SEARCH_CONTEXT_KEY = "order-search-context";
export const ORDER_DETAIL_CACHE_KEY = "order-detail-cache";

const DEFAULT_PLATFORM_HOST = "http://192.168.1.222:8080/";
// const DEFAULT_PLATFORM_HOST = "https://grozziie.zjweiting.com:3091/";
const DEFAULT_MERGE_HOST = "https://grozziieget.zjweiting.com:8033";
const DEFAULT_IMAGE = "https://placehold.co/36x36/E6ECF0/004368?text=?";

export const SUPPORTED_PLATFORMS = ["shopee", "tiktok"];

export const ORDER_PAGE_CONFIG = {
  all: {
    label: "All Orders",
    shopeeStatus: "",
    tiktokStatus: "",
    statusLabel: "Status",
  },
  new: {
    label: "New Orders",
    shopeeStatus: "READY_TO_SHIP",
    tiktokStatus: "AWAITING_SHIPMENT",
    statusLabel: "To Ship",
  },
  processed: {
    label: "Processed Orders",
    shopeeStatus: "PROCESSED",
    tiktokStatus: "AWAITING_COLLECTION",
    statusLabel: "Processed",
  },
  pickup: {
    label: "Pickup Orders",
    shopeeStatus: "SHIPPED",
    tiktokStatus: "IN_TRANSIT",
    statusLabel: "Processed",
  },
  shipped: {
    label: "Shipped Orders",
    shopeeStatus: "SHIPPED",
    tiktokStatus: "DELIVERED",
    statusLabel: "Shipping",
  },
  completed: {
    label: "Completed Orders",
    shopeeStatus: "COMPLETED",
    tiktokStatus: "COMPLETED",
    statusLabel: "Completed",
  },
  canceled: {
    label: "Cancelled Orders",
    shopeeStatus: "CANCELLED",
    tiktokStatus: "CANCEL",
    statusLabel: "Cancelled",
  },
};

const SHOOPEE_TAB_STATUS = {
  "To Pack": "READY_TO_SHIP",
  "Packed Successful": "PROCESSED",
  "Packed Successfully": "PROCESSED",
  "Pack Failed": "READY_TO_SHIP",
  "Out Of Stock": "READY_TO_SHIP",
  "Platform Processing": "PENDING",
  "Pushing": "PROCESSED",
  "Pushed Successful": "PROCESSED",
  "Withdraw": "READY_TO_SHIP",
  "All": "",
  "Cancelation Request": "IN_CANCEL",
  "Cancelled": "CANCELLED",
};

const TIKTOK_TAB_STATUS = {
  "To Pack": "AWAITING_SHIPMENT",
  "Packed Successful": "AWAITING_COLLECTION",
  "Packed Successfully": "AWAITING_COLLECTION",
  "Pack Failed": "AWAITING_SHIPMENT",
  "Out Of Stock": "AWAITING_SHIPMENT",
  "Platform Processing": "ON_HOLD",
  "Pushing": "AWAITING_COLLECTION",
  "Pushed Successful": "AWAITING_COLLECTION",
  "Withdraw": "AWAITING_SHIPMENT",
  "All": "",
  "Cancelation Request": "CANCELLED",
  "Cancelled": "CANCELLED",
};

export const SEARCH_FIELD_MAP = {
  SKU: "sku",
  "Package Number": "pkgNo",
  "Order Number": "orderNo",
  "Tracking Number": "trackingNo",
};

const safeLocalStorageGet = (key, fallback = null) => {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const safeLocalStorageSet = (key, value) => {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // keep UI usable when storage is disabled/full
  }
};

export const getStoredOrderContext = () =>
  safeLocalStorageGet(ORDER_STORE_CONTEXT_KEY, {});

export const setStoredOrderContext = (context) =>
  safeLocalStorageSet(ORDER_STORE_CONTEXT_KEY, context ?? {});

export const getStoredSearchContext = () =>
  safeLocalStorageGet(ORDER_SEARCH_CONTEXT_KEY, {});

export const setStoredSearchContext = (context) =>
  safeLocalStorageSet(ORDER_SEARCH_CONTEXT_KEY, context ?? {});

export const setCachedOrderDetail = (order) => {
  if (!order?.id) return;
  const cache = safeLocalStorageGet(ORDER_DETAIL_CACHE_KEY, {});
  cache[String(order.id)] = order;
  safeLocalStorageSet(ORDER_DETAIL_CACHE_KEY, cache);
};

export const getCachedOrderDetail = (id) => {
  const cache = safeLocalStorageGet(ORDER_DETAIL_CACHE_KEY, {});
  return cache?.[String(id)] ?? null;
};

const normalizePlatform = (platform) => {
  const value = String(platform || "").toLowerCase();
  if (value.includes("shopee")) return "shopee";
  if (value.includes("tik") || value.includes("tiktok")) return "tiktok";
  return value;
};

export const platformLabel = (platform) => {
  const value = normalizePlatform(platform);
  if (value === "shopee") return "Shopee";
  if (value === "tiktok") return "TikTok";
  return String(platform || "");
};

const getPlatformApiBase = () => {
  const envBase =
    import.meta.env.VITE_ORDER_PLATFORM_BASE_URL ||
    import.meta.env.VITE_PLATFORM_API_BASE_URL ||
    DEFAULT_PLATFORM_HOST;

  return String(envBase)
    .replace(/\/+$/, "")
    .replace(/\/CustomerService-Chat\/api$/i, "")
    .replace(/\/api\/v1$/i, "");
};

const getMergeApiBase = () =>
  String(import.meta.env.VITE_PDF_MERGE_BASE_URL || DEFAULT_MERGE_HOST).replace(/\/+$/, "");

const buildUrl = (path, params) => {
  const base = getPlatformApiBase();
  const url = new URL(`${base}${path}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const fetchJson = async (path, { method = "GET", params, body } = {}) => {
  const response = await fetch(buildUrl(path, params), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(text || `Request failed (${response.status})`);
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Request failed (${response.status})`);
  }

  if (data?.error && !data?.response && !data?.data) {
    throw new Error(data?.message || data.error);
  }

  return data;
};

const fetchBlob = async (path, { method = "GET", params, body } = {}) => {
  const response = await fetch(buildUrl(path, params), {
    method,
    headers: body ? { "Content-Type": "application/json", Accept: "*/*" } : undefined,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.blob();
};

const SECONDS_IN_DAY = 24 * 60 * 60;
const SHOPEE_MAX_RANGE_SECONDS = 15 * SECONDS_IN_DAY - 60;
const SHOPEE_ORDER_STATUSES = [
  // "PENDING",
  "READY_TO_SHIP",
  "PROCESSED",
  "SHIPPED",
  "COMPLETED",
  "IN_CANCEL",
  "CANCELLED",
];
const TIKTOK_ORDER_STATUSES = [
  "AWAITING_SHIPMENT",
  "AWAITING_COLLECTION",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "ON_HOLD"
];

const toUnixSeconds = (value) => {
  if (value === undefined || value === null || value === "") return null;

  if (value instanceof Date) {
    return Math.floor(value.getTime() / 1000);
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric > 9999999999 ? Math.floor(numeric / 1000) : Math.floor(numeric);
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null;
};

export const getUnixDateRange = (days = 7) => {
  const end = Math.floor(Date.now() / 1000);
  const start = end - days * SECONDS_IN_DAY;
  return { start, end };
};

export const getShopeeDateRange = (dateRange) => {
  const fallback = getUnixDateRange(7);
  const rawStart = toUnixSeconds(dateRange?.start ?? dateRange?.timeFrom ?? dateRange?.startTime);
  const rawEnd = toUnixSeconds(dateRange?.end ?? dateRange?.timeTo ?? dateRange?.endTime);

  let start = rawStart ?? fallback.start;
  let end = rawEnd ?? fallback.end;

  if (start >= end) {
    end = Math.floor(Date.now() / 1000);
    start = end - 7 * SECONDS_IN_DAY;
  }

  if (end - start > SHOPEE_MAX_RANGE_SECONDS) {
    start = end - SHOPEE_MAX_RANGE_SECONDS;
  }

  return { start, end };
};

export const getTikTokDateRange = (dateRange) => {
  const fallback = getUnixDateRange(7);
  const rawStart = toUnixSeconds(dateRange?.start ?? dateRange?.createTimeGe ?? dateRange?.startTime);
  const rawEnd = toUnixSeconds(dateRange?.end ?? dateRange?.createTimeLt ?? dateRange?.endTime);

  const start = rawStart ?? fallback.start;
  const end = rawEnd ?? fallback.end;

  if (start >= end) return fallback;
  return { start, end };
};

const formatMoney = (amount, currency = "") => {
  const numeric = Number(amount || 0);
  const formatted = Number.isFinite(numeric) ? numeric.toFixed(2).replace(/\.00$/, "") : "0";
  return `${currency ? `${currency} ` : "$"}${formatted}`.trim();
};

const formatDateTime = (seconds) => {
  if (!seconds) return "-";
  const value = Number(seconds);
  if (!Number.isFinite(value)) return String(seconds);
  return new Date(value * 1000).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const maskString = (value, keepStart = 1, keepEnd = 1) => {
  const text = String(value || "");
  if (!text) return "-";
  if (text.length <= keepStart + keepEnd) return "*".repeat(text.length);
  return `${text.slice(0, keepStart)}${"*".repeat(Math.max(3, text.length - keepStart - keepEnd))}${text.slice(-keepEnd)}`;
};

const normalizeShopeeStatus = (status) => {
  const value = String(status || "").toUpperCase();
  if (["INVOICE_PENDING", "PENDING"].includes(value)) return "Platform Processing";
  if (["READY_TO_SHIP", "RETRY_SHIP"].includes(value)) return "To Ship";
  if (["PROCESSED"].includes(value)) return "Processed";
  if (["TO_CONFIRM_RECEIVE"].includes(value)) return "Shipped";
  if (["SHIPPED"].includes(value)) return "Shipping";
  if (["COMPLETED"].includes(value)) return "Completed";
  if (["CANCELLED", "IN_CANCEL"].includes(value)) return "Cancelled";
  return status || "-";
};

const normalizeTikTokStatus = (status) => {
  const value = String(status || "").toUpperCase();
  if (["ON_HOLD"].includes(value)) return "Platform Processing";
  if (["AWAITING_PAYMENT", "AWAITING_SHIPMENT", "UNPAID"].includes(value)) return "To Ship";
  if (["AWAITING_COLLECTION"].includes(value)) return "Processed";
  if (["DELIVERED"].includes(value)) return "Shipped";
  if (["IN_TRANSIT"].includes(value)) return "Shipping";
  if (["COMPLETED"].includes(value)) return "Completed";
  if (["CANCEL", "CANCELLED"].includes(value)) return "Cancelled";
  return status || "-";
};

const getShopeeItemImage = (item) =>
  item?.image_info?.image_url || item?.image_info?.image_url_list?.[0] || DEFAULT_IMAGE;

const normalizeShopeeItems = (order) =>
  (order?.item_list || []).map((item, index) => {
    const qty = Number(item?.model_quantity_purchased || 0);
    const unitPrice = Number(item?.model_discounted_price ?? item?.model_original_price ?? 0);
    return {
      id: item?.order_item_id || item?.item_id || item?.model_id || index,
      platformItemId: item?.item_id,
      packageId: item?.package_number || order?.package_list?.[0]?.package_number || "-",
      name: item?.item_name || item?.model_name || "Product",
      sku: item?.model_sku || item?.item_sku || item?.model_name || "-",
      modelName: item?.model_name || "-",
      quantity: qty || 1,
      unitPrice,
      currency: order?.currency || "",
      subtotal: unitPrice * (qty || 1),
      image: getShopeeItemImage(item),
      raw: item,
    };
  });

const normalizeTikTokItems = (order) =>
  (order?.lineItems || order?.line_items || []).map((item, index) => {
    const qty = Number(item?.quantity || item?.skuQuantity || 1);
    const salePrice = item?.salePrice || item?.sale_price || {};
    const amount = Number(salePrice?.amount ?? salePrice ?? item?.price ?? 0);
    const image =
      item?.skuImage ||
      item?.productImage ||
      item?.product_image ||
      item?.imageUrl ||
      item?.image_url ||
      DEFAULT_IMAGE;
    return {
      id: item?.id || item?.lineItemId || item?.line_item_id || index,
      platformItemId: item?.productId || item?.product_id,
      packageId: item?.packageId || item?.package_id || order?.packageId || "-",
      name: item?.productName || item?.product_name || item?.skuName || "Product",
      sku: item?.sellerSku || item?.seller_sku || item?.skuName || item?.sku_name || "-",
      modelName: item?.skuName || item?.sku_name || "-",
      quantity: qty || 1,
      unitPrice: amount,
      currency: order?.payment?.currency || salePrice?.currency || "",
      subtotal: amount * (qty || 1),
      image,
      raw: item,
    };
  });

const buildAddressText = (address = {}) =>
  [
    address.full_address,
    address.fullAddress,
    address.address_detail,
    address.addressDetail,
    address.addressLine1,
    address.district,
    address.city,
    address.state,
    address.region,
    address.zipcode,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

export const normalizeShopeeOrder = (order, context = {}) => {
  const items = normalizeShopeeItems(order);
  const firstItem = items[0] || {};
  const recipient = order?.recipient_address || {};
  const totalAmount = order?.total_amount ?? items.reduce((sum, item) => sum + item.subtotal, 0);
  const id = `shopee:${order?.order_sn}`;

  return {
    id,
    rawId: order?.order_sn,
    platform: "shopee",
    platformLabel: "Shopee",
    storeName: context.store || context.external_store_name || "Store name",
    storeContext: context,
    pkgNo: order?.package_list?.[0]?.package_number || firstItem.packageId || order?.order_sn || "-",
    sku: firstItem.sku || "-",
    orderNo: order?.order_sn || "-",
    trackingNo: order?.tracking_number || order?.trackingNo || "--",
    price: formatMoney(totalAmount, order?.currency),
    createdAt: formatDateTime(order?.create_time),
    orderTime: formatDateTime(order?.create_time),
    status: normalizeShopeeStatus(order?.order_status),
    rawStatus: order?.order_status || "",
    image: firstItem.image || DEFAULT_IMAGE,
    items,
    logistics: {
      buyerLogistic: order?.shipping_carrier || "-",
      logisticsName: order?.shipping_carrier || "Shopee Logistic",
      trackingNo: order?.tracking_number || "--",
    },
    payment: {
      type: order?.cod ? "COD" : "Prepaid",
      paidAt: formatDateTime(order?.pay_time || order?.create_time),
      subtotal: formatMoney(items.reduce((sum, item) => sum + item.subtotal, 0), order?.currency),
      shippingFee: formatMoney(order?.estimated_shipping_fee || order?.buyer_paid_shipping_fee || 0, order?.currency),
      discount: formatMoney(order?.voucher_from_seller || order?.voucher_from_shopee || 0, order?.currency),
      orderValue: formatMoney(totalAmount, order?.currency),
    },
    customer: {
      userName: order?.buyer_username || order?.buyer_user_id || "-",
      recipientName: maskString(recipient?.name, 1, 1),
      phone: maskString(recipient?.phone, 0, 2),
      address: buildAddressText(recipient) || "-",
      city: recipient?.city || recipient?.district || "-",
      state: recipient?.state || "-",
      postCode: recipient?.zipcode || "-",
      country: recipient?.region || context.region || "-",
    },
    note: order?.message_to_seller || order?.note || "-",
    raw: order,
  };
};

export const normalizeTikTokOrder = (order, context = {}) => {
  const items = normalizeTikTokItems(order);
  const firstItem = items[0] || {};
  const address = order?.recipientAddress || order?.recipient_address || {};
  const payment = order?.payment || {};
  const totalAmount = Number(payment?.totalAmount || payment?.total_amount || 0);
  const id = `tiktok:${order?.id}`;

  return {
    id,
    rawId: order?.id,
    platform: "tiktok",
    platformLabel: "TikTok",
    storeName: context.store || context.external_store_name || "Store name",
    storeContext: context,
    pkgNo: firstItem.packageId || order?.packageId || order?.id || "-",
    sku: firstItem.sku || "-",
    orderNo: order?.id || "-",
    trackingNo: order?.trackingNumber || order?.tracking_number || "--",
    price: formatMoney(totalAmount || items.reduce((sum, item) => sum + item.subtotal, 0), payment?.currency),
    createdAt: formatDateTime(order?.createTime || order?.create_time),
    orderTime: formatDateTime(order?.createTime || order?.create_time),
    status: normalizeTikTokStatus(order?.status),
    rawStatus: order?.status || "",
    shippingProviderId: order?.shippingProviderId || order?.shipping_provider_id || order?.shippingProvider?.id || order?.shipping_provider?.id || "",
    warehouseId: order?.warehouseId || order?.warehouse_id || order?.warehouse?.id || order?.fulfillment?.warehouseId || "",
    deliveryOptionId: order?.deliveryOptionId || order?.delivery_option_id || order?.deliveryOption?.id || "",
    lineItems: items,
    image: firstItem.image || DEFAULT_IMAGE,
    items,
    logistics: {
      buyerLogistic: order?.deliveryType || order?.delivery_type || "-",
      logisticsName: order?.shippingProvider || order?.shipping_provider || "TikTok Logistic",
      trackingNo: order?.trackingNumber || order?.tracking_number || "--",
    },
    payment: {
      type: order?.paymentMethodName || order?.payment_method_name || "Prepaid",
      paidAt: formatDateTime(order?.paidTime || order?.paid_time || order?.createTime),
      subtotal: formatMoney(payment?.subTotal || payment?.sub_total || items.reduce((sum, item) => sum + item.subtotal, 0), payment?.currency),
      shippingFee: formatMoney(payment?.shippingFee || payment?.shipping_fee || 0, payment?.currency),
      discount: formatMoney(payment?.sellerDiscount || payment?.seller_discount || payment?.platformDiscount || payment?.platform_discount || 0, payment?.currency),
      orderValue: formatMoney(totalAmount, payment?.currency),
    },
    customer: {
      userName: order?.buyerEmail || order?.buyer_email || order?.buyerUserId || "-",
      recipientName: maskString(address?.name, 1, 1),
      phone: maskString(address?.phoneNumber || address?.phone_number, 0, 2),
      address: address?.fullAddress || address?.full_address || buildAddressText(address) || "-",
      city: address?.city || address?.districtInfo?.[2]?.addressName || "-",
      state: address?.state || address?.districtInfo?.[1]?.addressName || "-",
      postCode: address?.postalCode || address?.postal_code || "-",
      country: address?.regionCode || address?.region_code || context.region || "-",
    },
    note: order?.buyerMessage || order?.buyer_message || "-",
    raw: order,
  };
};

const getContextValue = (context, keys) =>
  keys.map((key) => context?.[key]).find((value) => value !== undefined && value !== null && value !== "");

const getCurrentCompanyId = () => {
  const storedUser = readJsonStorage("warehouseUser", {});
  const authUser = readJsonStorage("auth-storage", {});
  return (
    storedUser?.companyId ||
    storedUser?.company_id ||
    storedUser?.company?.id ||
    storedUser?.companyName ||
    storedUser?.id ||
    storedUser?.userId ||
    authUser?.state?.user?.companyId ||
    authUser?.state?.user?.id ||
    storedUser?.email ||
    storedUser?.userEmail ||
    ""
  );
};

const getStoreScopeId = (context) =>
  getContextValue(context, ["platform_store_id", "store_id", "shop_id", "external_store_id", "store_shop_id"]) || "";

export const getFailedPackOrderIds = async ({ context, platform }) => {
  const companyId = getCurrentCompanyId();
  const normalizedPlatform = normalizePlatform(platform || context?.platform);

  if (!companyId || !normalizedPlatform) return [];

  try {
    const res = await api.get("/order-management/pack-failed-orders", {
      params: {
        companyId,
        platform: normalizedPlatform,
        storeId: getStoreScopeId(context),
      },
    });
    const rows = res?.data || res?.orders || res?.items || res || [];
    return rows
      .map((item) => item?.orderId || item?.order_id || item?.rawId || item)
      .filter(Boolean)
      .map(String);
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.warn("Failed pack order IDs could not be loaded.", error);
    }
    return [];
  }
};

export const saveFailedPackOrders = async ({ context, platform, failedOrders = [] }) => {
  const companyId = getCurrentCompanyId();
  const normalizedPlatform = normalizePlatform(platform || context?.platform);
  const orderIds = [...new Set(failedOrders.map((order) => order?.orderId).filter(Boolean).map(String))];

  if (!companyId || !normalizedPlatform || orderIds.length === 0) return null;

  return api
    .post("/order-management/pack-failed-orders", {
      companyId,
      platform: normalizedPlatform,
      storeId: getStoreScopeId(context),
      orders: failedOrders
        .filter((order) => order?.orderId)
        .map((order) => ({
          orderId: String(order.orderId),
          reason: order.reason || "",
        })),
    })
    .catch((error) => {
      console.warn("Failed pack orders could not be saved.", error);
      return null;
    });
};

export const removeFailedPackOrders = async ({ context, platform, orderIds = [] }) => {
  const companyId = getCurrentCompanyId();
  const normalizedPlatform = normalizePlatform(platform || context?.platform);
  const ids = [...new Set(orderIds.filter(Boolean).map(String))];

  if (!companyId || !normalizedPlatform || ids.length === 0) return null;

  return api
    .delete("/order-management/pack-failed-orders", {
      data: {
        companyId,
        platform: normalizedPlatform,
        storeId: getStoreScopeId(context),
        orderIds: ids,
      },
    })
    .catch((error) => {
      console.warn("Packed orders could not be removed from failed list.", error);
      return null;
    });
};

export const getPushSuccessfulOrderIds = async ({ context, platform }) => {
  const companyId = getCurrentCompanyId();
  const normalizedPlatform = normalizePlatform(platform || context?.platform);

  if (!companyId || !normalizedPlatform) return [];

  try {
    const res = await api.get("/order-management/push-successful-orders", {
      params: {
        companyId,
        platform: normalizedPlatform,
        storeId: getStoreScopeId(context),
      },
    });
    const rows = res?.data || res?.orders || res?.items || res || [];
    return rows
      .map((item) => item?.orderId || item?.order_id || item?.rawId || item)
      .filter(Boolean)
      .map(String);
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.warn("Push successful order IDs could not be loaded.", error);
    }
    return [];
  }
};

export const savePushSuccessfulOrders = async ({ context, platform, orderIds = [] }) => {
  const companyId = getCurrentCompanyId();
  const normalizedPlatform = normalizePlatform(platform || context?.platform);
  const ids = [...new Set(orderIds.filter(Boolean).map(String))];

  if (!companyId || !normalizedPlatform || ids.length === 0) return null;

  return api
    .post("/order-management/push-successful-orders", {
      companyId,
      platform: normalizedPlatform,
      storeId: getStoreScopeId(context),
      orders: ids.map((orderId) => ({ orderId })),
    })
    .catch((error) => {
      console.warn("Push successful orders could not be saved.", error);
      return null;
    });
};

export const getWithdrawOrderIds = async ({ context, platform }) => {
  const companyId = getCurrentCompanyId();
  const normalizedPlatform = normalizePlatform(platform || context?.platform);

  if (!companyId || !normalizedPlatform) return [];

  try {
    const res = await api.get("/order-management/withdraw-orders", {
      params: {
        companyId,
        platform: normalizedPlatform,
        storeId: getStoreScopeId(context),
      },
    });
    const rows = res?.data || res?.orders || res?.items || res || [];
    return rows
      .map((item) => item?.orderId || item?.order_id || item?.rawId || item)
      .filter(Boolean)
      .map(String);
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.warn("Withdraw order IDs could not be loaded.", error);
    }
    return [];
  }
};

export const saveWithdrawOrders = async ({ context, platform, orderIds = [] }) => {
  const companyId = getCurrentCompanyId();
  const normalizedPlatform = normalizePlatform(platform || context?.platform);
  const ids = [...new Set(orderIds.filter(Boolean).map(String))];

  if (!companyId || !normalizedPlatform || ids.length === 0) return null;

  return api
    .post("/order-management/withdraw-orders", {
      companyId,
      platform: normalizedPlatform,
      storeId: getStoreScopeId(context),
      orders: ids.map((orderId) => ({ orderId })),
    })
    .catch((error) => {
      console.warn("Withdraw orders could not be saved.", error);
      return null;
    });
};

export const removeWithdrawOrders = async ({ context, platform, orderIds = [] }) => {
  const companyId = getCurrentCompanyId();
  const normalizedPlatform = normalizePlatform(platform || context?.platform);
  const ids = [...new Set(orderIds.filter(Boolean).map(String))];

  if (!companyId || !normalizedPlatform || ids.length === 0) return null;

  return api
    .delete("/order-management/withdraw-orders", {
      data: {
        companyId,
        platform: normalizedPlatform,
        storeId: getStoreScopeId(context),
        orderIds: ids,
      },
    })
    .catch((error) => {
      console.warn("Withdraw orders could not be removed.", error);
      return null;
    });
};

const getRawDateRange = (dateRange, fallbackDays = 7) => {
  const fallback = getUnixDateRange(fallbackDays);
  const rawStart = toUnixSeconds(dateRange?.start ?? dateRange?.timeFrom ?? dateRange?.createTimeGe ?? dateRange?.startTime);
  const rawEnd = toUnixSeconds(dateRange?.end ?? dateRange?.timeTo ?? dateRange?.createTimeLt ?? dateRange?.endTime);
  const start = rawStart ?? fallback.start;
  const end = rawEnd ?? fallback.end;

  if (start >= end) return fallback;
  return { start, end };
};

const getShopeeDateWindows = (dateRange) => {
  const range = getRawDateRange(dateRange, 7);
  const windows = [];
  let windowEnd = range.end;

  while (windowEnd > range.start) {
    const windowStart = Math.max(range.start, windowEnd - SHOPEE_MAX_RANGE_SECONDS);
    windows.push({ start: windowStart, end: windowEnd });
    windowEnd = windowStart - 1;
  }

  return windows.length ? windows : [range];
};

const parseShopeeCursor = (cursor) => {
  if (!cursor) return { statusIndex: 0, windowIndex: 0, cursor: "" };
  try {
    const parsed = JSON.parse(cursor);
    return {
      statusIndex: Number(parsed?.statusIndex) || 0,
      windowIndex: Number(parsed?.windowIndex) || 0,
      cursor: parsed?.cursor || "",
    };
  } catch {
    return { statusIndex: 0, windowIndex: 0, cursor: String(cursor || "") };
  }
};

const stringifyShopeeCursor = ({ statusIndex, windowIndex, cursor }) =>
  JSON.stringify({ statusIndex, windowIndex, cursor: cursor || "" });

export const getPlatformStatus = ({ platform, pageType = "all", tab }) => {
  const normalized = normalizePlatform(platform);
  if (normalized === "shopee" && tab && SHOOPEE_TAB_STATUS[tab] !== undefined) {
    return SHOOPEE_TAB_STATUS[tab];
  }
  if (normalized === "tiktok" && tab && TIKTOK_TAB_STATUS[tab] !== undefined) {
    return TIKTOK_TAB_STATUS[tab];
  }
  const config = ORDER_PAGE_CONFIG[pageType] || ORDER_PAGE_CONFIG.all;
  return normalized === "tiktok" ? config.tiktokStatus : config.shopeeStatus;
};

const getPlatformStatuses = ({ platform, pageType = "all", tab }) => {
  const normalized = normalizePlatform(platform);
  const status = getPlatformStatus({ platform: normalized, pageType, tab });

  if (pageType === "canceled" && (!status || tab === "All")) {
    return normalized === "tiktok" ? ["CANCELLED"] : ["IN_CANCEL", "CANCELLED"];
  }

  if (normalized === "shopee" && !status) return SHOPEE_ORDER_STATUSES;

  if (normalized === "tiktok") {
    if (!status) return TIKTOK_ORDER_STATUSES;
  }

  return [status];
};

const getTikTokBuyerCancelValues = ({ pageType, tab }) => {
  if (pageType === "all" || pageType === "canceled") {
    if (tab === "Cancelation Request") return [true];
    if (tab === "All" || !tab) return [false, true];
    return [false];
  }
  if (tab === "Cancelation Request") return [true];
  return [false];
};

export const fetchShopeeOrders = async ({ context, pageType, tab, dateRange, pagination }) => {
  const shopId = getContextValue(context, ["shop_id", "external_store_id", "store_shop_id"]);
  if (!shopId) return pagination?.serverPaginated ? { orders: [], hasMore: false, nextCursor: "" } : [];

  const statuses = getPlatformStatuses({ platform: "shopee", pageType, tab });
  const serverPaginated = pagination?.serverPaginated === true;
  const detailPaginated = pagination?.detailPaginated === true;
  const pageSize = serverPaginated ? pagination?.pageSize || 10 : 50;
  const windows = getShopeeDateWindows(dateRange);
  let { statusIndex, windowIndex, cursor } = serverPaginated
    ? parseShopeeCursor(pagination?.cursor)
    : { statusIndex: 0, windowIndex: 0, cursor: "" };
  let orders = [];
  let nextCursor = "";

  while (
    statusIndex < statuses.length &&
    windowIndex < windows.length &&
    (!serverPaginated || orders.length < pageSize)
  ) {
    const status = statuses[statusIndex];
    const range = windows[windowIndex];
    const requestPageSize = serverPaginated ? pageSize - orders.length : pageSize;
    const res = await fetchJson("/shopee-open-shop/api/dev/order/get-order-list", {
      params: {
        shopId,
        timeFrom: range.start,
        timeTo: range.end,
        pageSize: requestPageSize,
        response_optional_fields: "order_status",
        orderStatus: status,
        cursor,
      },
    });

    const list = res?.response?.order_list || [];
    orders = [...orders, ...list];
    const hasMore = res?.response?.more === true;
    const responseCursor = res?.response?.next_cursor || "";

    if (hasMore && responseCursor) {
      cursor = responseCursor;
      if (serverPaginated) {
        nextCursor = stringifyShopeeCursor({ statusIndex, windowIndex, cursor });
        if (orders.length >= pageSize) break;
      }
      continue;
    }

    cursor = "";
    windowIndex += 1;
    if (windowIndex >= windows.length) {
      statusIndex += 1;
      windowIndex = 0;
    }

    if (serverPaginated) {
      nextCursor = statusIndex < statuses.length
        ? stringifyShopeeCursor({ statusIndex, windowIndex, cursor: "" })
        : "";
    }
  }

  const rowsForPage =
    pageType === "shipped"
      ? orders.filter((order) => String(order?.order_status || "").toUpperCase() === "TO_CONFIRM_RECEIVE")
      : pageType === "pickup"
        ? orders.filter((order) => String(order?.order_status || "").toUpperCase() === "SHIPPED")
      : orders;
  const detailRows = detailPaginated
    ? rowsForPage.slice(
        ((Number(pagination?.page) || 1) - 1) * (Number(pagination?.pageSize) || 10),
        (Number(pagination?.page) || 1) * (Number(pagination?.pageSize) || 10)
      )
    : rowsForPage;
  const orderSnList = detailRows.map((order) => order.order_sn).filter(Boolean);
  let details = [];

  try {
    details = await fetchShopeeOrderDetails({ context, orderSnList });
  } catch (error) {
    console.warn("Shopee order details could not be loaded; showing list rows only.", error);
  }

  const detailMap = new Map(details.map((order) => [order.order_sn, order]));

  const normalizedOrders = rowsForPage.map((order) => normalizeShopeeOrder(detailMap.get(order.order_sn) || order, context));

  if (serverPaginated) {
    return {
      orders: normalizedOrders,
      hasMore: Boolean(nextCursor),
      nextCursor,
    };
  }

  return normalizedOrders;
};

export const fetchShopeeOrderDetails = async ({ context, orderSnList = [] }) => {
  const shopId = getContextValue(context, ["shop_id", "external_store_id", "store_shop_id"]);
  if (!shopId || orderSnList.length === 0) return [];

  const batches = [];
  for (let i = 0; i < orderSnList.length; i += 30) {
    batches.push(orderSnList.slice(i, i + 30));
  }

  const detailRows = [];
  for (const batch of batches) {
    const detailsRes = await fetchJson("/shopee-open-shop/api/dev/order/get-order-details", {
      params: {
        shopId,
        orderSnList: batch.join(","),
        request_order_status_pending: true,
        response_optional_fields:
          "buyer_user_id,buyer_username,currency,total_amount,recipient_address,item_list,payment_method,cod,estimated_shipping_fee,buyer_paid_shipping_fee,shipping_carrier,package_list,message_to_seller,note,pay_time,create_time,update_time,order_status",
      },
    });

    detailRows.push(...(detailsRes?.response?.order_list || []));
  }

  const withTracking = await Promise.all(
    detailRows.map(async (order) => {
      try {
        const trackingRes = await fetchJson("/shopee-open-shop/api/dev/logistics/get-tracking-number", {
          params: {
            shopId,
            orderSn: order?.order_sn,
            packageNumber: order?.package_list?.[0]?.package_number || "-",
            responseOptionalFields: "first_mile_tracking_number",
          },
        });
        return {
          ...order,
          tracking_number:
            trackingRes?.body?.response?.tracking_number ||
            trackingRes?.response?.tracking_number ||
            order?.tracking_number ||
            "",
        };
      } catch {
        return order;
      }
    })
  );

  return withTracking;
};

const parseTikTokCursor = (cursor) => {
  if (!cursor) return { statusIndex: 0, pageToken: "" };
  try {
    const parsed = JSON.parse(cursor);
    return {
      statusIndex: Number(parsed?.statusIndex) || 0,
      pageToken: parsed?.pageToken || "",
    };
  } catch {
    return { statusIndex: 0, pageToken: String(cursor || "") };
  }
};

const stringifyTikTokCursor = ({ statusIndex, pageToken }) =>
  JSON.stringify({ statusIndex, pageToken: pageToken || "" });

export const fetchTikTokOrders = async ({ context, pageType, tab, dateRange, pagination }) => {
  const cipher = getContextValue(context, ["cipher", "store_cipher", "platform_cipher"]);
  const openId = getContextValue(context, ["platform_open_id", "open_id", "store_open_id"]);
  const serverPaginated = pagination?.serverPaginated === true;
  if (!cipher || !openId) return serverPaginated ? { orders: [], hasMore: false, nextCursor: "" } : [];

  const range = getTikTokDateRange(dateRange);
  let orders = [];
  const statuses = getPlatformStatuses({ platform: "tiktok", pageType, tab });
  const buyerCancelValues = getTikTokBuyerCancelValues({ pageType, tab });

  if (serverPaginated) {
    const pageSize = pagination?.pageSize || 10;
    let remaining = pageSize;
    let { statusIndex, pageToken } = parseTikTokCursor(pagination?.cursor);
    let nextCursor = "";
    const countedStatuses = new Set();
    let totalCount = 0;
    const buyerCancelValue = buyerCancelValues[0] || false;

    while (statusIndex < statuses.length && remaining > 0) {
      const orderStatus = statuses[statusIndex];
      const res = await fetchJson("/tiktokshop-partner/api/dev/order/list/filter", {
        method: "POST",
        params: {
          pageSize: remaining,
          cipher,
          openId,
          createTimeGe: range.start,
          createTimeLt: range.end,
          updateTimeGe: range.start,
          updateTimeLt: range.end,
          orderStatus,
          isBuyerRequestCancel: buyerCancelValue,
          shippingType: "TIKTOK",
          sortField: "create_time",
          sortOrder: "DESC",
          pageToken,
        },
      });

      const payload = res?.data || res?.body?.data || res;
      const pageOrders = payload?.orders || [];
      const nextPageToken = payload?.nextPageToken || payload?.next_page_token || "";
      if (!countedStatuses.has(orderStatus)) {
        totalCount += Number(payload?.totalCount ?? payload?.total_count ?? pageOrders.length ?? 0);
        countedStatuses.add(orderStatus);
      }
      orders = [...orders, ...pageOrders];
      remaining = pageSize - orders.length;

      if (nextPageToken) {
        pageToken = nextPageToken;
        nextCursor = stringifyTikTokCursor({ statusIndex, pageToken });
        if (remaining <= 0) break;
        continue;
      }

      statusIndex += 1;
      pageToken = "";
      nextCursor = statusIndex < statuses.length ? stringifyTikTokCursor({ statusIndex, pageToken }) : "";
    }

    for (const orderStatus of statuses) {
      if (countedStatuses.has(orderStatus)) continue;

      const res = await fetchJson("/tiktokshop-partner/api/dev/order/list/filter", {
        method: "POST",
        params: {
          pageSize: 1,
          cipher,
          openId,
          createTimeGe: range.start,
          createTimeLt: range.end,
          updateTimeGe: range.start,
          updateTimeLt: range.end,
          orderStatus,
          isBuyerRequestCancel: buyerCancelValue,
          shippingType: "TIKTOK",
          sortField: "create_time",
          sortOrder: "DESC",
        },
      });

      const payload = res?.data || res?.body?.data || res;
      totalCount += Number(payload?.totalCount ?? payload?.total_count ?? payload?.orders?.length ?? 0);
    }

    return {
      orders: orders.map((order) => normalizeTikTokOrder(order, context)),
      hasMore: Boolean(nextCursor),
      nextCursor,
      totalCount,
      hasKnownTotal: true,
    };
  }

  for (const orderStatus of statuses) {
    for (const isBuyerRequestCancel of buyerCancelValues) {
      let pageToken = "";

      do {
        const res = await fetchJson("/tiktokshop-partner/api/dev/order/list/filter", {
          method: "POST",
          params: {
            pageSize: 50,
            cipher,
            openId,
            createTimeGe: range.start,
            createTimeLt: range.end,
            updateTimeGe: range.start,
            updateTimeLt: range.end,
            orderStatus,
            isBuyerRequestCancel,
            shippingType: "TIKTOK",
            sortField: "create_time",
            sortOrder: "DESC",
            pageToken,
          },
        });

        const payload = res?.data || res?.body?.data || res;
        const pageOrders = payload?.orders || [];
        orders = [...orders, ...pageOrders];
        pageToken = payload?.nextPageToken || payload?.next_page_token || "";
      } while (pageToken);
    }
  }

  return orders.map((order) => normalizeTikTokOrder(order, context));
};

const getSearchTerms = (search, searchType) => {
  const query = String(search || "").trim().toLowerCase();
  if (!query) return [];
  if (searchType !== "Batch Search") return [query];
  return query.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);
};

const filterOrders = (orders, { search, searchType, skuType }) => {
  const q = String(search || "").trim().toLowerCase();
  if (!q) return orders;
  const field = SEARCH_FIELD_MAP[skuType] || "sku";
  const terms = getSearchTerms(search, searchType);

  return orders.filter((order) => {
    const value = String(order?.[field] || "").toLowerCase();
    return terms.some((term) => value.includes(term));
  });
};

const getOrderIdentity = (order) =>
  String(order?.rawId || order?.orderNo || order?.order_sn || order?.id || "");

const filterByFailedPackIds = (rows, failedOrderIds = [], { includeFailed }) => {
  const failedOrderSet = new Set(failedOrderIds.map(String));
  const keepOrder = (order) => {
    const isFailed = failedOrderSet.has(getOrderIdentity(order));
    return includeFailed ? isFailed : !isFailed;
  };

  if (rows && !Array.isArray(rows) && Array.isArray(rows.orders)) {
    return {
      ...rows,
      orders: rows.orders.filter(keepOrder),
    };
  }

  return Array.isArray(rows) ? rows.filter(keepOrder) : rows;
};

const filterByTrackedOrderIds = (rows, orderIds = [], { includeTracked }) => {
  const orderSet = new Set(orderIds.map(String));
  const keepOrder = (order) => {
    const isTracked = orderSet.has(getOrderIdentity(order));
    return includeTracked ? isTracked : !isTracked;
  };

  if (rows && !Array.isArray(rows) && Array.isArray(rows.orders)) {
    return {
      ...rows,
      orders: rows.orders.filter(keepOrder),
    };
  }

  return Array.isArray(rows) ? rows.filter(keepOrder) : rows;
};


export const fetchManualOrders = async ({ search, searchType, skuType }) => {
  const res = await platformApi.get("/manual_order");
  const rows = unwrapApiData(res);
  const normalized = rows.map((order, index) => {
    const items = order.items || order.products || order.orderItems || [];
    const firstItem = items[0] || {};
    const orderNo = order.orderNumber || order.order_no || order.orderNo || order.id || `MANUAL-${index + 1}`;
    const subtotal = Number(order.subtotal || order.orderValue || order.total || 0);
    return {
      id: `manual:${order.id || orderNo}`,
      rawId: order.id || orderNo,
      platform: "manual",
      platformLabel: "Manual",
      storeName: order.storeName || "Manual Order",
      storeContext: {},
      pkgNo: order.packageNo || order.warehousePackageNo || orderNo,
      sku: firstItem.sku || firstItem.skuName || order.sku || "-",
      orderNo,
      trackingNo: order.trackingNo || order.trackingNumber || "-",
      price: formatMoney(subtotal, order.currency || ""),
      createdAt: order.createdAt || order.orderTime || "-",
      orderTime: order.orderTime || order.createdAt || "-",
      status: order.status || "To Ship",
      rawStatus: order.status || "",
      image: firstItem.image || firstItem.imageUrl || DEFAULT_IMAGE,
      items,
      raw: order,
    };
  });

  return filterOrders(normalized, { search, searchType, skuType });
};

export const fetchOrders = async ({ context, pageType = "all", tab, search, searchType, skuType, dateRange, pagination }) => {
  if (pageType === "manual") {
    return fetchManualOrders({ search, searchType, skuType });
  }

  const platform = normalizePlatform(context?.platform);
  const isPackFailedTab = pageType === "new" && tab === "Pack Failed";
  const isToPackTab = pageType === "new" && tab === "To Pack";
  const isPushingTab = pageType === "processed" && tab === "Pushing";
  const isPushedSuccessfulTab = pageType === "processed" && tab === "Pushed Successful";
  const isWithdrawTab = pageType === "processed" && tab === "Withdraw";
  let rows = [];

  if (platform === "shopee") {
    rows = await fetchShopeeOrders({ context, pageType, tab, dateRange, pagination });
  } else if (platform === "tiktok") {
    rows = await fetchTikTokOrders({ context, pageType, tab, dateRange, pagination });
  } else {
    return [];
  }

  if (isPackFailedTab || isToPackTab) {
    const failedOrderIds = await getFailedPackOrderIds({ context, platform });
    rows = filterByFailedPackIds(rows, failedOrderIds, { includeFailed: isPackFailedTab });
  }

  if (isPushingTab || isPushedSuccessfulTab) {
    const pushedOrderIds = await getPushSuccessfulOrderIds({ context, platform });
    rows = filterByTrackedOrderIds(rows, pushedOrderIds, { includeTracked: isPushedSuccessfulTab });
  }

  if (isWithdrawTab) {
    const withdrawOrderIds = await getWithdrawOrderIds({ context, platform });
    rows = filterByTrackedOrderIds(rows, withdrawOrderIds, { includeTracked: true });
  }

  if (rows && !Array.isArray(rows) && Array.isArray(rows.orders)) {
    return {
      ...rows,
      orders: filterOrders(rows.orders, { search, searchType, skuType }),
    };
  }

  return filterOrders(rows, { search, searchType, skuType });
};

const getRowsLength = (rows) => {
  if (rows && !Array.isArray(rows) && Array.isArray(rows.orders)) return rows.orders.length;
  return Array.isArray(rows) ? rows.length : 0;
};

export const fetchNewOrderTabCounts = async ({ context, search, searchType, skuType, dateRange, tabs = [] }) => {
  const platform = normalizePlatform(context?.platform);
  const countTabs = tabs.length
    ? tabs
    : ["To Pack", "Packed Successfully", "Pack Failed", "Out Of Stock", "Platform Processing"];

  if (!platform) {
    return countTabs.reduce((counts, tab) => ({ ...counts, [tab]: 0 }), {});
  }

  const entries = await Promise.all(
    countTabs.map(async (tab) => {
      try {
        const rows = await fetchOrders({
          context,
          pageType: "new",
          tab,
          search,
          searchType,
          skuType,
          dateRange,
        });
        return [tab, getRowsLength(rows)];
      } catch (error) {
        console.warn(`New order count could not be loaded for ${tab}.`, error);
        return [tab, 0];
      }
    })
  );

  return Object.fromEntries(entries);
};

export const fetchProcessedOrderTabCounts = async ({ context, search, searchType, skuType, dateRange, tabs = [] }) => {
  const platform = normalizePlatform(context?.platform);
  const countTabs = tabs.length ? tabs : ["Pushing", "Pushed Successful", "Withdraw"];

  if (!platform) {
    return countTabs.reduce((counts, tab) => ({ ...counts, [tab]: 0 }), {});
  }

  const entries = await Promise.all(
    countTabs.map(async (tab) => {
      try {
        const rows = await fetchOrders({
          context,
          pageType: "processed",
          tab,
          search,
          searchType,
          skuType,
          dateRange,
        });
        return [tab, getRowsLength(rows)];
      } catch (error) {
        console.warn(`Processed order count could not be loaded for ${tab}.`, error);
        return [tab, 0];
      }
    })
  );

  return Object.fromEntries(entries);
};

export const fetchCanceledOrderTabCounts = async ({ context, search, searchType, skuType, dateRange, tabs = [] }) => {
  const platform = normalizePlatform(context?.platform);
  const countTabs = tabs.length ? tabs : ["All", "Cancelation Request", "Cancelled"];

  if (!platform) {
    return countTabs.reduce((counts, tab) => ({ ...counts, [tab]: 0 }), {});
  }

  const entries = await Promise.all(
    countTabs.map(async (tab) => {
      try {
        const rows = await fetchOrders({
          context,
          pageType: "canceled",
          tab,
          search,
          searchType,
          skuType,
          dateRange,
        });
        return [tab, getRowsLength(rows)];
      } catch (error) {
        console.warn(`Canceled order count could not be loaded for ${tab}.`, error);
        return [tab, 0];
      }
    })
  );

  return Object.fromEntries(entries);
};

export const fetchOrderDetail = async ({ platform, orderId, context, cachedOrder }) => {
  const normalizedPlatform = normalizePlatform(platform);

  if (cachedOrder?.raw && (normalizedPlatform !== "shopee" || cachedOrder?.items?.length > 0)) {
    return cachedOrder;
  }

  if (normalizedPlatform === "shopee") {
    const details = await fetchShopeeOrderDetails({ context, orderSnList: [orderId] });
    const detail = details[0];
    return detail ? normalizeShopeeOrder(detail, context) : cachedOrder;
  }

  if (normalizedPlatform === "tiktok") {
    // TikTok list/filter already returns a detail-rich row in the Grozziie flow.
    // If no cache is present, refetch recent TikTok rows and match by id.
    const rows = await fetchTikTokOrders({ context, pageType: "all" });
    return rows.find((row) => String(row.rawId) === String(orderId)) || cachedOrder;
  }

  return cachedOrder;
};

const unwrapApiData = (res) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  return res?.data?.data || [];
};

export const searchMerchantSkus = async ({ search, searchType = "sku_name", warehouseId, limit = 50 }) => {
  const qs = new URLSearchParams();
  qs.set("page", "1");
  qs.set("limit", String(limit));
  if (search?.trim()) qs.set("search", search.trim());
  if (searchType) qs.set("skuType", searchType);
  if (warehouseId) qs.set("warehouseId", String(warehouseId));

  const res = await api.get(`/sku-mapping/by-merchant?${qs.toString()}`);
  const rows = unwrapApiData(res);

  return rows.map((sku, index) => ({
    id: sku.id ?? sku.sku_id ?? index,
    name: sku.sku_title || sku.product_name || sku.name || sku.sku_name || "Product",
    sku: sku.sku_name || sku.sku || sku.merchant_sku || "-",
    onHand: Number(sku.on_hand ?? sku.onHand ?? sku.total_inventory ?? 0),
    allocated: Number(sku.allocated ?? sku.allocated_inventory ?? 0),
    available: Number(sku.available_inventory ?? sku.available ?? sku.stock ?? 0),
    warehouseId: sku.warehouse_id || sku.warehouseId || sku.warehouse?.id || sku.stock_warehouse_id || "",
    warehouseName: sku.warehouse?.name || sku.warehouse_name || sku.warehouseName || sku.stock_warehouse_name || "-",
    image: sku.image_url || sku.image || DEFAULT_IMAGE,
    raw: sku,
  }));
};

export const updateOrderItemMapping = ({ order, item, merchantSku }) =>
  platformApi
    .put(`/order-management/order-items/${encodeURIComponent(item.id)}/merchant-mapping`, {
      platform: order.platform,
      orderNo: order.orderNo,
      warehousePackageNo: order.pkgNo,
      merchantSkuId: merchantSku.id,
      merchantSku: merchantSku.sku,
      platformItemId: item.platformItemId,
      quantity: item.quantity,
    })
    .then((res) => res.data ?? res);

export const runOrderAction = ({ action, orders }) =>
  platformApi
    .post(`/order-management/orders/${action}`, {
      orders: orders.map((order) => ({
        id: order.id,
        platform: order.platform,
        orderNo: order.orderNo,
        warehousePackageNo: order.pkgNo,
        rawStatus: order.rawStatus,
      })),
    })
    .then((res) => res.data ?? res);

const readJsonStorage = (key, fallback) => {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJsonStorage = (key, value) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

const getShopeeShopId = (context) =>
  getContextValue(context, ["shop_id", "external_store_id", "store_shop_id"]) ||
  (typeof localStorage !== "undefined" ? localStorage.getItem("shopeeAuthShopId") : "");

const getPreferredPickup = (shippingParamData) => {
  const pickupList = shippingParamData?.body?.response?.pickup?.address_list || [];

  for (const address of pickupList) {
    const recommendedSlot = address?.time_slot_list?.find((slot) =>
      slot?.flags?.includes("recommended")
    );

    if (recommendedSlot) {
      return {
        addressId: address.address_id || null,
        pickupTimeId: recommendedSlot.pickup_time_id || "",
      };
    }
  }

  return {
    addressId: pickupList[0]?.address_id || null,
    pickupTimeId: pickupList[0]?.time_slot_list?.[0]?.pickup_time_id || "",
  };
};

export const packShopeeOrders = async ({ context, orders = [] }) => {
  const shopId = getShopeeShopId(context);
  if (!shopId) throw new Error("Shopee shop ID is missing");

  const selectedShopeeDeliveryType =
    (typeof localStorage !== "undefined" && localStorage.getItem("shopeeDeliveryType")) || "pickup";

  if (typeof localStorage !== "undefined" && !localStorage.getItem("shopeeDeliveryType")) {
    localStorage.setItem("shopeeDeliveryType", "pickup");
  }

  const successfulIds = [];
  const failedOrders = [];

  for (const order of orders) {
    const orderSn = order?.rawId || order?.order_sn || order?.orderId || order?.orderNo;
    if (!orderSn) continue;

    try {
      const shippingParamData = await fetchJson("/shopee-open-shop/api/dev/logistics/get-shipping-parameter", {
        params: {
          shopId,
          orderSn,
        },
      });

      if (shippingParamData?.body?.error) {
        failedOrders.push({
          orderId: orderSn,
          reason: shippingParamData?.body?.message || shippingParamData?.body?.error,
        });
        continue;
      }

      const dropoff = shippingParamData?.body?.response?.dropoff;
      let requestBody;

      if (selectedShopeeDeliveryType === "dropoff") {
        requestBody = {
          order_sn: orderSn,
          package_number: "",
          dropoff,
        };
      } else {
        const { addressId, pickupTimeId } = getPreferredPickup(shippingParamData);

        if (!addressId) {
          failedOrders.push({
            orderId: orderSn,
            reason: "Missing address_id",
          });
          continue;
        }

        requestBody = {
          order_sn: orderSn,
          package_number: "",
          pickup: {
            address_id: addressId,
            pickup_time_id: pickupTimeId || "",
            tracking_number: "",
          },
        };
      }

      const shipData = await fetchJson("/shopee-open-shop/api/dev/logistics/ship-order", {
        method: "POST",
        params: {
          shopId,
        },
        body: requestBody,
      });

      if (!shipData?.body?.error) {
        successfulIds.push(orderSn);

        const stored = readJsonStorage("ShopeePackaging", []);
        if (!stored.includes(orderSn)) {
          writeJsonStorage("ShopeePackaging", [...stored, orderSn]);
        }
      } else {
        failedOrders.push({
          orderId: orderSn,
          reason: shipData?.body?.message || shipData?.body?.error || "Unknown error",
        });
      }
    } catch (error) {
      failedOrders.push({
        orderId: orderSn,
        reason: error?.message || "API request failed",
      });
    }
  }

  return {
    successfulIds,
    failedOrders,
  };
};

const getTikTokOpenId = (context) =>
  getContextValue(context, [
    "platform_open_id",
    "open_id",
    "openId",
    "store_open_id",
    "tiktokOpenId",
    "external_store_name",
  ]) ||
  (typeof localStorage !== "undefined" ? localStorage.getItem("tiktokOpenId") : "");

const getTikTokCipher = (context) =>
  getContextValue(context, [
    "cipher",
    "store_cipher",
    "auth_cipher",
    "tiktokAuthCipher",
    "external_store_id",
  ]) ||
  (typeof localStorage !== "undefined" ? localStorage.getItem("tiktokAuthCipher") : "");

const getTikTokOrderPackageId = (order) =>
  order?.lineItems?.[0]?.packageId ||
  order?.items?.[0]?.packageId ||
  order?.raw?.lineItems?.[0]?.packageId ||
  order?.raw?.line_items?.[0]?.package_id ||
  order?.raw?.packageId ||
  order?.pkgNo;

const getTikTokShippingProviderId = (order) =>
  order?.shippingProviderId ||
  order?.raw?.shippingProviderId ||
  order?.raw?.shipping_provider_id ||
  order?.raw?.shippingProvider?.id ||
  order?.raw?.shipping_provider?.id ||
  "";

const isTikTokShipSuccess = (result) => {
  const code = result?.code ?? result?.data?.code ?? result?.body?.code;
  const error = result?.error ?? result?.data?.error ?? result?.body?.error;
  const message = String(result?.message || result?.data?.message || result?.body?.message || "").toLowerCase();

  if (error) return false;
  if (code !== undefined && ![0, "0", "success", "SUCCESS", "OK"].includes(code)) return false;
  if (message.includes("error") || message.includes("fail")) return false;
  return true;
};

export const packTikTokOrders = async ({ context, orders = [] }) => {
  const openId = getTikTokOpenId(context);
  const cipher = getTikTokCipher(context);

  if (!openId) throw new Error("TikTok open ID is missing");
  if (!cipher) throw new Error("TikTok auth cipher is missing");

  const selectedTikTokDeliveryType =
    (typeof localStorage !== "undefined" && localStorage.getItem("tikTokDeliveryType")) || "pickup";

  const successfulIds = [];
  const failedOrders = [];

  await Promise.all(
    orders.map(async (order) => {
      const orderId = order?.rawId || order?.id || order?.orderNo;
      const packageId = getTikTokOrderPackageId(order);
      const shippingProviderId = getTikTokShippingProviderId(order);

      if (!packageId || packageId === "-") {
        failedOrders.push({
          orderId,
          reason: "Missing packageId",
        });
        return;
      }

      try {
        const result = await fetchJson("/tiktokshop-partner/api/dev/package/ship-package-new", {
          method: "POST",
          params: {
            cipher,
            openId,
          },
          body: {
            packageId,
            trackingNumber: `TEST-${Date.now()}`,
            shippingProviderId,
            pickupStartTime: 0,
            pickupEndTime: 0,
            handoverMethod: selectedTikTokDeliveryType === "dropoff" ? "DROP_OFF" : "PICKUP",
          },
        });

        if (isTikTokShipSuccess(result)) {
          successfulIds.push(orderId);
        } else {
          failedOrders.push({
            orderId,
            reason: result?.message || result?.error || result?.body?.message || "TikTok package API failed",
          });
        }
      } catch (error) {
        failedOrders.push({
          orderId,
          reason: error?.message || "TikTok package API failed",
        });
      }
    })
  );

  return {
    successfulIds,
    failedOrders,
  };
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const base64ToPdfUrl = (base64) => {
  const cleanBase64 = String(base64 || "").replace(/^data:application\/pdf;base64,/, "");
  if (!isValidBase64(cleanBase64)) {
    throw new Error("Invalid PDF response");
  }

  const byteChars = atob(cleanBase64);
  const byteNumbers = new Array(byteChars.length);

  for (let i = 0; i < byteChars.length; i += 1) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const pdfBlob = new Blob([byteArray], { type: "application/pdf" });
  return URL.createObjectURL(pdfBlob);
};

const isValidBase64 = (value) => {
  const text = String(value || "").trim();
  if (!text || text.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(text);
};

const safeAtob = (value) => {
  const text = String(value || "").trim();
  if (!isValidBase64(text)) return "";
  try {
    return atob(text);
  } catch {
    return "";
  }
};

const parsePdfBase64FromText = (text) => {
  try {
    const json = JSON.parse(text);
    if (json?.body) return json.body;
  } catch {
    // Keep trying other response shapes below.
  }

  const decoded = safeAtob(text);
  if (decoded) {
    try {
      const json = JSON.parse(decoded);
      if (json?.body) return json.body;
    } catch {
      // Some environments return the PDF itself instead of a JSON wrapper.
    }
  }

  return "";
};

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const getDownloadedPdfBase64 = async (blob) => {
  const clonedBlob = blob.slice(0, blob.size, blob.type);
  const text = await clonedBlob.text();
  const parsedFromText = parsePdfBase64FromText(text);
  if (parsedFromText) return parsedFromText;

  const blobBase64 = await blobToBase64(blob);
  const parsedFromBase64 = parsePdfBase64FromText(blobBase64);
  return parsedFromBase64 || blobBase64;
};

const getCurrentUserEmail = () => {
  const storedUser = readJsonStorage("warehouseUser", {});
  const authUser = readJsonStorage("auth-storage", {});
  return (
    storedUser?.email ||
    storedUser?.userEmail ||
    authUser?.state?.user?.email ||
    authUser?.state?.token?.email ||
    ""
  );
};

export const generateShopeeAwbPdf = async ({ context, orders = [], fromStatus = "" }) => {
  const shopId = getShopeeShopId(context);
  if (!shopId) throw new Error("Shopee shop ID is missing");

  const status = String(fromStatus || "").toUpperCase();
  const skipStatuses = ["PROCESSED_PRINTED", "SHIPPED", "READY_TO_SHIP", "COMPLETED"];
  const pdfBase64Array = [];
  const printedOrderIds = [];
  const failedOrders = [];

  try {
    await fetchJson("/shopee-open-shop/api/dev/logistics/get-channel-list", {
      params: {
        shopId,
      },
    });
  } catch {
    // Channel list is not required for the current preview UI.
  }

  for (const order of orders) {
    const orderSn = order?.rawId || order?.order_sn || order?.orderId || order?.orderNo;
    if (!orderSn) continue;

    try {
      const docTypeData = await fetchJson("/shopee-open-shop/api/dev/logistics/get-shipping-document-parameter", {
        method: "POST",
        params: {
          shopId,
        },
        body: {
          order_list: [{ order_sn: orderSn }],
        },
      });

      const shippingDocType =
        docTypeData?.body?.response?.result_list?.[0]?.suggest_shipping_document_type ||
        "THERMAL_AIR_WAYBILL";

      if (!skipStatuses.includes(status)) {
        const trackingData = await fetchJson("/shopee-open-shop/api/dev/logistics/get-tracking-number", {
          params: {
            shopId,
            orderSn,
            packageNumber: "-",
            responseOptionalFields: "first_mile_tracking_number",
          },
        });

        const trackingNumber = trackingData?.body?.response?.tracking_number || "";

        await fetchJson("/shopee-open-shop/api/dev/logistics/create-shipping-document", {
          method: "POST",
          params: {
            shopId,
          },
          body: {
            order_list: [
              {
                order_sn: orderSn,
                package_number: order?.raw?.package_list?.[0]?.package_number || "",
                shipping_document_type: shippingDocType,
                tracking_number: trackingNumber,
              },
            ],
          },
        });

        await delay(1000);
      }

      const pdfBlob = await fetchBlob("/shopee-open-shop/api/dev/logistics/download-shipping-document", {
        method: "POST",
        params: {
          shopId,
        },
        body: {
          shipping_document_type: shippingDocType,
          order_list: [{ order_sn: orderSn }],
        },
      });

      const pdfBase64 = await getDownloadedPdfBase64(pdfBlob);
      if (isValidBase64(pdfBase64)) {
        pdfBase64Array.push(pdfBase64);
        printedOrderIds.push(orderSn);
      } else {
        failedOrders.push({
          orderId: orderSn,
          reason: "Invalid PDF response",
        });
      }
    } catch (error) {
      failedOrders.push({
        orderId: orderSn,
        reason: error?.message || "Failed to process Shopee order",
      });
    }
  }

  if (pdfBase64Array.length === 0) {
    return { pdfUrl: "", printedOrderIds, failedOrders };
  }

  let pdfUrl = "";

  if (pdfBase64Array.length === 1) {
    pdfUrl = base64ToPdfUrl(pdfBase64Array[0]);
  } else {
    const mergeRes = await fetch(`${getMergeApiBase()}/tht/merge-pdfs-base64`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdfs: pdfBase64Array }),
    });
    const mergeData = await mergeRes.json();
    pdfUrl = base64ToPdfUrl(mergeData?.pdfBase64 || "");
  }

  if (!skipStatuses.includes(status)) {
    const email = getCurrentUserEmail();
    await Promise.all(
      printedOrderIds.map((orderSn) => {
        const params = new URLSearchParams({
          shopeePrintedId: orderSn,
          email,
        });
        return fetch(`${getPlatformApiBase()}/tiktokshop-print/api/dev/shopee/printedIds/add?${params.toString()}`, {
          method: "POST",
        }).catch(() => null);
      })
    );
  }

  return {
    pdfUrl,
    printedOrderIds,
    failedOrders,
  };
};

const getTikTokPrintPreference = () => {
  const saved =
    typeof localStorage !== "undefined" ? localStorage.getItem("tiktokPrintingLebel") : "";

  if (!saved) return "SHIPPING_LABEL";

  try {
    const parsed = JSON.parse(saved);
    if (parsed === 3) return "SHIPPING_LABEL_AND_PACKING_SLIP";
    if (parsed === 2) return "PACKING_SLIP";
  } catch {
    // Fall back to the default label below.
  }

  return "SHIPPING_LABEL";
};

export const generateTikTokAwbPdf = async ({ context, orders = [], fromStatus = "" }) => {
  const openId = getTikTokOpenId(context);
  const cipher = getTikTokCipher(context);

  if (!openId) throw new Error("TikTok open ID is missing");
  if (!cipher) throw new Error("TikTok auth cipher is missing");

  const documentType = getTikTokPrintPreference();
  const failedOrders = [];
  const printedOrderIds = [];
  const status = String(fromStatus || "").toUpperCase();

  const docUrls = await Promise.all(
    orders.map(async (order) => {
      const orderId = order?.rawId || order?.id || order?.orderNo;
      const packageId = getTikTokOrderPackageId(order);

      if (!packageId || packageId === "-") {
        failedOrders.push({
          orderId,
          reason: "Missing packageId",
        });
        return null;
      }

      try {
        const data = await fetchJson("/tiktokshop-partner/api/dev/package/ship-doc/new", {
          params: {
            openId,
            cipher,
            packageId,
            documentType,
            documentSize: "A6",
            documentFormat: "PDF",
          },
        });

        const docUrl = data?.data?.docUrl || data?.body?.data?.docUrl || data?.docUrl || "";

        if (!docUrl) {
          failedOrders.push({
            orderId,
            reason: data?.message || "No valid label URL returned",
          });
          return null;
        }

        if (status === "AWAITING_COLLECTION") {
          const email = getCurrentUserEmail();
          const params = new URLSearchParams({
            tikTokPrintedId: String(orderId || ""),
            email,
          });

          await fetch(`${getPlatformApiBase()}/tiktokshop-print/api/dev/printedIds/add?${params.toString()}`, {
            method: "POST",
          }).catch(() => null);
          printedOrderIds.push(orderId);
        }

        return docUrl;
      } catch (error) {
        failedOrders.push({
          orderId,
          reason: error?.message || "Failed to fetch TikTok shipping label",
        });
        return null;
      }
    })
  );

  const validUrls = docUrls.filter(Boolean);
  if (validUrls.length === 0) {
    return { pdfUrl: "", printedOrderIds, failedOrders };
  }

  const mergeRes = await fetch(`${getMergeApiBase()}/tht/merge-pdfs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls: validUrls }),
  });

  if (!mergeRes.ok) {
    throw new Error("Failed to merge TikTok PDFs");
  }

  const blob = await mergeRes.blob();
  return {
    pdfUrl: URL.createObjectURL(blob),
    printedOrderIds,
    failedOrders,
  };
};

export const createManualOrder = (payload) =>
  platformApi.post("/manual_order", payload).then((res) => res.data ?? res);

export const searchWarehouseProducts = async ({ search }) => {
  const qs = new URLSearchParams();
  qs.set("page", "1");
  qs.set("limit", "50");
  if (search?.trim()) qs.set("search", search.trim());

  const res = await api.get(`/sku-mapping/by-merchant?${qs.toString()}`);
  const rows = unwrapApiData(res);

  return rows.map((sku, index) => ({
    id: sku.id ?? sku.sku_id ?? index,
    name: sku.sku_title || sku.product_name || sku.name || sku.sku_name || "Product",
    sku: sku.sku_name || sku.sku || sku.merchant_sku || "-",
    weight: Number(sku.weight || sku.package_weight || 0),
    unitPrice: Number(sku.unit_price || sku.price || sku.sale_price || 0),
    available: Number(sku.available_inventory ?? sku.available ?? sku.stock ?? 0),
    image: sku.image_url || sku.image || DEFAULT_IMAGE,
    raw: sku,
  }));
};
