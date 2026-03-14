// ─────────────────────────────────────────────────────────────────────────────
// Shared mock order data — used by all order list pages
// Replace with real API calls (React Query) when backend is ready
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_ORDERS = [
    { id: 1, pkgNo: "WM-012", sku: "WM-012", orderNo: "TS14521", trackingNo: "1Z8F42W90381274625", price: "$15.01", createdAt: "01 Dec 2025  16:20", status: "To Ship", image: "https://placehold.co/36x36/1a1a2e/fff?text=M" },
    { id: 2, pkgNo: "KB-045", sku: "KB-045", orderNo: "TS14522", trackingNo: "1Z8F42W90381274626", price: "$20.00", createdAt: "02 Dec 2025  17:30", status: "To Ship", image: "https://placehold.co/36x36/16213e/fff?text=K" },
    { id: 3, pkgNo: "SSD-123", sku: "SSD-123", orderNo: "TS14523", trackingNo: "1Z8F42W90381274627", price: "$25.50", createdAt: "03 Dec 2025  18:45", status: "To Ship", image: "https://placehold.co/36x36/0f3460/fff?text=S" },
    { id: 4, pkgNo: "HP-678", sku: "HP-678", orderNo: "TS14524", trackingNo: "1Z8F42W90381274628", price: "$30.75", createdAt: "04 Dec 2025  19:00", status: "To Ship", image: "https://placehold.co/36x36/533483/fff?text=H" },
    { id: 5, pkgNo: "WC-234", sku: "WC-234", orderNo: "TS14525", trackingNo: "1Z8F42W90381274629", price: "$35.99", createdAt: "05 Dec 2025  20:15", status: "To Ship", image: "https://placehold.co/36x36/2b2d42/fff?text=W" },
    { id: 6, pkgNo: "SH-456", sku: "SH-456", orderNo: "TS14526", trackingNo: "1Z8F42W90381274630", price: "$40.00", createdAt: "06 Dec 2025  21:30", status: "To Ship", image: "https://placehold.co/36x36/8d99ae/004368?text=S" },
    { id: 7, pkgNo: "BP-789", sku: "BP-789", orderNo: "TS14527", trackingNo: "1Z8F42W90381274631", price: "$45.25", createdAt: "07 Dec 2025  22:00", status: "To Ship", image: "https://placehold.co/36x36/3a3a3c/fff?text=B" },
    { id: 8, pkgNo: "CP-321", sku: "CP-321", orderNo: "TS14528", trackingNo: "1Z8F42W90381274632", price: "$50.80", createdAt: "08 Dec 2025  23:15", status: "To Ship", image: "https://placehold.co/36x36/004368/fff?text=C" },
    { id: 9, pkgNo: "CC-987", sku: "CC-987", orderNo: "TS14529", trackingNo: "1Z8F42W90381274633", price: "$55.00", createdAt: "09 Dec 2025  00:30", status: "To Ship", image: "https://placehold.co/36x36/1b4332/fff?text=H" },
    { id: 10, pkgNo: "GR-222", sku: "GR-222", orderNo: "TS14530", trackingNo: "1Z8F42W90381274634", price: "$60.15", createdAt: "10 Dec 2025  01:45", status: "To Ship", image: "https://placehold.co/36x36/212529/fff?text=G" },
];

export const MOCK_PROCESSED_ORDERS = MOCK_ORDERS.map((o) => ({ ...o, status: "Processed" }));
export const MOCK_PICKUP_ORDERS = MOCK_ORDERS.map((o) => ({ ...o, status: "Processed" }));
export const MOCK_SHIPPED_ORDERS = MOCK_ORDERS.map((o) => ({ ...o, status: "Shipping" }));
export const MOCK_COMPLETED_ORDERS = MOCK_ORDERS.map((o) => ({ ...o, status: "Completed" }));
export const MOCK_CANCELLED_ORDERS = MOCK_ORDERS.map((o) => ({ ...o, status: "Cancelled" }));

export const MOCK_ALL_ORDERS = [
    ...MOCK_ORDERS.slice(0, 3).map((o) => ({ ...o, status: "Shipping" })),
    ...MOCK_ORDERS.slice(3, 5).map((o) => ({ ...o, status: "Completed" })),
    ...MOCK_ORDERS.slice(5, 7).map((o) => ({ ...o, status: "Shipping" })),
    ...MOCK_ORDERS.slice(7, 9).map((o) => ({ ...o, status: "Completed" })),
    ...MOCK_ORDERS.slice(9).map((o) => ({ ...o, status: "Shipping" })),
];

export const PLATFORMS = ["Platform Name Here", "Shopee", "Lazada", "TikTok"];
export const STORES = ["Store Name Here", "Store A", "Store B", "Store C"];
export const SEARCH_TYPES = ["Single Search", "Batch Search"];
export const SKU_TYPES = ["SKU", "Order Number", "Tracking Number"];