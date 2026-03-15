// ─────────────────────────────────────────────────────────────────────────────
// Shared mock data for Inventory Management module
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_SKUS = [
    { id: 1, skuName: "WM-012", skuTitle: "WM-012", weight: "12 kg", size: "0*0*0", createdAt: "01 Dec 2025  16:20", updatedAt: "01 Dec 2025  16:20", image: "https://placehold.co/36x36/1a1a2e/fff?text=M" },
    { id: 2, skuName: "KB-045", skuTitle: "KB-045", weight: "15 kg", size: "1*1*1", createdAt: "02 Dec 2025  17:30", updatedAt: "02 Dec 2025  17:30", image: "https://placehold.co/36x36/16213e/fff?text=K" },
    { id: 3, skuName: "SSD-123", skuTitle: "SSD-123", weight: "20 kg", size: "2*2*2", createdAt: "03 Dec 2025  18:45", updatedAt: "03 Dec 2025  18:45", image: "https://placehold.co/36x36/0f3460/fff?text=S" },
    { id: 4, skuName: "HP-678", skuTitle: "HP-678", weight: "25 kg", size: "3*4*5", createdAt: "04 Dec 2025  19:00", updatedAt: "04 Dec 2025  19:00", image: "https://placehold.co/36x36/533483/fff?text=H" },
    { id: 5, skuName: "WC-234", skuTitle: "WC-234", weight: "30 kg", size: "4*6*8", createdAt: "05 Dec 2025  20:15", updatedAt: "05 Dec 2025  20:15", image: "https://placehold.co/36x36/2b2d42/fff?text=W" },
    { id: 6, skuName: "SH-456", skuTitle: "SH-456", weight: "35 kg", size: "5*10*15", createdAt: "06 Dec 2025  21:30", updatedAt: "06 Dec 2025  21:30", image: "https://placehold.co/36x36/8d99ae/004368?text=S" },
    { id: 7, skuName: "BP-789", skuTitle: "BP-789", weight: "40 kg", size: "6*12*18", createdAt: "07 Dec 2025  22:00", updatedAt: "07 Dec 2025  22:00", image: "https://placehold.co/36x36/3a3a3c/fff?text=B" },
    { id: 8, skuName: "CP-321", skuTitle: "CP-321", weight: "45 kg", size: "7*14*21", createdAt: "08 Dec 2025  23:15", updatedAt: "08 Dec 2025  23:15", image: "https://placehold.co/36x36/004368/fff?text=C" },
    { id: 9, skuName: "CC-987", skuTitle: "CC-987", weight: "50 kg", size: "8*16*24", createdAt: "09 Dec 2025  00:30", updatedAt: "09 Dec 2025  00:30", image: "https://placehold.co/36x36/1b4332/fff?text=H" },
    { id: 10, skuName: "GR-222", skuTitle: "GR-222", weight: "55 kg", size: "9*18*27", createdAt: "10 Dec 2025  01:45", updatedAt: "10 Dec 2025  01:45", image: "https://placehold.co/36x36/212529/fff?text=G" },
];

export const MOCK_SKU_MAPPING_PRODUCTS = [
    { id: 1, name: "Ergonomic wireless mouse with 3k...", productId: "WM-012", storeName: "Pexas", parentSku: "WM-012", variationName: "Pexas", sku: "WM-012", merchantSku: "WM-012", image: "https://placehold.co/36x36/1a1a2e/fff?text=M" },
    { id: 2, name: "Compact mechanical keyboard with...", productId: "KB-045", storeName: "Qudon", parentSku: "KB-045", variationName: "Qudon", sku: "KB-045", merchantSku: "KB-045", image: "https://placehold.co/36x36/16213e/fff?text=K" },
    { id: 3, name: "Portable external SSD 1TB", productId: "SSD-123", storeName: "Rivex", parentSku: "SSD-123", variationName: "Rivex", sku: "SSD-123", merchantSku: "SSD-123", image: "https://placehold.co/36x36/0f3460/fff?text=S" },
    { id: 4, name: "Noise-cancelling over-ear headphones", productId: "HP-678", storeName: "Silex", parentSku: "HP-678", variationName: "Silex", sku: "HP-678", merchantSku: "HP-678", image: "https://placehold.co/36x36/533483/fff?text=H" },
    { id: 5, name: "High-definition webcam 1080p", productId: "WC-234", storeName: "Tafor", parentSku: "WC-234", variationName: "Tafor", sku: "WC-234", merchantSku: "WC-234", image: "https://placehold.co/36x36/2b2d42/fff?text=W" },
    { id: 6, name: "Smartphone holder with adjustable ..", productId: "SH-456", storeName: "Uvenis", parentSku: "SH-456", variationName: "Uvenis", sku: "SH-456", merchantSku: "SH-456", image: "https://placehold.co/36x36/8d99ae/004368?text=S" },
    { id: 7, name: "Ultra-slim laptop backpack", productId: "BP-789", storeName: "Vexor", parentSku: "BP-789", variationName: "Vexor", sku: "BP-789", merchantSku: "BP-789", image: "https://placehold.co/36x36/3a3a3c/fff?text=B" },
    { id: 8, name: "Wireless charging pad for smartphones", productId: "CP-321", storeName: "Wivano", parentSku: "CP-321", variationName: "Wivano", sku: "CP-321", merchantSku: "CP-321", image: "https://placehold.co/36x36/004368/fff?text=C" },
    { id: 9, name: "High-speed HDMI cable 6ft", productId: "CC-987", storeName: "Xalper", parentSku: "CC-987", variationName: "Xalper", sku: "CC-987", merchantSku: "CC-987", image: "https://placehold.co/36x36/1b4332/fff?text=H" },
    { id: 10, name: "Smart home hub for automation", productId: "GR-222", storeName: "Yuntra", parentSku: "GR-222", variationName: "Yuntra", sku: "GR-222", merchantSku: "GR-222", image: "https://placehold.co/36x36/212529/fff?text=G" },
];

export const MOCK_MERCHANT_SKU_MAPPING = [
    { id: 1, name: "Ergonomic wireless mouse with 3k...", mappedStoreSku: 15, image: "https://placehold.co/36x36/1a1a2e/fff?text=M" },
    { id: 2, name: "Compact mechanical keyboard with...", mappedStoreSku: 20, image: "https://placehold.co/36x36/16213e/fff?text=K" },
    { id: 3, name: "Portable external SSD 1TB", mappedStoreSku: 25, image: "https://placehold.co/36x36/0f3460/fff?text=S" },
    { id: 4, name: "Noise-cancelling over-ear headphones", mappedStoreSku: 30, image: "https://placehold.co/36x36/533483/fff?text=H" },
    { id: 5, name: "High-definition webcam 1080p", mappedStoreSku: 35, image: "https://placehold.co/36x36/2b2d42/fff?text=W" },
    { id: 6, name: "Smartphone holder with adjustable ..", mappedStoreSku: 40, image: "https://placehold.co/36x36/8d99ae/004368?text=S" },
    { id: 7, name: "Ultra-slim laptop backpack", mappedStoreSku: 45, image: "https://placehold.co/36x36/3a3a3c/fff?text=B" },
    { id: 8, name: "Wireless charging pad for smartphones", mappedStoreSku: 50, image: "https://placehold.co/36x36/004368/fff?text=C" },
    { id: 9, name: "High-speed HDMI cable 6ft", mappedStoreSku: 55, image: "https://placehold.co/36x36/1b4332/fff?text=H" },
    { id: 10, name: "Smart home hub for automation", mappedStoreSku: 60, image: "https://placehold.co/36x36/212529/fff?text=G" },
];

export const MOCK_INVENTORY_LOG = [
    { id: 1, sl: "01", sellerSku: "WM-012", stockIn: 15, stockOut: 15, remaining: 15, operationTime: "01 Dec 2025  16:20" },
    { id: 2, sl: "02", sellerSku: "KB-045", stockIn: 20, stockOut: 20, remaining: 20, operationTime: "02 Dec 2025  17:30" },
    { id: 3, sl: "03", sellerSku: "SSD-123", stockIn: 0, stockOut: 0, remaining: 0, operationTime: "03 Dec 2025  18:45" },
    { id: 4, sl: "04", sellerSku: "HP-678", stockIn: 30, stockOut: 30, remaining: 30, operationTime: "04 Dec 2025  19:00" },
    { id: 5, sl: "05", sellerSku: "WC-234", stockIn: 35, stockOut: 35, remaining: 35, operationTime: "05 Dec 2025  20:15" },
    { id: 6, sl: "06", sellerSku: "SH-456", stockIn: 40, stockOut: 40, remaining: 40, operationTime: "06 Dec 2025  21:30" },
    { id: 7, sl: "07", sellerSku: "BP-789", stockIn: 9, stockOut: 9, remaining: 9, operationTime: "07 Dec 2025  22:00" },
    { id: 8, sl: "08", sellerSku: "CP-321", stockIn: 50, stockOut: 50, remaining: 50, operationTime: "08 Dec 2025  23:15" },
    { id: 9, sl: "09", sellerSku: "CC-987", stockIn: 55, stockOut: 55, remaining: 55, operationTime: "09 Dec 2025  00:30" },
    { id: 10, sl: "10", sellerSku: "GR-222", stockIn: 0, stockOut: 0, remaining: 0, operationTime: "10 Dec 2025  01:45" },
];

export const MOCK_INBOUND_LIST = [
    { id: 1, inboundId: "WM-012", warehouseName: "Tech Haven Warehouse", estimatedArrival: "01 Dec 2025  16:20", image: "https://placehold.co/36x36/1a1a2e/fff?text=M" },
    { id: 2, inboundId: "KB-045", warehouseName: "Green Valley Logistics", estimatedArrival: "02 Dec 2025  17:30", image: "https://placehold.co/36x36/16213e/fff?text=K" },
    { id: 3, inboundId: "SSD-123", warehouseName: "Skyline Distribution Center", estimatedArrival: "03 Dec 2025  18:45", image: "https://placehold.co/36x36/0f3460/fff?text=S" },
    { id: 4, inboundId: "HP-678", warehouseName: "Ocean View Shipping", estimatedArrival: "04 Dec 2025  19:00", image: "https://placehold.co/36x36/533483/fff?text=H" },
    { id: 5, inboundId: "WC-234", warehouseName: "Mountain Peak Freight", estimatedArrival: "05 Dec 2025  20:15", image: "https://placehold.co/36x36/2b2d42/fff?text=W" },
    { id: 6, inboundId: "SH-456", warehouseName: "Urban Express Couriers", estimatedArrival: "06 Dec 2025  21:30", image: "https://placehold.co/36x36/8d99ae/004368?text=S" },
    { id: 7, inboundId: "BP-789", warehouseName: "Valley Forge Transport", estimatedArrival: "07 Dec 2025  22:00", image: "https://placehold.co/36x36/3a3a3c/fff?text=B" },
    { id: 8, inboundId: "CP-321", warehouseName: "Riverbend Supply Chain", estimatedArrival: "08 Dec 2025  23:15", image: "https://placehold.co/36x36/004368/fff?text=C" },
    { id: 9, inboundId: "CC-987", warehouseName: "Summit Point Logistics", estimatedArrival: "09 Dec 2025  00:30", image: "https://placehold.co/36x36/1b4332/fff?text=H" },
    { id: 10, inboundId: "GR-222", warehouseName: "Pine Grove Warehousing", estimatedArrival: "10 Dec 2025  01:45", image: "https://placehold.co/36x36/212529/fff?text=G" },
];

export const WAREHOUSES = ["Warehouse name here", "Warehouse A", "Warehouse B", "Warehouse C"];
export const PLATFORMS = ["Platform Name Here", "Shopee", "Lazada", "TikTok"];
export const SHOPS = ["Shop Name Here", "Shop A", "Shop B"];
export const SKU_TYPES = ["SKU", "Product Name", "Item ID", "SKU ID"];
export const LOG_TYPES = ["Recent", "All", "Stock In", "Stock Out"];
export const STATUS_OPTS = ["All", "Not Mapped", "Mapped"];